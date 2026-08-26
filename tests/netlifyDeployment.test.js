import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { createAiReviewFunction } from '../netlify/functions/ai-review.mts'
import { createRegulatoryImpactAnalysisFunction } from '../netlify/functions/regulatory-impact-analysis.mts'
import { createRegulatoryUpdatesFunction } from '../netlify/functions/regulatory-updates.mts'
import { createNetlifyFunctionHandler } from '../netlify/functions/_shared/netlifyAdapter.js'
import { reviewLegalSource, reviewRules } from '../src/data/reviewRules.js'
import { getApiEndpoint } from '../src/services/apiEndpoint.js'
import { parseRegulatoryImpactHttpResponse } from '../src/services/regulatoryImpactAnalysisService.js'

function jsonRequest(url, body, method = 'POST') {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function getJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const path = `${directory}/${entry.name}`
      return entry.isDirectory() ? getJavaScriptFiles(path) : [path]
    }),
  )

  return nestedFiles.flat().filter((path) => /\.[cm]?[jt]sx?$/u.test(path))
}

test('API endpoint selection uses the Vite proxy locally and Netlify Functions in production', () => {
  assert.equal(
    getApiEndpoint('ai-review', { isDevelopment: true }),
    '/api/ai-review',
  )
  assert.equal(
    getApiEndpoint('ai-review', { isDevelopment: false }),
    '/.netlify/functions/ai-review',
  )
  assert.equal(
    getApiEndpoint('regulatory-updates', { isDevelopment: false }),
    '/.netlify/functions/regulatory-updates',
  )
  assert.equal(
    getApiEndpoint('regulatory-impact-analysis', {
      isDevelopment: false,
    }),
    '/.netlify/functions/regulatory-impact-analysis',
  )
})

test('Netlify adapter converts Web Requests and shared API results without leaking errors', async () => {
  const handler = createNetlifyFunctionHandler({
    method: 'POST',
    apiHandler: async ({ body }) => ({
      status: 202,
      body: { received: body.value },
      headers: { 'Cache-Control': 'no-store' },
    }),
  })
  const response = await handler(
    jsonRequest('https://example.netlify.app/.netlify/functions/test', {
      value: 'safe',
    }),
  )

  assert.equal(response.status, 202)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), { received: 'safe' })

  const invalidMethodResponse = await handler(
    new Request('https://example.netlify.app/.netlify/functions/test'),
  )
  assert.equal(invalidMethodResponse.status, 405)
  assert.deepEqual(await invalidMethodResponse.json(), {
    error: 'Method not allowed.',
  })
})

test('AI review Netlify Function delegates to the existing AI review service layer', async () => {
  let serviceInput
  const handler = createAiReviewFunction({
    hasOpenAiApiKeyImpl: () => true,
    runAiReviewImpl: async (input) => {
      serviceInput = input
      return [{ ruleId: 'service-result' }]
    },
    createApiResponseImpl: (results) => ({
      adapter: 'existing-ai-review-service',
      results,
    }),
  })
  const response = await handler(
    jsonRequest('https://example.netlify.app/.netlify/functions/ai-review', {
      documentText: '本地测试文本',
      reviewRules,
      legalSource: reviewLegalSource,
    }),
  )
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.adapter, 'existing-ai-review-service')
  assert.equal(serviceInput.documentText, '本地测试文本')
  assert.equal(serviceInput.reviewRules.length, reviewRules.length)
  assert.deepEqual(serviceInput.legalSource, reviewLegalSource)
})

