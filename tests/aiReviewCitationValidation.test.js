import test from 'node:test'
import assert from 'node:assert/strict'
import { LEGAL_SOURCE_NOT_VERIFIED } from '../src/data/legalKnowledgeBase.js'
import { attachVerifiedLegalAuthorities } from '../src/data/ruleLegalAuthorityMap.js'
import {
  AiReviewValidationError,
  createAiReviewApiResponse,
  validateAndNormalizeAiReview,
} from '../server/services/aiReviewValidation.js'
import { buildReviewInput } from '../server/services/aiReviewService.js'
import { parseAiReviewApiResponse } from '../src/services/aiReviewService.js'

const DOCUMENT_TEXT = '我们收集姓名和手机号码用于账户管理。'

function createRule(id, issueType, legalContext) {
  return attachVerifiedLegalAuthorities({
    id,
    issueType,
    title: `Test ${issueType}`,
    description: 'Test rule',
    keywords: { direct: [], contextual: [] },
    riskLevel: 'High',
    legalContext,
  })
}

function createModelItem(rule, overrides = {}) {
  return {
    ruleId: rule.id,
    issueType: rule.issueType,
    title: rule.title,
    status: 'Found',
    evidenceFound: true,
    evidence: DOCUMENT_TEXT,
    observation: '基于当前文本识别到相关表述，仍建议人工复核。',
    legalAuthorityIds: rule.legalAuthorities.map(
      (authority) => authority.provisionId,
    ),
    riskLevel: rule.riskLevel,
    confidence: 'High',
    issueSummary: '当前文本中识别到相关信息。',
    riskReason: '该事项可能需要结合完整材料进一步确认。',
    suggestedRevision: '建议根据事实核查结果决定是否完善文本。',
    suggestedNextStep: '建议人工核对完整文件和实际处理场景。',
    ...overrides,
  }
}

test('server resolves a mapped citation from the local knowledge base', () => {
  const rule = createRule('information-categories', 'personal-information')
  const results = validateAndNormalizeAiReview({
    modelOutput: { reviewItems: [createModelItem(rule)] },
    documentText: DOCUMENT_TEXT,
    reviewRules: [rule],
  })

  assert.equal(results[0].legalArticle, 'Article 7')
  assert.equal(results[0].legalAuthorities.length, 1)
  assert.equal(results[0].legalAuthorities[0].verificationStatus, 'verified')
})

test('rejects a finding that changes the supplied legal issue type', () => {
  const rule = createRule('information-categories', 'personal-information')

  assert.throws(
    () =>
      validateAndNormalizeAiReview({
        modelOutput: {
          reviewItems: [
            createModelItem(rule, {
              issueType: 'cross-border-data-transfer',
            }),
          ],
        },
        documentText: DOCUMENT_TEXT,
        reviewRules: [rule],
      }),
    (error) =>
      error instanceof AiReviewValidationError &&
      error.validationCode === 'RULE_METADATA_MISMATCH',
  )
})

test('uses LEGAL_SOURCE_NOT_VERIFIED without blocking document analysis', () => {
  const rule = createRule(
    'cross-border-transfer',
    'cross-border-data-transfer',
  )
  const results = validateAndNormalizeAiReview({
    modelOutput: { reviewItems: [createModelItem(rule)] },
    documentText: DOCUMENT_TEXT,
    reviewRules: [rule],
  })

  assert.equal(results[0].status, 'Found')
  assert.equal(results[0].legalBasis, LEGAL_SOURCE_NOT_VERIFIED)
  assert.equal(results[0].legalArticle, LEGAL_SOURCE_NOT_VERIFIED)
  assert.deepEqual(results[0].legalAuthorities, [])
})

test('model cannot introduce an unapproved citation', () => {
  const importantDataCrossBorderRule = createRule(
    'cross-border-transfer',
    'cross-border-data-transfer',
    { importantDataContext: true },
  )
  const processingPurposeRule = createRule(
    'processing-purpose',
    'processing-purpose',
  )
  const automotiveArticleElevenId =
    importantDataCrossBorderRule.legalAuthorities[0].provisionId

  assert.throws(
    () =>
      validateAndNormalizeAiReview({
        modelOutput: {
          reviewItems: [
            createModelItem(processingPurposeRule, {
              legalAuthorityIds: [automotiveArticleElevenId],
            }),
          ],
        },
        documentText: DOCUMENT_TEXT,
        reviewRules: [processingPurposeRule],
      }),
    (error) =>
      error instanceof AiReviewValidationError &&
      error.validationCode === 'CITATION_EVIDENCE_MISMATCH',
  )
})

test('model input contains only rule-specific verified authorities', () => {
  const mappedRule = createRule(
    'information-categories',
    'personal-information',
  )
  const retentionRule = createRule('retention-period', 'data-retention')
  const crossBorderRule = createRule(
    'cross-border-transfer',
    'cross-border-data-transfer',
  )
  const input = JSON.parse(
    buildReviewInput({
      documentText: DOCUMENT_TEXT,
      reviewRules: [mappedRule, retentionRule, crossBorderRule],
      legalSource: { title: 'Test provenance only' },
    }),
  )

  assert.deepEqual(
    input.reviewRules[0].allowedLegalAuthorities.map(
      (authority) => authority.article,
    ),
    ['Article 7'],
  )
  assert.deepEqual(
    input.reviewRules[1].allowedLegalAuthorities.map(
      (authority) => authority.article,
    ),
    ['Article 7'],
  )
  assert.deepEqual(input.reviewRules[2].allowedLegalAuthorities, [])
})

test('retention disclosure authority cannot support a definitive duration conclusion', () => {
  const rule = createRule('retention-period', 'data-retention')

  assert.throws(
    () =>
      validateAndNormalizeAiReview({
        modelOutput: {
          reviewItems: [
            createModelItem(rule, {
              riskReason: '文本写明保存三年，因此该期限合规。',
            }),
          ],
        },
        documentText: DOCUMENT_TEXT,
        reviewRules: [rule],
      }),
    (error) =>
      error instanceof AiReviewValidationError &&
      error.validationCode === 'PROHIBITED_CONCLUSION',
  )
})

test('existing AI review results survive the server-to-client contract', () => {
  const rule = createRule('processing-purpose', 'processing-purpose')
  const normalizedResults = validateAndNormalizeAiReview({
    modelOutput: { reviewItems: [createModelItem(rule)] },
    documentText: DOCUMENT_TEXT,
    reviewRules: [rule],
  })
  const apiResponse = createAiReviewApiResponse(normalizedResults)
  const clientResults = parseAiReviewApiResponse(apiResponse)

  assert.equal(clientResults.length, 1)
  assert.equal(clientResults[0].status, 'Found')
  assert.deepEqual(
    clientResults[0].legalAuthorities.map((authority) => authority.article),
    ['Article 6', 'Article 7', 'Article 4', 'Article 7'],
  )
  assert.equal(clientResults[0].legalAuthorities[0].effectiveDate, null)
})
