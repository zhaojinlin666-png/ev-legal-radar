export const AI_REVIEW_SCHEMA_VERSION = '3.0'

export const LEGAL_SOURCE_NOT_VERIFIED = 'LEGAL_SOURCE_NOT_VERIFIED'

export const LEGAL_AUTHORITY_STATUSES = Object.freeze([
  'verified',
  LEGAL_SOURCE_NOT_VERIFIED,
])

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

export const REVIEW_RISK_LEVELS = Object.freeze(['High', 'Medium', 'Low'])
