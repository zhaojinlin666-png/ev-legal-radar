import { regulatoryUpdates } from './regulatoryUpdates.js'

export const REGULATORY_CHANGE_TYPES = Object.freeze([
  'Unclassified',
  'New Regulation',
  'Amendment',
  'Implementation Guidance',
  'Enforcement Update',
  'Technical Standard',
  'Other',
])

export const REVIEW_TASK_STATUSES = Object.freeze([
  'Not Started',
  'In Review',
  'Completed',
])

const UNREVIEWED_IMPACT =
  'The preliminary legal impact has not been independently reviewed for this demo event.'

/**
 * @typedef {Object} GeneratedReviewTask
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'High'|'Medium'|'Low'} priority
 * @property {'Not Started'|'In Review'|'Completed'} status
 * @property {string[]} reviewQuestions
 * @property {string[]} suggestedDocuments
 * @property {string} relatedLegalSource
 * @property {string} relatedLegalTopic
 * @property {string} relatedRegulation
 * @property {string} regulatoryChangeEvent
 * @property {string} regulatoryChangeEventId
 * @property {string} legalComplianceTopic
 * @property {string} suggestedDocumentType
 * @property {'High'|'Medium'|'Low'} impactRiskLevel
 * @property {string} reasonForReview
 */

/**
 * @typedef {Object} RegulatoryChangeEvent
 * @property {string} id
 * @property {string} title
 * @property {string} jurisdiction
 * @property {string} regulator
 * @property {string} publicationDate
 * @property {string|null} effectiveDate
 * @property {'Unclassified'|'New Regulation'|'Amendment'|'Implementation Guidance'|'Enforcement Update'|'Technical Standard'|'Other'} changeType
 * @property {string} sourceTitle
 * @property {string|null} sourceUrl
 * @property {string} verificationStatus
 * @property {string} demoLabel
 * @property {string} shortSummary
 * @property {{comparisonMode: 'new_source_summary'|'verified_change_comparison', previousRequirement: string|null, newRequirement: string, preliminaryInterpretation: string, whyItMatters: string}} changeSummary
 * @property {string[]} affectedLegalTopics
 * @property {string[]} potentiallyAffectedActivities
 * @property {string[]} documentsToReview
 * @property {'High'|'Medium'|'Low'|null} preliminaryImpactLevel
 * @property {boolean} requiresHumanReview
 * @property {GeneratedReviewTask[]} generatedReviewTasks
 */

function getExistingUpdate(id) {
  const update = regulatoryUpdates.find((item) => item.id === id)

  if (!update) {
    throw new Error(`Missing existing regulatory update ${id}`)
  }

  return update
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
}

function getRelatedLegalTopic(update) {
  return (
    update.legalTopics.join(' / ') ||
    'Not specified in current project data'
  )
}

function createExistingReviewTasks(update) {
  return update.legalReviewItems.map((item, index) => {
    const legalTopic = getRelatedLegalTopic(update)
    const suggestedDocumentType =
      item.documentsToReview[0] ||
      'Not specified in current project data'

    return {
      id: `${update.id}-existing-review-${index + 1}`,
      title: item.requirement,
      description: item.suggestedLegalAction,
      priority: item.priority,
      status: 'Not Started',
      reviewQuestions: [...item.reviewQuestions],
      suggestedDocuments: [...item.documentsToReview],
      relatedLegalSource: item.legalSource
        ? `${item.legalSource.title} · ${item.legalSource.article}`
        : update.title,
      relatedLegalTopic: legalTopic,
      relatedRegulation: update.title,
      regulatoryChangeEvent: `${update.title} · Demo change event`,
      regulatoryChangeEventId: `demo-change-${update.id}`,
      legalComplianceTopic: legalTopic,
      suggestedDocumentType,
      impactRiskLevel: item.priority,
      reasonForReview:
        'The current demo impact record identifies this requirement for preliminary factual and document review.',
    }
  })
}

