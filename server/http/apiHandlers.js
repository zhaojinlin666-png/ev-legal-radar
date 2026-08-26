import { isVerifiedLegalSourceMetadata } from '../../src/data/legalEvidence.js'
import { getVerifiedProvisionsForOfficialSource } from '../../src/data/legalKnowledgeBase.js'
import { reviewRules as verifiedReviewRules } from '../../src/data/reviewRules.js'
import { runAiReview } from '../services/aiReviewService.js'
import { createAiReviewApiResponse } from '../services/aiReviewValidation.js'
import {
  fetchOfficialRegulatorySourceContent,
  fetchRegulatoryUpdates,
} from '../services/regulatoryMonitoringService.js'
import { runRegulatoryImpactAnalysis } from '../services/regulatoryImpactAnalysisService.js'
import {
  createRegulatoryImpactApiResponse,
  validateRegulatoryImpactRequest,
} from '../services/regulatoryImpactAnalysisValidation.js'

const VERIFIED_REVIEW_RULES_BY_ID = new Map(
  verifiedReviewRules.map((rule) => [rule.id, rule]),
)

function apiResult(status, body, headers = {}) {
  return { status, body, headers }
}

function hasOpenAiApiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim())
}

function safeErrorBody(error, fallbackMessage) {
  return {
    error: error?.publicMessage || fallbackMessage,
    ...(typeof error?.clientCode === 'string'
      ? { code: error.clientCode }
      : {}),
  }
}

function matchesVerifiedRuleMetadata(requestRule, verifiedRule) {
  const requestedAuthorityIds = Array.isArray(requestRule.legalAuthorities)
    ? requestRule.legalAuthorities.map((authority) => authority?.provisionId)
    : []
  const verifiedAuthorityIds = verifiedRule.legalAuthorities.map(
    (authority) => authority.provisionId,
  )

  return (
    requestRule.title === verifiedRule.title &&
    requestRule.issueType === verifiedRule.issueType &&
    requestRule.legalBasis === verifiedRule.legalBasis &&
    requestRule.legalArticle === verifiedRule.legalArticle &&
    requestRule.legalAuthorityStatus === verifiedRule.legalAuthorityStatus &&
    requestedAuthorityIds.length === verifiedAuthorityIds.length &&
    requestedAuthorityIds.every(
      (authorityId, index) => authorityId === verifiedAuthorityIds[index],
    ) &&
    requestRule.riskLevel === verifiedRule.riskLevel
  )
}

export async function handleRegulatoryUpdatesRequest(
  _request = {},
  { fetchRegulatoryUpdatesImpl = fetchRegulatoryUpdates } = {},
) {
  try {
    const regulatoryUpdates = await fetchRegulatoryUpdatesImpl()
    return apiResult(200, regulatoryUpdates, { 'Cache-Control': 'no-store' })
  } catch (error) {
    console.error('Regulatory monitoring request failed.', {
      errorName: error?.name,
      errorCode: error?.code,
      statusCode: error?.statusCode,
    })

    return apiResult(error?.statusCode ?? 500, {
      error:
        error?.publicMessage || 'Regulatory monitoring request failed.',
    })
  }
}

