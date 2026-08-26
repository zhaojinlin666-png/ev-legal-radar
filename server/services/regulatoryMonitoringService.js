import { createHash } from 'node:crypto'
import { fetch as undiciFetch, ProxyAgent } from 'undici'
import {
  REGULATORY_MONITORING_REQUEST,
  REGULATORY_MONITORING_SOURCE,
  REGULATORY_RELEVANCE_KEYWORDS,
} from '../data/regulatoryMonitoringConfig.js'

const LIST_ITEM_PATTERN =
  /<li\b[^>]*>\s*<h5\b[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>\s*<\/h5>\s*<div\b[^>]*class\s*=\s*['"]times['"][^>]*>([\s\S]*?)<\/div>\s*<\/li>/giu

let monitoringProxyAgent

export class RegulatoryMonitoringError extends Error {
  constructor(publicMessage, options = {}) {
    super(publicMessage, options)
    this.name = 'RegulatoryMonitoringError'
    this.publicMessage = publicMessage
    this.statusCode = options.statusCode ?? 502
    this.code = options.code ?? 'REGULATORY_MONITORING_FAILED'
  }
}

function getMonitoringProxyUrl() {
  return (
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    null
  )
}

function getMonitoringProxyAgent() {
  const proxyUrl = getMonitoringProxyUrl()

  if (!proxyUrl) return null

  monitoringProxyAgent ||= new ProxyAgent(proxyUrl)
  return monitoringProxyAgent
}

async function monitoringFetch(url, options) {
  const dispatcher = getMonitoringProxyAgent()

  return undiciFetch(url, {
    ...options,
    ...(dispatcher ? { dispatcher } : {}),
  })
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/giu,
    (entity, token) => {
      if (token.startsWith('#x')) {
        return String.fromCodePoint(Number.parseInt(token.slice(2), 16))
      }

      if (token.startsWith('#')) {
        return String.fromCodePoint(Number.parseInt(token.slice(1), 10))
      }

      return namedEntities[token.toLowerCase()] ?? entity
    },
  )
}

function stripHtml(value) {
  return decodeHtmlEntities(value.replace(/<[^>]+>/gu, ' '))
    .replace(/\s+/gu, ' ')
    .trim()
}

function stripOfficialContentHtml(value) {
  return stripHtml(
    value
      .replace(/<!--([\s\S]*?)-->/gu, ' ')
      .replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/giu, ' ')
      .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/giu, '\n'),
  )
    .replace(/\s*\n\s*/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()
}

