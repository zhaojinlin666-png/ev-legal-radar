import { z } from 'zod'
import {
  LEGAL_ISSUE_TYPES,
  LEGAL_SOURCE_NOT_VERIFIED,
} from '../../src/data/legalEvidence.js'
import {
  AI_REVIEW_SCHEMA_VERSION,
  LEGAL_AUTHORITY_STATUSES,
  REVIEW_CONFIDENCE_LEVELS,
  REVIEW_RISK_LEVELS,
  REVIEW_STATUSES,
} from '../../shared/aiReviewContract.js'

const EMPTY_EVIDENCE_MESSAGE =
  '在当前上传文档中未识别到可作为该项初步判断依据的相关原文。'

const PROHIBITED_CONCLUSION_PATTERN =
  /\b(?:illegal|unlawful|non[-\s]?compliant|violation)\b|(?:违法|违规|不合规|违反法律)/iu

const AFFIRMATIVE_COMPLIANCE_CONCLUSION_PATTERN =
  /\b(?:is|are|therefore|thus|demonstrates?|establishes?)\b[^.]{0,30}\b(?:lawful|compliant)\b|(?:因此|据此|故|表明|说明|可以认定|可认定|已经|已)[^。；\n]{0,30}(?:合法|合规|满足(?:了)?(?:相关)?(?:法律|规定|要求))/iu

const modelReviewItemSchema = z
  .object({
    ruleId: z.string().min(1).max(120),
    issueType: z.enum(LEGAL_ISSUE_TYPES),
    title: z.string().min(1).max(300),
    status: z.enum(REVIEW_STATUSES),
    evidenceFound: z.boolean(),
    evidence: z.string().max(1600),
    observation: z.string().min(1).max(1600),
    legalAuthorityIds: z.array(z.string().min(1).max(160)).max(10),
    riskLevel: z.enum(REVIEW_RISK_LEVELS),
    confidence: z.enum(REVIEW_CONFIDENCE_LEVELS),
    issueSummary: z.string().min(1).max(500),
    riskReason: z.string().min(1).max(1600),
    suggestedRevision: z.string().min(1).max(1600),
    suggestedNextStep: z.string().min(1).max(1200),
  })
  .strict()

export const aiReviewResponseSchema = z
  .object({
    reviewItems: z.array(modelReviewItemSchema).min(1).max(50),
  })
  .strict()

const normalizedAiReviewItemSchema = z
  .object({
    ruleId: z.string().min(1).max(120),
    title: z.string().min(1).max(300),
    status: z.enum(REVIEW_STATUSES),
    evidence: z.string().min(1).max(1600),
    observation: z.string().min(1).max(1600),
    legalBasis: z.string().min(1).max(500),
    legalArticle: z.string().min(1).max(200),
    legalAuthorityStatus: z.enum(LEGAL_AUTHORITY_STATUSES),
    legalAuthorities: z
      .array(
        z
          .object({
            provisionId: z.string().min(1).max(160),
            lawId: z.string().min(1).max(160),
            lawName: z.string().min(1).max(300),
            jurisdiction: z.string().min(1).max(120),
            article: z.string().min(1).max(120),
            topic: z.string().min(1).max(200),
            requirementSummary: z.string().min(1).max(1200),
            sourceUrl: z.string().url().max(1000),
            sourceAuthority: z.string().min(1).max(600),
            effectiveDate: z.string().min(1).max(40).nullable(),
            reviewScope: z.string().min(1).max(300),
            verificationStatus: z.literal('verified'),
          })
          .strict(),
      )
      .max(10),
    riskLevel: z.enum(REVIEW_RISK_LEVELS),
    analysisMethod: z.literal('AI-assisted preliminary review'),
    confidence: z.enum(REVIEW_CONFIDENCE_LEVELS),
    requiresHumanReview: z.literal(true),
    issueSummary: z.string().min(1).max(500),
    riskReason: z.string().min(1).max(1600),
    suggestedRevision: z.string().min(1).max(1600),
    suggestedNextStep: z.string().min(1).max(1200),
  })
  .strict()

const aiReviewApiResponseSchema = z
  .object({
    schemaVersion: z.literal(AI_REVIEW_SCHEMA_VERSION),
    results: z.array(normalizedAiReviewItemSchema).min(1).max(50),
  })
  .strict()

export class AiReviewValidationError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'AiReviewValidationError'
    this.statusCode = 502
    this.publicMessage = 'AI review returned an invalid response.'
    this.validationCode =
      options.validationCode || 'AI_REVIEW_VALIDATION_FAILED'
    this.validationIssues = options.validationIssues || []
  }
}

