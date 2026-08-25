import { createReviewResult } from '../models/reviewResult.js'

const STATUS_BY_API_RESULT = Object.freeze({
  found: 'Found',
  potential_gap: 'Potential Gap',
  further_review_required: 'Further Review Required',
})

export const AI_REVIEW_CONTRACT = Object.freeze({
  analysisMethod: 'AI-assisted preliminary review',
  allowedStatuses: [
    'Found',
    'Potential Gap',
    'Further Review Required',
  ],
  evidenceMustComeFromUploadedText: true,
  evidenceAbsenceMustBeExplicit: true,
  confidenceRequired: true,
  humanReviewFlagRequired: true,
  verifiedLegalSourceRequired: true,
  generatedLegalSourcesAllowed: false,
  directComplianceConclusionsAllowed: false,
})

export async function aiAssistedReview({
  documentText,
  reviewRules,
  legalSource,
}) {
  const response = await fetch('/api/ai-review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentText,
      reviewRules,
      legalSource,
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload.error || 'AI review request failed.')
    error.statusCode = response.status
    throw error
  }

  if (!Array.isArray(payload.results)) {
    throw new Error('AI review response did not contain review results.')
  }

  return payload.results.map((result) =>
    createReviewResult({
      ruleId: result.ruleId,
      title: result.issue,
      status: STATUS_BY_API_RESULT[result.result],
      evidence: result.evidence,
      observation: result.preliminaryObservation,
      legalBasis: result.legalBasis,
      legalArticle: result.legalArticle,
      riskLevel: result.reviewPriority,
      analysisMethod: result.analysisMethod,
      confidence: result.confidence,
      requiresHumanReview: result.requiresHumanReview,
    }),
  )
}
