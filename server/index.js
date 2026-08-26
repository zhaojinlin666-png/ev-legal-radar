import 'dotenv/config'
import express from 'express'
import { isVerifiedLegalSourceMetadata } from '../src/data/legalEvidence.js'
import { getVerifiedProvisionsForOfficialSource } from '../src/data/legalKnowledgeBase.js'
import { reviewRules as verifiedReviewRules } from '../src/data/reviewRules.js'
import {
  isOpenAiProxyConfigured,
  runAiReview,
} from './services/aiReviewService.js'
import { createAiReviewApiResponse } from './services/aiReviewValidation.js'
import {
  fetchOfficialRegulatorySourceContent,
  fetchRegulatoryUpdates,
} from './services/regulatoryMonitoringService.js'
import { runRegulatoryImpactAnalysis } from './services/regulatoryImpactAnalysisService.js'
import {
  createRegulatoryImpactApiResponse,
  validateRegulatoryImpactRequest,
} from './services/regulatoryImpactAnalysisValidation.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const VERIFIED_REVIEW_RULES_BY_ID = new Map(
  verifiedReviewRules.map((rule) => [rule.id, rule]),
)

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

app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

app.get('/api/regulatory-updates', async (request, response) => {
  void request

  try {
    const regulatoryUpdates = await fetchRegulatoryUpdates()
    response.set('Cache-Control', 'no-store')
    return response.json(regulatoryUpdates)
  } catch (error) {
    console.error('Regulatory monitoring request failed.', {
      errorName: error?.name,
      errorCode: error?.code,
      statusCode: error?.statusCode,
    })

    return response.status(error?.statusCode ?? 500).json({
      error:
        error?.publicMessage || 'Regulatory monitoring request failed.',
    })
  }
})

app.post('/api/regulatory-impact-analysis', async (request, response) => {
  try {
    const event = validateRegulatoryImpactRequest(request.body?.event)

    if (!process.env.OPENAI_API_KEY) {
      return response.status(503).json({
        error: 'AI impact analysis service is not configured.',
      })
    }

    const officialSource = await fetchOfficialRegulatorySourceContent({
      sourceUrl: event.sourceUrl,
      expectedTitle: event.title,
    })
    const allowedAuthorities = getVerifiedProvisionsForOfficialSource({
      title: event.title,
      sourceUrl: event.sourceUrl,
    })
    const result = await runRegulatoryImpactAnalysis({
      event,
      officialSource,
      allowedAuthorities,
    })

    return response.json(createRegulatoryImpactApiResponse(result))
  } catch (error) {
    console.error('Regulatory impact analysis request failed.', {
      errorName: error?.name,
      statusCode: error?.statusCode,
      providerStatus: error?.providerStatus,
      requestId: error?.requestId,
      validationCode: error?.validationCode,
      validationIssues: error?.validationIssues,
    })

    return response.status(error?.statusCode ?? 500).json({
      error:
        error?.publicMessage ||
        'Preliminary regulatory impact analysis failed.',
    })
  }
})

app.post('/api/ai-review', async (request, response) => {
  const { documentText, reviewRules, legalSource } = request.body ?? {}

  if (typeof documentText !== 'string' || documentText.trim().length === 0) {
    return response.status(400).json({ error: 'documentText is required.' })
  }

  if (!Array.isArray(reviewRules) || reviewRules.length === 0) {
    return response.status(400).json({ error: 'reviewRules are required.' })
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
    return response.status(400).json({ error: 'reviewRules are invalid.' })
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
    return response.status(400).json({
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
    return response.status(400).json({
      error: 'legalSource must match verified source metadata.',
    })
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({
      error: 'AI review service is not configured.',
    })
  }

  try {
    const results = await runAiReview({
      documentText,
      reviewRules: canonicalReviewRules,
      legalSource,
    })

    return response.json(createAiReviewApiResponse(results))
  } catch (error) {
    console.error('AI review request failed.', {
      errorName: error.name,
      statusCode: error.statusCode,
      providerStatus: error.providerStatus,
      requestId: error.requestId,
      validationCode: error.validationCode,
      validationIssues: error.validationIssues,
    })

    return response.status(error.statusCode ?? 500).json({
      error: error.publicMessage || 'AI review request failed.',
    })
  }
})

app.use((error, request, response, next) => {
  void request
  void next

  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large.' })
  }

  if (error instanceof SyntaxError) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' })
  }

  console.error('Unhandled server error.', { errorName: error?.name })
  return response.status(500).json({ error: 'Internal server error.' })
})

app.listen(port, () => {
  console.log(`EV Legal Radar server listening on http://localhost:${port}`)
  console.log(
    `OpenAI proxy configured: ${isOpenAiProxyConfigured() ? 'yes' : 'no'}`,
  )
})
