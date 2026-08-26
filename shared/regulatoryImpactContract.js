export const REGULATORY_IMPACT_SCHEMA_VERSION = '1.1'

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

export const REGULATORY_CHANGE_COMPARISON_MODES = Object.freeze([
  'new_source_summary',
  'verified_change_comparison',
])

export const REGULATORY_IMPACT_EVIDENCE_TYPES = Object.freeze([
  'FACT',
  'INFERENCE',
])

export const HUMAN_REVIEW_STATUSES = Object.freeze([
  'Unreviewed',
  'Accepted',
  'Edited',
  'Rejected',
])

export const NO_VERIFIED_PREVIOUS_VERSION_NOTICE =
  'No verified previous version was available, so this section summarizes the new source rather than asserting a legal change.'

export const PRELIMINARY_IMPACT_DISCLAIMER =
  'This impact level is a preliminary prioritization signal for legal review, not a determination of legal non-compliance.'

export const REGULATORY_IMPACT_WORKFLOW_STATUSES = Object.freeze([
  'Unreviewed',
  'Analyzing',
  'Analysis completed',
  'Further Review Required',
  'Analysis failed',
])
