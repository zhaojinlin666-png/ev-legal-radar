import { z } from 'zod'
import {
  getVerifiedProvisionById,
  LEGAL_SOURCE_NOT_VERIFIED,
} from '../../src/data/legalKnowledgeBase.js'
import {
  REGULATORY_IMPACT_ANALYSIS_METHOD,
  REGULATORY_IMPACT_CONFIDENCE_LEVELS,
  REGULATORY_IMPACT_LEVELS,
  REGULATORY_IMPACT_SCHEMA_VERSION,
} from '../../shared/regulatoryImpactContract.js'
import {
  REGULATORY_MONITORING_SOURCE,
  REGULATORY_RELEVANCE_KEYWORDS,
} from '../data/regulatoryMonitoringConfig.js'
import {
  createExternalId,
  normalizeSourceUrl,
} from './regulatoryMonitoringService.js'

const PROHIBITED_CONCLUSION_PATTERN =
  /\b(?:illegal|unlawful|non[-\s]?compliant|violation)\b|(?:\u8fdd\u6cd5|\u8fdd\u89c4|\u4e0d\u5408\u89c4|\u8fdd\u53cd\u6cd5\u5f8b)/iu
const AFFIRMATIVE_COMPLIANCE_CONCLUSION_PATTERN =
  /\b(?:is|are|therefore|thus|demonstrates?|establishes?)\b[^.]{0,30}\b(?:lawful|compliant)\b|(?:\u56e0\u6b64|\u636e\u6b64|\u6545|\u8868\u660e|\u8bf4\u660e|\u53ef\u4ee5\u8ba4\u5b9a|\u53ef\u8ba4\u5b9a|\u5df2\u7ecf|\u5df2)[^\u3002\uff1b\n]{0,30}(?:\u5408\u6cd5|\u5408\u89c4|\u6ee1\u8db3(?:\u4e86)?(?:\u76f8\u5173)?(?:\u6cd5\u5f8b|\u89c4\u5b9a|\u8981\u6c42))/iu
const UNSUPPORTED_ARTICLE_CITATION_PATTERN =
  /(?:\u7b2c[\u4e00-\u9fa5\u96f6\u3007\u25cb\d]{1,12}\u6761)|(?:\bArticle\s+\d+[A-Za-z-]*\b)/iu

const eventMetadataSchema = z
  .object({
    externalId: z.string().min(1).max(160),
    title: z.string().min(1).max(500),
    regulator: z.string().min(1).max(800),
    publicationDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/u)
      .nullable(),
    sourceUrl: z.string().url().max(1200),
    matchedKeywords: z.array(z.string().min(1).max(80)).max(20),
    jurisdiction: z.literal('China'),
    detectionStatus: z.literal('Source detected'),
    verificationStatus: z.literal('Unreviewed'),
    changeType: z.literal('Unclassified'),
  })
  .strict()

const sourceEvidenceSchema = z
  .object({
    evidenceId: z.string().min(1).max(100),
    quotation: z.string().min(1).max(2400),
  })
  .strict()

const changeSummarySchema = z
  .object({
    whatChanged: z.string().min(1).max(1800),
    newRequirement: z.string().min(1).max(1800),
    whyItMatters: z.string().min(1).max(1800),
    evidenceIds: z.array(z.string().min(1).max(100)).max(20),
  })
  .strict()

const preliminaryImpactSchema = z
  .object({
    impactLevel: z.enum(REGULATORY_IMPACT_LEVELS),
    reasoning: z.string().min(1).max(2400),
    confidence: z.enum(REGULATORY_IMPACT_CONFIDENCE_LEVELS),
    evidenceIds: z.array(z.string().min(1).max(100)).max(20),
  })
  .strict()

const affectedActivitySchema = z
  .object({
    activity: z.string().min(1).max(300),
    reason: z.string().min(1).max(1200),
    evidenceIds: z.array(z.string().min(1).max(100)).min(1).max(20),
  })
  .strict()

const suggestedDocumentSchema = z
  .object({
    documentName: z.string().min(1).max(300),
    reason: z.string().min(1).max(1200),
    evidenceIds: z.array(z.string().min(1).max(100)).min(1).max(20),
  })
  .strict()

const reviewTaskSchema = z
  .object({
    title: z.string().min(1).max(500),
    objective: z.string().min(1).max(1600),
    legalTopic: z.string().min(1).max(300),
    suggestedDocument: z.string().min(1).max(300),
    priority: z.enum(['High', 'Medium', 'Low']),
    evidenceIds: z.array(z.string().min(1).max(100)).min(1).max(20),
  })
  .strict()

