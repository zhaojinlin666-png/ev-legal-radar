import { REGULATORY_IMPACT_ANALYSIS_METHOD } from '../../shared/regulatoryImpactContract.js'

export function canRequestPreliminaryImpactAnalysis(event) {
  const retryableStatuses = new Set([
    'Unreviewed',
    'Analysis failed',
    'Further Review Required',
  ])

  return (
    event?.eventKind === 'source-detected-review' &&
    event.detectionStatus === 'Source detected' &&
    event.verificationStatus === 'Unreviewed' &&
    retryableStatuses.has(event.analysisStatus || 'Unreviewed')
  )
}

export function markRegulatoryEventAnalyzing(event) {
  if (!canRequestPreliminaryImpactAnalysis(event)) {
    throw new Error(
      'Only a source-detected unreviewed event can request impact analysis.',
    )
  }

  return {
    ...event,
    analysisStatus: 'Analyzing',
    analysisError: null,
  }
}

function createGeneratedReviewTasks(event, result) {
  return result.reviewTasks.map((task, index) => ({
    id: `${event.id}-ai-impact-task-${index + 1}`,
    title: task.title,
    description: task.objective,
    priority: task.priority,
    status: 'Not Started',
    reviewQuestions: [],
    suggestedDocuments: [task.suggestedDocument],
    relatedLegalSource: event.sourceTitle,
    relatedLegalTopic: task.legalTopic,
    relatedRegulation: event.title,
    regulatoryChangeEvent: `${event.title} · Source-detected review event`,
    regulatoryChangeEventId: event.id,
    legalComplianceTopic: task.legalTopic,
    suggestedDocumentType: task.suggestedDocument,
    impactRiskLevel: task.priority,
    reasonForReview: task.objective,
    provenance: {
      sourceExternalId: event.sourceExternalId,
      officialSourceUrl: event.sourceUrl,
      analysisMethod: result.analysisMethod,
      sourceEvidenceIds: [...task.evidenceIds],
    },
    legalBasis: [...task.legalBasis],
  }))
}

export function applyPreliminaryImpactAnalysis(event, result) {
  if (
    event?.eventKind !== 'source-detected-review' ||
    result?.analysisMethod !== REGULATORY_IMPACT_ANALYSIS_METHOD ||
    result.requiresHumanReview !== true
  ) {
    throw new Error('A valid preliminary impact analysis result is required.')
  }

  const generatedReviewTasks = createGeneratedReviewTasks(event, result)

  return {
    ...event,
    analysisStatus:
      result.impactAssessment.level === 'Further Review Required'
        ? 'Further Review Required'
        : 'Analysis completed',
    analysisError: null,
    impactAnalysis: result,
    shortSummary: result.changeSummary.newRequirement,
    changeSummary: {
      comparisonMode: result.changeSummary.comparisonMode,
      previousRequirement: result.changeSummary.previousRequirement,
      newRequirement: result.changeSummary.newRequirement,
      preliminaryInterpretation:
        result.changeSummary.preliminaryInterpretation,
      whyItMatters: result.changeSummary.whyItMatters,
      legalBasis: [...result.changeSummary.legalBasis],
    },
    affectedLegalTopics: [
      ...new Set(result.reviewTasks.map((task) => task.legalTopic)),
    ],
    potentiallyAffectedActivities: result.affectedActivities.map(
      (item) => item.activity,
    ),
    affectedActivityDetails: result.affectedActivities.map((item) => ({
      ...item,
    })),
    documentsToReview: result.suggestedDocuments.map(
      (item) => item.documentName,
    ),
    documentReviewDetails: result.suggestedDocuments.map((item) => ({
      ...item,
    })),
    preliminaryImpactLevel: result.impactAssessment.level,
    requiresHumanReview: true,
    generatedReviewTasks,
  }
}

export function markRegulatoryEventAnalysisFailed(event, errorMessage) {
  return {
    ...event,
    analysisStatus: 'Analysis failed',
    analysisError:
      typeof errorMessage === 'string' && errorMessage.trim()
        ? errorMessage.trim()
        : 'Preliminary impact analysis failed.',
  }
}