function getSafeSchemaIssues(error) {
  return error.issues.slice(0, 12).map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
  }))
}

function normalizeComparableText(value) {
  return String(value).normalize('NFKC').replace(/\s+/g, ' ').trim()
}

function normalizeEvidenceFormatting(value) {
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n+ */g, ' ')
    .trim()
}

function assertExactMatch(actual, expected, fieldName, ruleId) {
  if (normalizeComparableText(actual) !== normalizeComparableText(expected)) {
    throw new AiReviewValidationError(
      `AI response ${fieldName} did not match supplied rule ${ruleId}.`,
      {
        validationCode: 'RULE_METADATA_MISMATCH',
        validationIssues: [
          { path: `reviewItems.${ruleId}.${fieldName}`, code: 'custom' },
        ],
      },
    )
  }
}

function assertNoDefinitiveConclusion(value, fieldName, ruleId) {
  if (
    PROHIBITED_CONCLUSION_PATTERN.test(value) ||
    AFFIRMATIVE_COMPLIANCE_CONCLUSION_PATTERN.test(value)
  ) {
    throw new AiReviewValidationError(
      `AI response ${fieldName} contained a prohibited definitive conclusion for rule ${ruleId}.`,
      {
        validationCode: 'PROHIBITED_CONCLUSION',
        validationIssues: [
          { path: `reviewItems.${ruleId}.${fieldName}`, code: 'custom' },
        ],
      },
    )
  }
}

function assertCitationAuthorityMatch(item, rule) {
  const allowedAuthorityIds = (rule.legalAuthorities || []).map(
    (authority) => authority.provisionId,
  )
  const returnedAuthorityIds = item.legalAuthorityIds
  const hasDuplicateReturnedIds =
    new Set(returnedAuthorityIds).size !== returnedAuthorityIds.length
  const citationMismatch =
    hasDuplicateReturnedIds ||
    returnedAuthorityIds.length !== allowedAuthorityIds.length ||
    returnedAuthorityIds.some(
      (authorityId) => !allowedAuthorityIds.includes(authorityId),
    )

  if (citationMismatch) {
    throw new AiReviewValidationError(
      `AI response cited legal authority not supplied for rule ${rule.id}.`,
      {
        validationCode: 'CITATION_EVIDENCE_MISMATCH',
        validationIssues: [
          {
            path: `reviewItems.${rule.id}.legalAuthorityIds`,
            code: 'custom',
          },
        ],
      },
    )
  }

}

export function validateEvidenceGrounding({
  evidenceFound,
  evidence,
  documentText,
  ruleId,
}) {
  const cleanEvidence = evidence.trim()

  if (!evidenceFound) {
    if (cleanEvidence) {
      throw new AiReviewValidationError(
        `AI response returned evidence while evidenceFound was false for rule ${ruleId}.`,
        {
          validationCode: 'EVIDENCE_STATE_MISMATCH',
          validationIssues: [
            { path: `reviewItems.${ruleId}.evidence`, code: 'custom' },
          ],
        },
      )
    }

    return ''
  }

  if (!cleanEvidence) {
    throw new AiReviewValidationError(
      `AI response marked evidenceFound true without evidence for rule ${ruleId}.`,
      {
        validationCode: 'EVIDENCE_STATE_MISMATCH',
        validationIssues: [
          { path: `reviewItems.${ruleId}.evidenceFound`, code: 'custom' },
        ],
      },
    )
  }

  const normalizedDocument = normalizeEvidenceFormatting(documentText)
  const normalizedEvidence = normalizeEvidenceFormatting(cleanEvidence)
  const isNormalizedExactMatch = normalizedDocument.includes(
    normalizedEvidence,
  )

  if (!isNormalizedExactMatch) {
    console.warn('AI evidence grounding validation failed.', {
      ruleId,
      evidenceLength: cleanEvidence.length,
      normalizedExactMatch: false,
      validationCode: 'EVIDENCE_NOT_IN_DOCUMENT',
    })

    throw new AiReviewValidationError(
      `AI response evidence was not present in the document for rule ${ruleId}.`,
      {
        validationCode: 'EVIDENCE_NOT_IN_DOCUMENT',
        validationIssues: [
          { path: `reviewItems.${ruleId}.evidence`, code: 'custom' },
        ],
      },
    )
  }

  return cleanEvidence
}