export const regulatoryImpactModelResponseSchema = z
  .object({
    sourceEvidence: z.array(sourceEvidenceSchema).max(20),
    changeSummary: changeSummarySchema,
    preliminaryImpact: preliminaryImpactSchema,
    affectedActivities: z.array(affectedActivitySchema).max(20),
    suggestedDocuments: z.array(suggestedDocumentSchema).max(20),
    reviewTasks: z.array(reviewTaskSchema).max(20),
    legalAuthorityIds: z.array(z.string().min(1).max(160)).max(20),
  })
  .strict()

const verifiedAuthoritySchema = z
  .object({
    provisionId: z.string().min(1).max(160),
    lawId: z.string().min(1).max(160),
    lawName: z.string().min(1).max(300),
    jurisdiction: z.string().min(1).max(120),
    article: z.string().min(1).max(120),
    topic: z.string().min(1).max(300),
    requirementSummary: z.string().min(1).max(1600),
    sourceUrl: z.string().url().max(1200),
    sourceAuthority: z.string().min(1).max(800),
    effectiveDate: z.string().min(1).max(40).nullable(),
    reviewScope: z.string().min(1).max(500),
    verificationStatus: z.literal('verified'),
  })
  .strict()

export const normalizedRegulatoryImpactResultSchema =
  regulatoryImpactModelResponseSchema
    .omit({ legalAuthorityIds: true })
    .extend({
      legalAuthorityStatus: z.union([
        z.literal('verified'),
        z.literal(LEGAL_SOURCE_NOT_VERIFIED),
      ]),
      legalAuthorities: z.array(verifiedAuthoritySchema).max(20),
      analysisMethod: z.literal(REGULATORY_IMPACT_ANALYSIS_METHOD),
      requiresHumanReview: z.literal(true),
    })
    .strict()

const regulatoryImpactApiResponseSchema = z
  .object({
    schemaVersion: z.literal(REGULATORY_IMPACT_SCHEMA_VERSION),
    result: normalizedRegulatoryImpactResultSchema,
  })
  .strict()

export class RegulatoryImpactValidationError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'RegulatoryImpactValidationError'
    this.statusCode = options.statusCode ?? 502
    this.publicMessage =
      options.publicMessage ||
      'Preliminary impact analysis returned an invalid response.'
    this.validationCode =
      options.validationCode || 'REGULATORY_IMPACT_VALIDATION_FAILED'
    this.validationIssues = options.validationIssues || []
  }
}

function getSafeSchemaIssues(error) {
  return error.issues.slice(0, 12).map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
  }))
}

function normalizeGroundedText(value) {
  return String(value)
    .replace(/\r\n?/gu, '\n')
    .replace(/[\t\f\v ]+/gu, ' ')
    .replace(/ *\n+ */gu, ' ')
    .trim()
}

function assertSourceEvidenceReferences(result) {
  const evidenceIds = new Set(
    result.sourceEvidence.map((evidence) => evidence.evidenceId),
  )
  const references = [
    { path: 'changeSummary.evidenceIds', ids: result.changeSummary.evidenceIds },
    {
      path: 'preliminaryImpact.evidenceIds',
      ids: result.preliminaryImpact.evidenceIds,
    },
    ...result.affectedActivities.map((item, index) => ({
      path: `affectedActivities.${index}.evidenceIds`,
      ids: item.evidenceIds,
    })),
    ...result.suggestedDocuments.map((item, index) => ({
      path: `suggestedDocuments.${index}.evidenceIds`,
      ids: item.evidenceIds,
    })),
    ...result.reviewTasks.map((item, index) => ({
      path: `reviewTasks.${index}.evidenceIds`,
      ids: item.evidenceIds,
    })),
  ]

  references.forEach(({ path, ids }) => {
    const hasDuplicateIds = new Set(ids).size !== ids.length
    const hasUnknownId = ids.some((evidenceId) => !evidenceIds.has(evidenceId))
    const requiresReference = evidenceIds.size > 0

    if (
      hasDuplicateIds ||
      hasUnknownId ||
      (requiresReference && ids.length === 0) ||
      (!requiresReference && ids.length > 0)
    ) {
      throw new RegulatoryImpactValidationError(
        'Preliminary impact analysis contained an invalid source-evidence reference.',
        {
          validationCode: 'SOURCE_EVIDENCE_REFERENCE_INVALID',
          validationIssues: [{ path, code: 'custom' }],
        },
      )
    }
  })
}

function getExpectedMatchedKeywords(title) {
  const normalizedTitle = title.toLocaleLowerCase('zh-CN')
  return REGULATORY_RELEVANCE_KEYWORDS.filter((keyword) =>
    normalizedTitle.includes(keyword.toLocaleLowerCase('zh-CN')),
  )
}

