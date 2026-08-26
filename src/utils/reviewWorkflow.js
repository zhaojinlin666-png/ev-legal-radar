export const REVIEW_CONTEXT_KIND = 'workflow-metadata-only'

const DOCUMENT_NOT_SPECIFIED = 'Not specified in current project data'

/**
 * Creates navigation metadata only. Deliberately excludes document evidence,
 * legal-source records and legal-authority identifiers.
 */
export function createDocumentReviewContext(event, task) {
  if (!event?.id || !task?.id) {
    throw new Error('A regulatory event and review task are required.')
  }

  return {
    contextKind: REVIEW_CONTEXT_KIND,
    originEventId: event.id,
    originTaskId: task.id,
    relatedRegulationTitle: task.relatedRegulation || event.sourceTitle,
    regulatoryChangeEvent: task.regulatoryChangeEvent || event.title,
    reviewTask: task.title,
    legalTopic:
      task.legalComplianceTopic || task.relatedLegalTopic,
    suggestedDocumentType:
      task.suggestedDocumentType ||
      task.suggestedDocuments?.[0] ||
      DOCUMENT_NOT_SPECIFIED,
    impactRiskLevel:
      task.impactRiskLevel || task.priority || event.preliminaryImpactLevel,
    demoLabel: event.demoLabel,
  }
}

