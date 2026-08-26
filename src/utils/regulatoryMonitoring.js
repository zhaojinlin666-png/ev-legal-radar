export function isSourceDetectedItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.externalId === 'string' &&
    typeof item.title === 'string' &&
    typeof item.sourceUrl === 'string' &&
    (item.publicationDate === null ||
      typeof item.publicationDate === 'string') &&
    typeof item.regulator === 'string' &&
    Array.isArray(item.matchedKeywords) &&
    item.detectionStatus === 'Source detected'
  )
}

export function mergeDetectedRegulatoryItems(existingItems, incomingItems) {
  const mergedItems = [...existingItems]
  const existingIds = new Set(existingItems.map((item) => item.externalId))
  const addedItems = []

  incomingItems.forEach((item) => {
    if (!isSourceDetectedItem(item) || existingIds.has(item.externalId)) return

    existingIds.add(item.externalId)
    mergedItems.push(item)
    addedItems.push(item)
  })

  return { items: mergedItems, addedItems }
}

export function createReviewEventFromDetectedItem(item) {
  if (!isSourceDetectedItem(item)) {
    throw new TypeError('A valid source-detected regulatory item is required.')
  }

  return {
    id: `source-review-${item.externalId}`,
    sourceExternalId: item.externalId,
    eventKind: 'source-detected-review',
    detectionStatus: item.detectionStatus,
    title: item.title,
    jurisdiction: 'China',
    regulator: item.regulator,
    publicationDate: item.publicationDate,
    effectiveDate: null,
    changeType: 'Unclassified',
    sourceTitle: item.title,
    sourceUrl: item.sourceUrl,
    verificationStatus: 'Unreviewed',
    analysisStatus: 'Unreviewed',
    analysisError: null,
    demoLabel: null,
    shortSummary: null,
    changeSummary: {
      comparisonMode: 'new_source_summary',
      previousRequirement: null,
      newRequirement: null,
      preliminaryInterpretation: null,
      whyItMatters: null,
    },
    affectedLegalTopics: [],
    potentiallyAffectedActivities: [],
    documentsToReview: [],
    preliminaryImpactLevel: null,
    requiresHumanReview: true,
    generatedReviewTasks: [],
    matchedKeywords: [...item.matchedKeywords],
  }
}
