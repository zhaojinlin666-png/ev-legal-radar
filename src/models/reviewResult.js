import {
  LEGAL_AUTHORITY_STATUSES,
  LEGAL_SOURCE_NOT_VERIFIED,
  REVIEW_ANALYSIS_METHODS,
  REVIEW_CONFIDENCE_LEVELS,
  REVIEW_RISK_LEVELS,
  REVIEW_STATUSES,
} from '../../shared/aiReviewContract.js'

export {
  LEGAL_AUTHORITY_STATUSES,
  LEGAL_SOURCE_NOT_VERIFIED,
  REVIEW_ANALYSIS_METHODS,
  REVIEW_CONFIDENCE_LEVELS,
  REVIEW_RISK_LEVELS,
  REVIEW_STATUSES,
}

/**
 * @typedef {Object} ReviewResult
 * @property {string} ruleId
 * @property {string} title
 * @property {'Found'|'Potential Gap'|'Further Review Required'} status
 * @property {string} evidence
 * @property {string} observation
 * @property {string} legalBasis
 * @property {string} legalArticle
 * @property {'verified'|'LEGAL_SOURCE_NOT_VERIFIED'} legalAuthorityStatus
 * @property {Array<Object>} legalAuthorities
 * @property {'High'|'Medium'|'Low'} riskLevel
 * @property {'Rule-based preliminary review'|'AI-assisted preliminary review'} analysisMethod
 * @property {'High'|'Medium'|'Low'} confidence
 * @property {boolean} requiresHumanReview
 * @property {string} issueSummary
 * @property {string} riskReason
 * @property {string} suggestedRevision
 * @property {string} suggestedNextStep
 */

/** @returns {ReviewResult} */
export function createReviewResult(result) {
  if (!REVIEW_STATUSES.includes(result.status)) {
    throw new Error(`Unsupported review status: ${result.status}`)
  }

  if (!REVIEW_ANALYSIS_METHODS.includes(result.analysisMethod)) {
    throw new Error(`Unsupported analysis method: ${result.analysisMethod}`)
  }

  if (!REVIEW_CONFIDENCE_LEVELS.includes(result.confidence)) {
    throw new Error(`Unsupported confidence level: ${result.confidence}`)
  }

  if (!REVIEW_RISK_LEVELS.includes(result.riskLevel)) {
    throw new Error(`Unsupported risk level: ${result.riskLevel}`)
  }

  if (!LEGAL_AUTHORITY_STATUSES.includes(result.legalAuthorityStatus)) {
    throw new Error(
      `Unsupported legal authority status: ${result.legalAuthorityStatus}`,
    )
  }

  if (!Array.isArray(result.legalAuthorities)) {
    throw new Error('legalAuthorities must be an array')
  }

  const legalAuthorities = result.legalAuthorities.map((authority) => {
    const requiredAuthorityFields = [
      'provisionId',
      'lawId',
      'lawName',
      'jurisdiction',
      'article',
      'topic',
      'requirementSummary',
      'sourceUrl',
      'sourceAuthority',
      'reviewScope',
    ]

    requiredAuthorityFields.forEach((fieldName) => {
      if (
        typeof authority?.[fieldName] !== 'string' ||
        !authority[fieldName].trim()
      ) {
        throw new Error(
          `legalAuthorities.${fieldName} must be a non-empty string`,
        )
      }
    })

    if (authority.verificationStatus !== 'verified') {
      throw new Error('Only verified legal authorities may be cited')
    }

    if (
      authority.effectiveDate !== null &&
      (typeof authority.effectiveDate !== 'string' ||
        !authority.effectiveDate.trim())
    ) {
      throw new Error(
        'legalAuthorities.effectiveDate must be null or a non-empty string',
      )
    }

    return { ...authority }
  })

  const hasVerifiedAuthority = result.legalAuthorityStatus === 'verified'

  if (hasVerifiedAuthority !== (legalAuthorities.length > 0)) {
    throw new Error('legalAuthorityStatus does not match legalAuthorities')
  }

  if (
    !hasVerifiedAuthority &&
    (result.legalBasis !== LEGAL_SOURCE_NOT_VERIFIED ||
      result.legalArticle !== LEGAL_SOURCE_NOT_VERIFIED)
  ) {
    throw new Error('Unverified legal authority must use the safe fallback')
  }

  if (typeof result.requiresHumanReview !== 'boolean') {
    throw new Error('requiresHumanReview must be a boolean')
  }

  const requiredTextFields = [
    'ruleId',
    'title',
    'evidence',
    'observation',
    'legalBasis',
    'legalArticle',
    'issueSummary',
    'riskReason',
    'suggestedRevision',
    'suggestedNextStep',
  ]

  requiredTextFields.forEach((fieldName) => {
    if (typeof result[fieldName] !== 'string' || !result[fieldName].trim()) {
      throw new Error(`${fieldName} must be a non-empty string`)
    }
  })

  return {
    ruleId: result.ruleId,
    title: result.title,
    status: result.status,
    evidence: result.evidence,
    observation: result.observation,
    legalBasis: result.legalBasis,
    legalArticle: result.legalArticle,
    legalAuthorityStatus: result.legalAuthorityStatus,
    legalAuthorities,
    riskLevel: result.riskLevel,
    analysisMethod: result.analysisMethod,
    confidence: result.confidence,
    requiresHumanReview: result.requiresHumanReview,
    issueSummary: result.issueSummary,
    riskReason: result.riskReason,
    suggestedRevision: result.suggestedRevision,
    suggestedNextStep: result.suggestedNextStep,
  }
}