function getAttribute(attributes, name) {
  const quotedPattern = new RegExp(
    `\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,
    'iu',
  )
  const quotedMatch = attributes.match(quotedPattern)

  if (quotedMatch) return decodeHtmlEntities(quotedMatch[2].trim())

  const unquotedPattern = new RegExp(`\\b${name}\\s*=\\s*([^\\s>]+)`, 'iu')
  const unquotedMatch = attributes.match(unquotedPattern)

  return unquotedMatch ? decodeHtmlEntities(unquotedMatch[1].trim()) : null
}

export function normalizeSourceUrl(
  sourceUrl,
  baseUrl = REGULATORY_MONITORING_SOURCE.url,
) {
  if (typeof sourceUrl !== 'string' || sourceUrl.trim().length === 0) {
    return null
  }

  try {
    const normalizedUrl = new URL(sourceUrl.trim(), baseUrl)

    if (
      normalizedUrl.protocol !== 'https:' ||
      !REGULATORY_MONITORING_SOURCE.allowedHostnames.includes(
        normalizedUrl.hostname.toLowerCase(),
      )
    ) {
      return null
    }

    normalizedUrl.hash = ''
    return normalizedUrl.toString()
  } catch {
    return null
  }
}

function normalizePublicationDate(value) {
  const normalizedValue = stripHtml(value)
  return /^\d{4}-\d{2}-\d{2}$/u.test(normalizedValue)
    ? normalizedValue
    : null
}

export function createExternalId({ sourceUrl, title, publicationDate }) {
  const canonicalIdentity = sourceUrl
    ? `url:${sourceUrl}`
    : `metadata:${REGULATORY_MONITORING_SOURCE.name}|${title}|${publicationDate || ''}`

  return `cac-${createHash('sha256')
    .update(canonicalIdentity)
    .digest('hex')
    .slice(0, 24)}`
}

export function normalizeDiscoveredItem(item) {
  const title = typeof item?.title === 'string' ? stripHtml(item.title) : ''
  const sourceUrl = normalizeSourceUrl(item?.sourceUrl)
  const publicationDate = normalizePublicationDate(
    item?.publicationDate || '',
  )

  if (!title || !sourceUrl) return null

  return {
    externalId: createExternalId({ sourceUrl, title, publicationDate }),
    title,
    sourceUrl,
    publicationDate,
    regulator: REGULATORY_MONITORING_SOURCE.regulator,
  }
}

export function parseCacRegulatoryListing(html) {
  if (typeof html !== 'string' || html.trim().length === 0) return []

  const parsedItems = []
  const seenUrls = new Set()

  for (const match of html.matchAll(LIST_ITEM_PATTERN)) {
    const attributes = match[1]
    const item = normalizeDiscoveredItem({
      title: getAttribute(attributes, 'title') || match[2],
      sourceUrl: getAttribute(attributes, 'href'),
      publicationDate: match[3],
    })

    if (!item || seenUrls.has(item.sourceUrl)) continue

    seenUrls.add(item.sourceUrl)
    parsedItems.push(item)
  }

  return parsedItems
}

export function parseCacOfficialSourceContent(html) {
  if (typeof html !== 'string' || html.trim().length === 0) return null

  const titleMatch = html.match(
    /<h1\b[^>]*class\s*=\s*['"][^'"]*\btitle\b[^'"]*['"][^>]*>([\s\S]*?)<\/h1>/iu,
  )
  const bodyMatch = html.match(
    /<div\b[^>]*id\s*=\s*['"]?BodyLabel['"]?[^>]*>([\s\S]*?)(?:<div\b[^>]*id\s*=\s*['"]?\u7f51\u7ad9\u7fa4\u7ba1\u7406['"]?[^>]*>|<\/div>\s*<div\b[^>]*class\s*=\s*['"]zwfenye['"])/iu,
  )

  const title = titleMatch ? stripOfficialContentHtml(titleMatch[1]) : ''
  const content = bodyMatch ? stripOfficialContentHtml(bodyMatch[1]) : ''

  if (!title || !content) return null

  return { title, content }
}

export function filterRelevantRegulatoryItems(
  items,
  keywords = REGULATORY_RELEVANCE_KEYWORDS,
) {
  return items.flatMap((item) => {
    const matchedKeywords = keywords.filter((keyword) =>
      item.title.toLocaleLowerCase('zh-CN').includes(
        keyword.toLocaleLowerCase('zh-CN'),
      ),
    )

    if (matchedKeywords.length === 0) return []

    return [
      {
        ...item,
        matchedKeywords,
        detectionStatus: 'Source detected',
      },
    ]
  })
}

export async function fetchRegulatoryUpdates({
  fetchImpl = monitoringFetch,
  now = () => new Date(),
  source = REGULATORY_MONITORING_SOURCE,
  keywords = REGULATORY_RELEVANCE_KEYWORDS,
  timeoutMs = REGULATORY_MONITORING_REQUEST.timeoutMs,
} = {}) {
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetchImpl(source.url, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': REGULATORY_MONITORING_REQUEST.userAgent,
      },
      redirect: 'follow',
      signal: abortController.signal,
    })

    if (!response?.ok) {
      throw new RegulatoryMonitoringError(
        'The official regulatory source could not be retrieved.',
        {
          code: 'REGULATORY_SOURCE_HTTP_ERROR',
          statusCode: 502,
        },
      )
    }

    const html = await response.text()
    const parsedItems = parseCacRegulatoryListing(html)

    if (parsedItems.length === 0) {
      throw new RegulatoryMonitoringError(
        'The official regulatory source returned no parseable items.',
        {
          code: 'REGULATORY_SOURCE_PARSE_ERROR',
          statusCode: 502,
        },
      )
    }

    return {
      source: {
        name: source.name,
        url: source.url,
        fetchedAt: now().toISOString(),
      },
      items: filterRelevantRegulatoryItems(parsedItems, keywords),
    }
  } catch (error) {
    if (error instanceof RegulatoryMonitoringError) throw error

    const timedOut = abortController.signal.aborted
    throw new RegulatoryMonitoringError(
      timedOut
        ? 'The official regulatory source request timed out.'
        : 'The official regulatory source is temporarily unavailable.',
      {
        cause: error,
        code: timedOut
          ? 'REGULATORY_SOURCE_TIMEOUT'
          : 'REGULATORY_SOURCE_NETWORK_ERROR',
        statusCode: 502,
      },
    )
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchOfficialRegulatorySourceContent({
  sourceUrl,
  expectedTitle,
  fetchImpl = monitoringFetch,
  now = () => new Date(),
  timeoutMs = REGULATORY_MONITORING_REQUEST.timeoutMs,
  maxCharacters =
    REGULATORY_MONITORING_REQUEST.sourceContentMaxCharacters,
} = {}) {
  const normalizedUrl = normalizeSourceUrl(sourceUrl)

  if (!normalizedUrl) {
    throw new RegulatoryMonitoringError(
      'The official regulatory source URL is invalid.',
      {
        code: 'INVALID_REGULATORY_SOURCE_URL',
        statusCode: 400,
      },
    )
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetchImpl(normalizedUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': REGULATORY_MONITORING_REQUEST.userAgent,
      },
      redirect: 'follow',
      signal: abortController.signal,
    })

    if (!response?.ok) {
      throw new RegulatoryMonitoringError(
        'The official regulatory source content could not be retrieved.',
        {
          code: 'REGULATORY_SOURCE_CONTENT_HTTP_ERROR',
          statusCode: 502,
        },
      )
    }

    const parsedContent = parseCacOfficialSourceContent(await response.text())

    if (!parsedContent) {
      throw new RegulatoryMonitoringError(
        'The official regulatory source returned no parseable content.',
        {
          code: 'REGULATORY_SOURCE_CONTENT_PARSE_ERROR',
          statusCode: 502,
        },
      )
    }

    if (
      typeof expectedTitle === 'string' &&
      expectedTitle.trim() &&
      stripOfficialContentHtml(expectedTitle) !== parsedContent.title
    ) {
      throw new RegulatoryMonitoringError(
        'The official source title did not match the detected event.',
        {
          code: 'REGULATORY_SOURCE_TITLE_MISMATCH',
          statusCode: 502,
        },
      )
    }

    const truncated = parsedContent.content.length > maxCharacters

    return {
      title: parsedContent.title,
      sourceUrl: normalizedUrl,
      content: parsedContent.content.slice(0, maxCharacters),
      truncated,
      fetchedAt: now().toISOString(),
    }
  } catch (error) {
    if (error instanceof RegulatoryMonitoringError) throw error

    const timedOut = abortController.signal.aborted
    throw new RegulatoryMonitoringError(
      timedOut
        ? 'The official regulatory source content request timed out.'
        : 'The official regulatory source content is temporarily unavailable.',
      {
        cause: error,
        code: timedOut
          ? 'REGULATORY_SOURCE_CONTENT_TIMEOUT'
          : 'REGULATORY_SOURCE_CONTENT_NETWORK_ERROR',
        statusCode: 502,
      },
    )
  } finally {
    clearTimeout(timeoutId)
  }
}
