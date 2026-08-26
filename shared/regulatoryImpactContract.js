export const REGULATORY_IMPACT_SCHEMA_VERSION = '1.0'

export const REGULATORY_IMPACT_LEVELS = Object.freeze([
  'High',
  'Medium',
  'Low',
  'Further Review Required',
])

export const REGULATORY_IMPACT_CONFIDENCE_LEVELS = Object.freeze([
  'High',
  'Medium',
  'Low',
])

export const REGULATORY_IMPACT_ANALYSIS_METHOD =
  'AI-assisted preliminary impact analysis'

export const REGULATORY_IMPACT_WORKFLOW_STATUSES = Object.freeze([
  'Unreviewed',
  'Analyzing',
  'Analysis completed',
  'Further Review Required',
  'Analysis failed',
])