export async function handleRegulatoryImpactAnalysisRequest(
  { body } = {},
  {
    validateRequestImpl = validateRegulatoryImpactRequest,
    hasOpenAiApiKeyImpl = hasOpenAiApiKey,
    fetchOfficialSourceImpl = fetchOfficialRegulatorySourceContent,
    getVerifiedAuthoritiesImpl = getVerifiedProvisionsForOfficialSource,
    runImpactAnalysisImpl = runRegulatoryImpactAnalysis,
    createApiResponseImpl = createRegulatoryImpactApiResponse,
  } = {},
) {
  try {
    const event = validateRequestImpl(body?.event)

    if (!hasOpenAiApiKeyImpl()) {
      return apiResult(503, {
        error:
          'AI impact analysis service is not configured. Configure OPENAI_API_KEY in the server environment.',
        code: 'AI_SERVICE_NOT_CONFIGURED',
      })
    }

    const officialSource = await fetchOfficialSourceImpl({
      sourceUrl: event.sourceUrl,
      expectedTitle: event.title,
    })
    const allowedAuthorities = getVerifiedAuthoritiesImpl({
      title: event.title,
      sourceUrl: event.sourceUrl,
    })
    const result = await runImpactAnalysisImpl({
      event,
      officialSource,
      allowedAuthorities,
    })

    return apiResult(200, createApiResponseImpl(result))
  } catch (error) {
    console.error('Regulatory impact analysis request failed.', {
      errorName: error?.name,
      statusCode: error?.statusCode,
      providerStatus: error?.providerStatus,
      providerType: error?.providerType,
      providerCode: error?.providerCode,
      providerMessage: error?.providerMessage,
      requestId: error?.requestId,
      validationCode: error?.validationCode,
      validationIssues: error?.validationIssues,
    })

    return apiResult(
      error?.statusCode ?? 500,
      safeErrorBody(
        error,
        'Preliminary regulatory impact analysis failed.',
      ),
    )
  }
}

export async function handleAiReviewRequest(
  { body } = {},
  {
    hasOpenAiApiKeyImpl = hasOpenAiApiKey,
    runAiReviewImpl = runAiReview,
    createApiResponseImpl = createAiReviewApiResponse,
  } = {},
) {
  const { documentText, reviewRules, legalSource } = body ?? {}

  if (typeof documentText !== 'string' || documentText.trim().length === 0) {
    return apiResult(400, { error: 'documentText is required.' })
  }

  if (!Array.isArray(reviewRules) || reviewRules.length === 0) {
    return apiResult(400, { error: 'reviewRules are required.' })
  }

  if (
    reviewRules.length > 50 ||
    reviewRules.some(
      (rule) =>
        !rule ||
        typeof rule !== 'object' ||
        typeof rule.id !== 'string' ||
        typeof rule.title !== 'string' ||
        typeof rule.issueType !== 'string' ||
        typeof rule.legalBasis !== 'string' ||
        typeof rule.legalArticle !== 'string' ||
        typeof rule.legalAuthorityStatus !== 'string' ||
        !Array.isArray(rule.legalAuthorities) ||
        !['High', 'Medium', 'Low'].includes(rule.riskLevel),
    ) ||
    new Set(reviewRules.map((rule) => rule.id)).size !== reviewRules.length
  ) {
    return apiResult(400, { error: 'reviewRules are invalid.' })
  }

  const canonicalReviewRules = reviewRules.map((rule) =>
    VERIFIED_REVIEW_RULES_BY_ID.get(rule.id),
  )

  if (
    canonicalReviewRules.some(
      (verifiedRule, index) =>
        !verifiedRule ||
        !matchesVerifiedRuleMetadata(reviewRules[index], verifiedRule),
    )
  ) {
    return apiResult(400, {
      error: 'reviewRules do not match the verified server registry.',
    })
  }

  if (
    !legalSource ||
    typeof legalSource !== 'object' ||
    Array.isArray(legalSource) ||
    Object.keys(legalSource).length === 0 ||
    !isVerifiedLegalSourceMetadata(legalSource)
  ) {
    return apiResult(400, {
      error: 'legalSource must match verified source metadata.',
    })
  }

  if (!hasOpenAiApiKeyImpl()) {
    return apiResult(503, {
      error: 'AI review service is not configured.',
    })
  }

  try {
    const results = await runAiReviewImpl({
      documentText,
      reviewRules: canonicalReviewRules,
      legalSource,
    })

    return apiResult(200, createApiResponseImpl(results))
  } catch (error) {
    console.error('AI review request failed.', {
      errorName: error?.name,
      statusCode: error?.statusCode,
      providerStatus: error?.providerStatus,
      providerType: error?.providerType,
      providerCode: error?.providerCode,
      providerMessage: error?.providerMessage,
      requestId: error?.requestId,
      validationCode: error?.validationCode,
      validationIssues: error?.validationIssues,
    })

    return apiResult(
      error?.statusCode ?? 500,
      safeErrorBody(error, 'AI review request failed.'),
    )
  }
}