function createDemoVerificationTasks(update, suggestedDocuments) {
  const priority = update.riskLevel
  const legalTopic = getRelatedLegalTopic(update)
  const suggestedDocumentType =
    suggestedDocuments[0] || 'Not specified in current project data'
  const sharedWorkflowMetadata = {
    relatedRegulation: update.title,
    regulatoryChangeEvent: `${update.title} · Demo change event`,
    regulatoryChangeEventId: `demo-change-${update.id}`,
    legalComplianceTopic: legalTopic,
    suggestedDocumentType,
    impactRiskLevel: priority,
  }

  return [
    {
      id: `${update.id}-verify-source`,
      title: `Verify the ${update.title} demo event against official materials`,
      description:
        'Confirm the update record and its dates against an official source before relying on the demo summary for legal review.',
      priority,
      status: 'Not Started',
      reviewQuestions: [
        'Is an official source available for this demo update event?',
        'Does the official source confirm the title, issuing authority, publication date, and effective date recorded here?',
        'Which statements in the current summary can be matched directly to the official source?',
      ],
      suggestedDocuments: ['Official publication or source record'],
      relatedLegalSource: update.title,
      relatedLegalTopic: legalTopic,
      reasonForReview:
        'The demo event must be checked against official materials before its summary is relied on.',
      ...sharedWorkflowMetadata,
    },
    {
      id: `${update.id}-review-existing-summary`,
      title: 'Review the existing project summary and identify facts requiring confirmation',
      description:
        'Use the current project summary only as a research starting point and record which points still require source or factual verification.',
      priority,
      status: 'Not Started',
      reviewQuestions: [
        'Which potentially affected activities are supported by the existing project record?',
        'Which suggested review materials are relevant to the existing summary?',
        'Which preliminary impact questions require further human legal review?',
      ],
      suggestedDocuments,
      relatedLegalSource: update.title,
      relatedLegalTopic: legalTopic,
      reasonForReview:
        'The demo summary contains preliminary impact questions that still require source and factual confirmation.',
      ...sharedWorkflowMetadata,
    },
  ]
}

function createEvent({
  update,
  changeType,
  activities,
  documents,
  tasks,
  verifiedSourceMetadata = false,
}) {
  return {
    id: `demo-change-${update.id}`,
    title: update.title,
    jurisdiction: update.jurisdiction,
    regulator: update.regulator,
    publicationDate: update.publicationDate,
    effectiveDate: update.effectiveDate,
    changeType,
    sourceTitle: update.title,
    sourceUrl: update.sourceUrl,
    verificationStatus: verifiedSourceMetadata
      ? 'Demo event · Source metadata verified'
      : 'Demo change event · Source verification pending',
    demoLabel: 'Demo change event',
    shortSummary: update.summary,
    changeSummary: {
      comparisonMode: 'new_source_summary',
      previousRequirement: null,
      newRequirement: update.summary,
      preliminaryInterpretation:
        'This demo summary is a preliminary research interpretation and requires human legal review.',
      whyItMatters: update.businessImpact || UNREVIEWED_IMPACT,
    },
    affectedLegalTopics: [...update.legalTopics],
    potentiallyAffectedActivities: unique(activities),
    documentsToReview: unique(documents),
    preliminaryImpactLevel: update.riskLevel,
    requiresHumanReview: true,
    generatedReviewTasks: tasks,
  }
}

const euAiGuidance = getExistingUpdate(1)
const chinaAutomotiveData = getExistingUpdate(2)
const euBatteryRegulation = getExistingUpdate(3)
const usAutonomousVehicleGuidance = getExistingUpdate(4)

const chinaDocuments = unique(
  chinaAutomotiveData.legalReviewItems.flatMap(
    (item) => item.documentsToReview,
  ),
)
const euAiDocuments = ['Technical documentation']
const euBatteryDocuments = [
  'Carbon-footprint declaration materials',
  'Supply-chain due-diligence materials',
  'Battery passport readiness materials',
]
const usGuidanceDocuments = [
  'Safety assessment materials',
  'Incident reporting materials',
  'Transparency materials',
]

/** @type {RegulatoryChangeEvent[]} */
export const regulatoryChangeEvents = [
  createEvent({
    update: chinaAutomotiveData,
    changeType: 'New Regulation',
    activities: [
      'Data Collection',
      'Privacy Notice',
      'Vehicle Data Processing',
      'Cross-border Data Transfer',
      'Product Design',
      'R&D',
      'Manufacturing',
      'Sales',
      'After-sales',
      'Autonomous Driving',
    ],
    documents: chinaDocuments,
    tasks: createExistingReviewTasks(chinaAutomotiveData),
    verifiedSourceMetadata: true,
  }),
  createEvent({
    update: euAiGuidance,
    changeType: 'Implementation Guidance',
    activities: ['AI Governance'],
    documents: euAiDocuments,
    tasks: createDemoVerificationTasks(euAiGuidance, euAiDocuments),
  }),
  createEvent({
    update: euBatteryRegulation,
    changeType: 'Other',
    activities: ['Manufacturing', 'Supply Chain'],
    documents: euBatteryDocuments,
    tasks: createDemoVerificationTasks(
      euBatteryRegulation,
      euBatteryDocuments,
    ),
  }),
  createEvent({
    update: usAutonomousVehicleGuidance,
    changeType: 'Implementation Guidance',
    activities: ['Autonomous Driving'],
    documents: usGuidanceDocuments,
    tasks: createDemoVerificationTasks(
      usAutonomousVehicleGuidance,
      usGuidanceDocuments,
    ),
  }),
]
