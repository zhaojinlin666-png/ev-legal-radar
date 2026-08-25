export const REVIEW_STATUSES = Object.freeze([
  'Found',
  'Potential Gap',
  'Further Review Required',
])

export const REVIEW_ANALYSIS_METHODS = Object.freeze([
  'Rule-based preliminary review',
  'AI-assisted preliminary review',
])

export const REVIEW_CONFIDENCE_LEVELS = Object.freeze([
  'High',
  'Medium',
  'Low',
])

/**
 * @typedef {Object} ReviewResult
 * @property {string} ruleId
 * @property {string} title
 * @property {'Found'|'Potential Gap'|'Further Review Required'} status
 * @property {string} evidence
 * @property {string} observation
 * @property {string} legalBasis
 * @property {string} legalArticle
 * @property {'High'|'Medium'|'Low'} riskLevel
 * @property {'Rule-based preliminary review'|'AI-assisted preliminary review'} analysisMethod
 * @property {'High'|'Medium'|'Low'} confidence
 * @property {boolean} requiresHumanReview
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

  return {
    ruleId: result.ruleId,
    title: result.title,
    status: result.status,
    evidence: result.evidence,
    observation: result.observation,
    legalBasis: result.legalBasis,
    legalArticle: result.legalArticle,
    riskLevel: result.riskLevel,
    analysisMethod: result.analysisMethod,
    confidence: result.confidence,
    requiresHumanReview: Boolean(result.requiresHumanReview),
  }
}