test('regulatory impact Netlify Function delegates through source, authority and analysis services', async () => {
  const calls = []
  const canonicalEvent = {
    title: 'Detected source event',
    sourceUrl: 'https://www.cac.gov.cn/example.htm',
  }
  const officialSource = { title: canonicalEvent.title, content: 'source' }
  const allowedAuthorities = [{ provisionId: 'verified-provision' }]
  const handler = createRegulatoryImpactAnalysisFunction({
    validateRequestImpl: (event) => {
      calls.push(['validate', event.externalId])
      return canonicalEvent
    },
    hasOpenAiApiKeyImpl: () => true,
    fetchOfficialSourceImpl: async (input) => {
      calls.push(['source', input.sourceUrl])
      return officialSource
    },
    getVerifiedAuthoritiesImpl: (input) => {
      calls.push(['authority', input.title])
      return allowedAuthorities
    },
    runImpactAnalysisImpl: async (input) => {
      calls.push(['analysis', input.event.title])
      assert.equal(input.officialSource, officialSource)
      assert.equal(input.allowedAuthorities, allowedAuthorities)
      assert.equal(input.signal instanceof AbortSignal, true)
      return { impact: 'service-result' }
    },
    createApiResponseImpl: (result) => ({ result }),
  })
  const response = await handler(
    jsonRequest(
      'https://example.netlify.app/.netlify/functions/regulatory-impact-analysis',
      { event: { externalId: 'source-event-id' } },
    ),
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    result: { impact: 'service-result' },
  })
  assert.deepEqual(calls, [
    ['validate', 'source-event-id'],
    ['source', canonicalEvent.sourceUrl],
    ['authority', canonicalEvent.title],
    ['analysis', canonicalEvent.title],
  ])
})

test('Netlify adapter returns machine-readable JSON before its execution deadline', async () => {
  const originalConsoleError = console.error
  console.error = () => {}
  const handler = createNetlifyFunctionHandler({
    method: 'POST',
    apiHandler: async () => new Promise(() => {}),
    executionTimeoutMs: 5,
    timeoutResponse: {
      status: 504,
      body: {
        error: 'Structured response deadline reached.',
        code: 'TEST_TIMEOUT',
      },
    },
  })

  try {
    const response = await handler(
      jsonRequest('https://example.netlify.app/.netlify/functions/test', {}),
      { requestId: 'netlify-test-request' },
    )

    assert.equal(response.status, 504)
    assert.match(response.headers.get('content-type'), /application\/json/u)
    assert.deepEqual(await response.json(), {
      error: 'Structured response deadline reached.',
      code: 'TEST_TIMEOUT',
    })
  } finally {
    console.error = originalConsoleError
  }
})

test('production impact response parser accepts JSON and safely diagnoses non-JSON', async () => {
  const validPayload = {
    schemaVersion: 'test-version',
    result: { requiresHumanReview: true },
  }
  const parsedPayload = await parseRegulatoryImpactHttpResponse(
    new Response(JSON.stringify(validPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  assert.deepEqual(parsedPayload, validPayload)

  const capturedLogs = []
  const originalConsoleError = console.error
  console.error = (...entries) => capturedLogs.push(entries)

  try {
    await assert.rejects(
      parseRegulatoryImpactHttpResponse(
        new Response('<html>gateway timeout</html>', {
          status: 504,
          headers: {
            'Content-Type': 'text/html',
            'x-nf-request-id': 'safe-netlify-request-id',
          },
        }),
      ),
      /ended before returning a structured response/u,
    )
  } finally {
    console.error = originalConsoleError
  }

  assert.equal(capturedLogs.length, 1)
  assert.deepEqual(capturedLogs[0][1], {
    status: 504,
    contentType: 'text/html',
    responseLength: 28,
    netlifyRequestId: 'safe-netlify-request-id',
  })
  assert.doesNotMatch(JSON.stringify(capturedLogs), /gateway timeout/u)
})

test('regulatory monitoring Netlify Function preserves no-store metadata response', async () => {
  const monitoringResult = {
    source: { name: 'Official source' },
    items: [],
  }
  const handler = createRegulatoryUpdatesFunction({
    fetchRegulatoryUpdatesImpl: async () => monitoringResult,
  })
  const response = await handler(
    new Request(
      'https://example.netlify.app/.netlify/functions/regulatory-updates',
    ),
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(await response.json(), monitoringResult)
})

test('frontend source graph contains no OpenAI secret or localhost backend dependency', async () => {
  const clientFiles = await getJavaScriptFiles(
    new URL('../src', import.meta.url).pathname,
  )
  const clientSource = (
    await Promise.all(clientFiles.map((path) => readFile(path, 'utf8')))
  ).join('\n')

  assert.doesNotMatch(clientSource, /OPENAI_API_KEY|VITE_[A-Z_]*OPENAI/gu)
  assert.doesNotMatch(
    clientSource,
    /(?:^|['"`\s=])sk-[A-Za-z0-9_-]{20,}/gu,
  )
  assert.doesNotMatch(clientSource, /http:\/\/localhost:3001/gu)
})
