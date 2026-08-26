import { createReviewResult } from '../models/reviewResult.js'
import { AI_REVIEW_SCHEMA_VERSION } from '../../shared/aiReviewContract.js'
import { getApiEndpoint } from './apiEndpoint.js'

export const AI_REVIEW_CONTRACT = Object.freeze({
  schemaVersion: AI_REVIEW_SCHEMA_VERSION,
  analysisMethod: 'AI-assisted preliminary review',
  allowedStatuses: [
    'Found',
    'Potential Gap',
    'Further Review Required',
  ],
  evidenceFoundFlagRequired: true,
  evidenceMustComeFromUploadedText: true,
  evidenceMustBeContiguousVerbatim: true,
  evidenceAbsenceMustBeExplicit: true,
  confidenceRequired: true,
  humanReviewFlagRequired: true,
  verifiedLegalSourceRequired: true,
  issueSpecificLegalEvidenceRequired: true,
  legalAuthorityResolvedByServer: true,
  regulationLevelCitationFallbackAllowed: false,
  generatedLegalSourcesAllowed: false,
  directComplianceConclusionsAllowed: false,
  practicalFindingFieldsRequired: true,
})

function isLegacyApiResult(result) {
  return (
    result &&
    typeof result === 'object' &&
    ('result' in result ||
      'issue' in result ||
      'preliminaryObservation' in result ||
      'reviewPriority' in result)
  )
}

export function parseAiReviewApiResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('AI review response was not a valid object.')
  }

  if (payload.schemaVersion !== AI_REVIEW_SCHEMA_VERSION) {
    const hasLegacyResults =
      Array.isArray(payload.results) && payload.results.some(isLegacyApiResult)

    throw new Error(
      hasLegacyResults
        ? 'AI review backend is using an outdated response schema. Restart the local backend and run the review again.'
        : `AI review response schema version is not supported. Expected ${AI_REVIEW_SCHEMA_VERSION}.`,
    )
  }

  if (!Array.isArray(payload.results)) {
    throw new Error('AI review response did not contain review results.')
  }

  return payload.results.map((result, index) => {
    try {
      return createReviewResult(result)
    } catch (error) {
      throw new Error(
        `AI review result ${index + 1} did not match the expected schema: ${error.message}`,
      )
    }
  })
}

export async function aiAssistedReview({
  documentText,
  reviewRules,
  legalSource,
}) {
  const response = await fetch(getApiEndpoint('ai-review'), {
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

  return parseAiReviewApiResponse(payload)
}