export function validateRegulatoryImpactRequest(input) {
  const parsedRequest = eventMetadataSchema.safeParse(input)

  if (!parsedRequest.success) {
    throw new RegulatoryImpactValidationError(
      'Regulatory impact request metadata was invalid.',
      {
        statusCode: 400,
        publicMessage: 'Regulatory event metadata is invalid.',
        validationCode: 'INVALID_EVENT_METADATA',
        validationIssues: getSafeSchemaIssues(parsedRequest.error),
      },
    )
  }

  const event = parsedRequest.data
  const normalizedUrl = normalizeSourceUrl(event.sourceUrl)
  const expectedExternalId = createExternalId({
    sourceUrl: normalizedUrl,
    title: event.title,
    publicationDate: event.publicationDate,
  })
  const expectedKeywords = getExpectedMatchedKeywords(event.title)

  if (
    !normalizedUrl ||
    event.regulator !== REGULATORY_MONITORING_SOURCE.regulator ||
    event.externalId !== expectedExternalId ||
    event.matchedKeywords.length !== expectedKeywords.length ||
    event.matchedKeywords.some(
      (keyword, index) => keyword !== expectedKeywords[index],
    )
  ) {
    throw new RegulatoryImpactValidationError(
      'Regulatory impact request did not match the monitored official source.',
      {
        statusCode: 400,
        publicMessage:
          'Regulatory event metadata does not match the monitored official source.',
        validationCode: 'EVENT_SOURCE_MISMATCH',
        validationIssues: [{ path: 'event', code: 'custom' }],
      },
    )
  }

  return { ...event, sourceUrl: normalizedUrl }
}

function assertGroundedSourceEvidence(sourceEvidence, officialSourceMaterial) {
  const evidenceIds = new Set()
  const normalizedSource = normalizeGroundedText(officialSourceMaterial)

  sourceEvidence.forEach((evidence, index) => {
    if (evidenceIds.has(evidence.evidenceId)) {
      throw new RegulatoryImpactValidationError(
        'Preliminary impact analysis returned duplicate source evidence IDs.',
        {
          validationCode: 'DUPLICATE_SOURCE_EVIDENCE_ID',
          validationIssues: [
            { path: `sourceEvidence.${index}.evidenceId`, code: 'custom' },
          ],
        },
      )
    }

    evidenceIds.add(evidence.evidenceId)

    if (!normalizedSource.includes(normalizeGroundedText(evidence.quotation))) {
      throw new RegulatoryImpactValidationError(
        'Preliminary impact analysis evidence was not present in the official source.',
        {
          validationCode: 'SOURCE_EVIDENCE_NOT_GROUNDED',
          validationIssues: [
            { path: `sourceEvidence.${index}.quotation`, code: 'custom' },
          ],
        },
      )
    }
  })
}

function getAnalyticalFields(result) {
  return [
    { path: 'changeSummary.whatChanged', value: result.changeSummary.whatChanged },
    {
      path: 'changeSummary.newRequirement',
      value: result.changeSummary.newRequirement,
    },
    {
      path: 'changeSummary.whyItMatters',
      value: result.changeSummary.whyItMatters,
    },
    {
      path: 'preliminaryImpact.reasoning',
      value: result.preliminaryImpact.reasoning,
    },
    ...result.affectedActivities.flatMap((item, index) => [
      { path: `affectedActivities.${index}.activity`, value: item.activity },
      { path: `affectedActivities.${index}.reason`, value: item.reason },
    ]),
    ...result.suggestedDocuments.flatMap((item, index) => [
      {
        path: `suggestedDocuments.${index}.documentName`,
        value: item.documentName,
      },
      { path: `suggestedDocuments.${index}.reason`, value: item.reason },
    ]),
    ...result.reviewTasks.flatMap((task, index) => [
      { path: `reviewTasks.${index}.title`, value: task.title },
      { path: `reviewTasks.${index}.objective`, value: task.objective },
      { path: `reviewTasks.${index}.legalTopic`, value: task.legalTopic },
      {
        path: `reviewTasks.${index}.suggestedDocument`,
        value: task.suggestedDocument,
      },
    ]),
  ]
}

function assertCautiousAnalysis(result) {
  const analyticalFields = getAnalyticalFields(result)
  const prohibitedConclusionIssues = analyticalFields.flatMap(
    ({ path, value }) =>
      PROHIBITED_CONCLUSION_PATTERN.test(value) ||
      AFFIRMATIVE_COMPLIANCE_CONCLUSION_PATTERN.test(value)
        ? [{ path, code: 'custom' }]
        : [],
  )

  if (prohibitedConclusionIssues.length > 0) {
    throw new RegulatoryImpactValidationError(
      'Preliminary impact analysis contained a prohibited legal conclusion.',
      {
        validationCode: 'PROHIBITED_CONCLUSION',
        validationIssues: prohibitedConclusionIssues,
      },
    )
  }

  const unsupportedCitationIssues = analyticalFields.flatMap(
    ({ path, value }) =>
      UNSUPPORTED_ARTICLE_CITATION_PATTERN.test(value)
        ? [{ path, code: 'custom' }]
        : [],
  )

  if (unsupportedCitationIssues.length > 0) {
    throw new RegulatoryImpactValidationError(
      'Preliminary impact analysis contained an unsupported article citation.',
      {
        validationCode: 'UNSUPPORTED_LEGAL_CITATION',
        validationIssues: unsupportedCitationIssues,
      },
    )
  }
}

