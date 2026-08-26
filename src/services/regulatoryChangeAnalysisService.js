const NOT_CONFIGURED_MESSAGE =
  'Regulatory change analysis is not configured in this prototype.'

export async function analyzeRegulatoryChange({
  oldRule,
  newRule,
  businessContext,
}) {
  void oldRule
  void newRule
  void businessContext
  throw new Error(NOT_CONFIGURED_MESSAGE)
}

export async function generateImpactAssessment({
  changeEvent,
  businessActivities,
  internalDocuments,
}) {
  void changeEvent
  void businessActivities
  void internalDocuments
  throw new Error(NOT_CONFIGURED_MESSAGE)
}
