import { z } from 'zod'

const MODEL_RESULTS = Object.freeze([
  'found',
  'potential_gap',
  'further_review_required',
])

const EMPTY_EVIDENCE_MESSAGE =
  'No relevant passage was identified in the uploaded document.'

const modelReviewItemSchema = z
  .object({
    ruleId: z.string().min(1).max(120),
    issue: z.string().min(1).max(300),
    result: z.enum(MODEL_RESULTS),
    evidence: z.string().max(1600),
    preliminaryObservation: z.string().min(1).max(1600),
    legalBasis: z.string().min(1).max(500),
    legalArticle: z.string().min(1).max(200),
    reviewPriority: z.enum(['High', 'Medium', 'Low']),
    confidence: z.enum(['High', 'Medium', 'Low']),
  })
  .strict()

export const aiReviewResponseSchema = z
  .object({
    reviewItems: z.array(modelReviewItemSchema).min(1).max(50),
  })
  .strict()

export class AiReviewValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AiReviewValidationError'
    this.statusCode = 502
    this.publicMessage = 'AI review returned an invalid response.'
  }
}

function normalizeComparableText(value) {
  return String(value).normalize('NFKC').replace(/\s+/g, ' ').trim()
}

function stripWrappingQuotes(value) {
  const evidence = value.trim()
  const quotePairs = {
    '"': '"',
    "'": "'",
    '“': '”',
    '‘': '’',
  }
  const expectedClosingQuote = quotePairs[evidence[0]]

  if (expectedClosingQuote && evidence.endsWith(expectedClosingQuote)) {
    return evidence.slice(1, -1).trim()
  }

  return evidence
}

function assertExactMatch(actual, expected, fieldName, ruleId) {
  if (normalizeComparableText(actual) !== normalizeComparableText(expected)) {
    throw new AiReviewValidationError(
      `AI response ${fieldName} did not match supplied rule ${ruleId}.`,
    )
  }
}

function validateEvidence(evidence, documentText, ruleId) {
  const cleanEvidence = stripWrappingQuotes(evidence)

  if (!cleanEvidence) return ''

  const normalizedDocument = normalizeComparableText(documentText)
  const normalizedEvidence = normalizeComparableText(cleanEvidence)

  if (!normalizedDocument.includes(normalizedEvidence)) {
    throw new AiReviewValidationError(
      `AI response evidence was not present in the document for rule ${ruleId}.`,
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
    )
  }

  if (parsedOutput.data.reviewItems.length !== reviewRules.length) {
    throw new AiReviewValidationError(
      'AI response did not contain exactly one item for each supplied rule.',
    )
  }

  const itemsByRuleId = new Map()

  for (const item of parsedOutput.data.reviewItems) {
    if (itemsByRuleId.has(item.ruleId)) {
      throw new AiReviewValidationError(
        `AI response contained duplicate rule ID ${item.ruleId}.`,
      )
    }

    itemsByRuleId.set(item.ruleId, item)
  }

  return reviewRules.map((rule) => {
    const item = itemsByRuleId.get(rule.id)

    if (!item) {
      throw new AiReviewValidationError(
        `AI response omitted supplied rule ${rule.id}.`,
      )
    }

    assertExactMatch(item.issue, rule.title, 'issue', rule.id)
    assertExactMatch(item.legalBasis, rule.legalBasis, 'legal basis', rule.id)
    assertExactMatch(
      item.legalArticle,
      rule.legalArticle,
      'legal article',
      rule.id,
    )
    assertExactMatch(
      item.reviewPriority,
      rule.riskLevel,
      'review priority',
      rule.id,
    )

    const evidence = validateEvidence(item.evidence, documentText, rule.id)

    if (item.result === 'found' && !evidence) {
      throw new AiReviewValidationError(
        `AI response marked rule ${rule.id} as found without document evidence.`,
      )
    }

    return {
      ruleId: rule.id,
      issue: rule.title,
      result: item.result,
      evidence: evidence || EMPTY_EVIDENCE_MESSAGE,
      preliminaryObservation: item.preliminaryObservation,
      legalBasis: rule.legalBasis,
      legalArticle: rule.legalArticle,
      reviewPriority: rule.riskLevel,
      analysisMethod: 'AI-assisted preliminary review',
      confidence: item.confidence,
      requiresHumanReview: true,
    }
  })
}