function resolveLegalAuthorities(returnedAuthorityIds, allowedAuthorities) {
  const allowedIds = new Set(
    allowedAuthorities.map((authority) => authority.provisionId),
  )
  const returnedIds = new Set(returnedAuthorityIds)

  if (
    returnedIds.size !== returnedAuthorityIds.length ||
    returnedAuthorityIds.some((authorityId) => !allowedIds.has(authorityId))
  ) {
    throw new RegulatoryImpactValidationError(
      'Preliminary impact analysis cited unsupported legal authority.',
      {
        validationCode: 'UNSUPPORTED_LEGAL_AUTHORITY',
        validationIssues: [
          { path: 'legalAuthorityIds', code: 'custom' },
        ],
      },
    )
  }

  return returnedAuthorityIds.map((authorityId) => {
    const authority = getVerifiedProvisionById(authorityId)

    if (!authority || authority.verificationStatus !== 'verified') {
      throw new RegulatoryImpactValidationError(
        'Preliminary impact analysis cited unverified legal authority.',
        {
          validationCode: 'UNVERIFIED_LEGAL_AUTHORITY',
          validationIssues: [
            { path: 'legalAuthorityIds', code: 'custom' },
          ],
        },
      )
    }

    return authority
  })
}

export function validateAndNormalizeRegulatoryImpact({
  modelOutput,
  officialSourceMaterial,
  allowedAuthorities,
}) {
  const parsedOutput = regulatoryImpactModelResponseSchema.safeParse(modelOutput)

  if (!parsedOutput.success) {
    throw new RegulatoryImpactValidationError(
      'Preliminary impact analysis did not match the required schema.',
      {
        validationCode: 'MODEL_SCHEMA_MISMATCH',
        validationIssues: getSafeSchemaIssues(parsedOutput.error),
      },
    )
  }

  const result = parsedOutput.data
  assertGroundedSourceEvidence(
    result.sourceEvidence,
    officialSourceMaterial,
  )
  assertSourceEvidenceReferences(result)
  assertCautiousAnalysis(result)

  if (
    result.sourceEvidence.length === 0 &&
    (result.preliminaryImpact.impactLevel !== 'Further Review Required' ||
      result.affectedActivities.length > 0 ||
      result.suggestedDocuments.length > 0 ||
      result.reviewTasks.length > 0)
  ) {
    throw new RegulatoryImpactValidationError(
      'Preliminary impact analysis was not supported by official-source evidence.',
      {
        validationCode: 'INSUFFICIENT_SOURCE_GROUNDING',
        validationIssues: [{ path: 'sourceEvidence', code: 'custom' }],
      },
    )
  }

  const legalAuthorities = resolveLegalAuthorities(
    result.legalAuthorityIds,
    allowedAuthorities,
  )
  const normalizedResult = {
    sourceEvidence: result.sourceEvidence,
    changeSummary: result.changeSummary,
    preliminaryImpact: result.preliminaryImpact,
    affectedActivities: result.affectedActivities,
    suggestedDocuments: result.suggestedDocuments,
    reviewTasks: result.reviewTasks,
    legalAuthorityStatus:
      legalAuthorities.length > 0
        ? 'verified'
        : LEGAL_SOURCE_NOT_VERIFIED,
    legalAuthorities,
    analysisMethod: REGULATORY_IMPACT_ANALYSIS_METHOD,
    requiresHumanReview: true,
  }

  const parsedResult = normalizedRegulatoryImpactResultSchema.safeParse(
    normalizedResult,
  )

  if (!parsedResult.success) {
    throw new RegulatoryImpactValidationError(
      'Normalized preliminary impact analysis was invalid.',
      {
        validationCode: 'NORMALIZED_RESULT_SCHEMA_MISMATCH',
        validationIssues: getSafeSchemaIssues(parsedResult.error),
      },
    )
  }

  return parsedResult.data
}

export function createRegulatoryImpactApiResponse(result) {
  const parsedResponse = regulatoryImpactApiResponseSchema.safeParse({
    schemaVersion: REGULATORY_IMPACT_SCHEMA_VERSION,
    result,
  })

  if (!parsedResponse.success) {
    throw new RegulatoryImpactValidationError(
      'Preliminary impact API response was invalid.',
      {
        validationCode: 'API_RESPONSE_SCHEMA_MISMATCH',
        validationIssues: getSafeSchemaIssues(parsedResponse.error),
      },
    )
  }

  return parsedResponse.data
}
