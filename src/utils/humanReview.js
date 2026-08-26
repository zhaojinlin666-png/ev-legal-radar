import { HUMAN_REVIEW_STATUSES } from '../../shared/regulatoryImpactContract.js'

export function createHumanReviewRecord(status, originalText, editedText = null) {
  if (!HUMAN_REVIEW_STATUSES.includes(status)) {
    throw new TypeError(`Unsupported human review status: ${status}`)
  }

  if (typeof originalText !== 'string' || originalText.trim().length === 0) {
    throw new TypeError('Human review requires non-empty original text.')
  }

  if (
    status === 'Edited' &&
    (typeof editedText !== 'string' || editedText.trim().length === 0)
  ) {
    throw new TypeError('Edited review text must be non-empty.')
  }

  return {
    status,
    originalText,
    editedText: status === 'Edited' ? editedText.trim() : null,
    humanReviewed: status !== 'Unreviewed',
    legallyVerified: false,
  }
}

export function getHumanReviewedText(originalText, record) {
  return record?.status === 'Edited' && record.editedText
    ? record.editedText
    : originalText
}

export function summarizeHumanReviewRecords(reviewKeys, records = {}) {
  const summary = Object.fromEntries(
    HUMAN_REVIEW_STATUSES.map((status) => [status, 0]),
  )

  reviewKeys.forEach((reviewKey) => {
    const status = records[reviewKey]?.status || 'Unreviewed'
    summary[HUMAN_REVIEW_STATUSES.includes(status) ? status : 'Unreviewed'] += 1
  })

  return { total: reviewKeys.length, ...summary }
}

export function getRegulatoryImpactReviewKeys(event) {
  if (!event?.impactAnalysis) return []

  return [
    'change:new-requirement',
    'change:preliminary-interpretation',
    'change:why-it-matters',
    'impact:rationale',
    ...event.impactAnalysis.impactAssessment.factors.map(
      (_factor, index) => `impact-factor:${index}`,
    ),
    ...event.affectedActivityDetails.map(
      (_activity, index) => `affected-activity:${index}`,
    ),
    ...event.documentReviewDetails.map(
      (_document, index) => `suggested-document:${index}`,
    ),
    ...event.generatedReviewTasks.map((task) => `review-task:${task.id}`),
  ]
}