export function validateAndNormalizeAiReview({
  modelOutput,
  documentText,
  reviewRules,
}) {
  const parsedOutput = aiReviewResponseSchema.safeParse(modelOutput)

  if (!parsedOutput.success) {
    throw new AiReviewValidationError(
      'AI response did not match the required review schema.',
      {
        validationCode: 'MODEL_SCHEMA_MISMATCH',
        validationIssues: getSafeSchemaIssues(parsedOutput.error),
      },
    )
  }

  if (parsedOutput.data.reviewItems.length !== reviewRules.length) {
    throw new AiReviewValidationError(
      'AI response did not contain exactly one item for each supplied rule.',
      {
        validationCode: 'REVIEW_ITEM_COUNT_MISMATCH',
        validationIssues: [
          { path: 'reviewItems', code: 'custom' },
        ],
      },
    )
  }

  const itemsByRuleId = new Map()

  for (const item of parsedOutput.data.reviewItems) {
    if (itemsByRuleId.has(item.ruleId)) {
      throw new AiReviewValidationError(
        `AI response contained duplicate rule ID ${item.ruleId}.`,
        {
          validationCode: 'DUPLICATE_RULE_ID',
          validationIssues: [
            { path: `reviewItems.${item.ruleId}.ruleId`, code: 'custom' },
          ],
        },
      )
    }

    itemsByRuleId.set(item.ruleId, item)
  }

  const normalizedResults = reviewRules.map((rule) => {
    const item = itemsByRuleId.get(rule.id)

    if (!item) {
      throw new AiReviewValidationError(
        `AI response omitted supplied rule ${rule.id}.`,
        {
          validationCode: 'MISSING_RULE_ID',
          validationIssues: [
            { path: `reviewItems.${rule.id}`, code: 'custom' },
          ],
        },
      )
    }

    assertExactMatch(item.title, rule.title, 'title', rule.id)
    assertExactMatch(item.issueType, rule.issueType, 'issue type', rule.id)
    assertCitationAuthorityMatch(item, rule)
    assertExactMatch(
      item.riskLevel,
      rule.riskLevel,
      'risk level',
      rule.id,
    )

    const evidence = validateEvidenceGrounding({
      evidenceFound: item.evidenceFound,
      evidence: item.evidence,
      documentText,
      ruleId: rule.id,
    })

    if (item.status === 'Found' && !item.evidenceFound) {
      throw new AiReviewValidationError(
        `AI response marked rule ${rule.id} as found without document evidence.`,
        {
          validationCode: 'FOUND_WITHOUT_EVIDENCE',
          validationIssues: [
            { path: `reviewItems.${rule.id}.evidence`, code: 'custom' },
          ],
        },
      )
    }

    const analyticalFields = [
      ['observation', item.observation],
      ['issue summary', item.issueSummary],
      ['risk reason', item.riskReason],
      ['suggested revision', item.suggestedRevision],
      ['suggested next step', item.suggestedNextStep],
    ]

    analyticalFields.forEach(([fieldName, value]) =>
      assertNoDefinitiveConclusion(value, fieldName, rule.id),
    )

    return {
      ruleId: rule.id,
      title: rule.title,
      status: item.status,
      evidence: evidence || EMPTY_EVIDENCE_MESSAGE,
      observation: item.observation,
      legalBasis: rule.legalBasis,
      legalArticle: rule.legalArticle,
      legalAuthorityStatus:
        rule.legalAuthorities.length > 0
          ? 'verified'
          : LEGAL_SOURCE_NOT_VERIFIED,
      legalAuthorities: rule.legalAuthorities.map((authority) => ({
        ...authority,
      })),
      riskLevel: rule.riskLevel,
      analysisMethod: 'AI-assisted preliminary review',
      confidence: item.confidence,
      requiresHumanReview: true,
      issueSummary: item.issueSummary,
      riskReason: item.riskReason,
      suggestedRevision: item.suggestedRevision,
      suggestedNextStep: item.suggestedNextStep,
    }
  })

  const parsedResults = z
    .array(normalizedAiReviewItemSchema)
    .safeParse(normalizedResults)

  if (!parsedResults.success) {
    throw new AiReviewValidationError(
      'Normalized AI review results did not match the API result schema.',
      {
        validationCode: 'NORMALIZED_RESULT_SCHEMA_MISMATCH',
        validationIssues: getSafeSchemaIssues(parsedResults.error),
      },
    )
  }

  return parsedResults.data
}

export function createAiReviewApiResponse(results) {
  const parsedResponse = aiReviewApiResponseSchema.safeParse({
    schemaVersion: AI_REVIEW_SCHEMA_VERSION,
    results,
  })

  if (!parsedResponse.success) {
    throw new AiReviewValidationError(
      'AI review API response did not match the required schema.',
      {
        validationCode: 'API_RESPONSE_SCHEMA_MISMATCH',
        validationIssues: getSafeSchemaIssues(parsedResponse.error),
      },
    )
  }

  return parsedResponse.data
}
