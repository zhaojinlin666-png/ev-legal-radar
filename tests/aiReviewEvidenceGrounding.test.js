import test from 'node:test'
import assert from 'node:assert/strict'
import { attachVerifiedLegalAuthorities } from '../src/data/ruleLegalAuthorityMap.js'
import {
  AiReviewValidationError,
  validateAndNormalizeAiReview,
  validateEvidenceGrounding,
} from '../server/services/aiReviewValidation.js'
import { executeAiReview } from '../server/services/aiReviewService.js'

const RULE_ID = 'processing-purpose'

function createRule() {
  return attachVerifiedLegalAuthorities({
    id: RULE_ID,
    issueType: 'processing-purpose',
    title: '处理目的',
    description: '初步核查文本是否说明个人信息或汽车数据的处理目的。',
    keywords: { direct: ['处理目的'], contextual: ['账户管理'] },
    riskLevel: 'High',
  })
}

function createModelItem(rule, overrides = {}) {
  return {
    ruleId: rule.id,
    issueType: rule.issueType,
    title: rule.title,
    status: 'Found',
    evidenceFound: true,
    evidence: '我们将个人信息用于账户管理。',
    observation: '基于当前文本识别到相关表述，仍建议人工复核。',
    legalAuthorityIds: rule.legalAuthorities.map(
      (authority) => authority.provisionId,
    ),
    riskLevel: rule.riskLevel,
    confidence: 'High',
    issueSummary: '当前文本中识别到处理目的相关表述。',
    riskReason: '该事项可能需要结合完整材料进一步确认。',
    suggestedRevision: '建议根据事实核查结果决定是否完善文本。',
    suggestedNextStep: '建议人工核对完整文件和实际处理场景。',
    ...overrides,
  }
}

function assertGroundingError(callback, validationCode) {
  assert.throws(
    callback,
    (error) =>
      error instanceof AiReviewValidationError &&
      error.validationCode === validationCode,
  )
}

test('exact verbatim evidence passes', () => {
  const evidence = '我们将个人信息用于账户管理。'

  assert.equal(
    validateEvidenceGrounding({
      evidenceFound: true,
      evidence,
      documentText: `隐私说明\n${evidence}\n其他说明`,
      ruleId: RULE_ID,
    }),
    evidence,
  )
})

test('whitespace and line-break layout variation passes', () => {
  const evidence =
    '处理目的： 我们将个人信息用于账户管理， 并提供车辆状态展示。'

  assert.equal(
    validateEvidenceGrounding({
      evidenceFound: true,
      evidence,
      documentText:
        '处理目的：\r\n  我们将个人信息用于账户管理，\r\n并提供车辆状态展示。',
      ruleId: RULE_ID,
    }),
    evidence,
  )
})

test('paraphrased evidence fails exact grounding', () => {
  assertGroundingError(
    () =>
      validateEvidenceGrounding({
        evidenceFound: true,
        evidence: '个人信息将用于管理用户账户。',
        documentText: '我们将个人信息用于账户管理。',
        ruleId: RULE_ID,
      }),
    'EVIDENCE_NOT_IN_DOCUMENT',
  )
})

test('punctuation changes do not pass as formatting normalization', () => {
  assertGroundingError(
    () =>
      validateEvidenceGrounding({
        evidenceFound: true,
        evidence: '我们将个人信息用于账户管理,并提供车辆状态展示。',
        documentText: '我们将个人信息用于账户管理，并提供车辆状态展示。',
        ruleId: RULE_ID,
      }),
    'EVIDENCE_NOT_IN_DOCUMENT',
  )
})

test('evidence assembled from separate passages fails', () => {
  assertGroundingError(
    () =>
      validateEvidenceGrounding({
        evidenceFound: true,
        evidence: '我们收集个人信息。 我们用于账户管理。',
        documentText:
          '我们收集个人信息。\n本节同时说明信息安全措施。\n我们用于账户管理。',
        ruleId: RULE_ID,
      }),
    'EVIDENCE_NOT_IN_DOCUMENT',
  )
})

test('explicit no-evidence state is normalized safely', () => {
  const rule = createRule()
  const results = validateAndNormalizeAiReview({
    modelOutput: {
      reviewItems: [
        createModelItem(rule, {
          status: 'Potential Gap',
          evidenceFound: false,
          evidence: '',
          confidence: 'Medium',
        }),
      ],
    },
    documentText: '当前文本仅包含一般说明。',
    reviewRules: [rule],
  })

  assert.match(results[0].evidence, /未识别到/u)
  assert.equal(results[0].status, 'Potential Gap')
})

test('retry identifies and repairs a failed evidence item', async (t) => {
  t.mock.method(console, 'log', () => {})
  t.mock.method(console, 'warn', () => {})

  const rule = createRule()
  const documentText = '我们将个人信息用于账户管理。'
  const requests = []
  const responses = [
    {
      status: 'completed',
      output_parsed: {
        reviewItems: [
          createModelItem(rule, {
            evidence: '个人信息将用于管理用户账户。',
          }),
        ],
      },
      output_text: '',
      output: [],
    },
    {
      status: 'completed',
      output_parsed: {
        reviewItems: [createModelItem(rule, { evidence: documentText })],
      },
      output_text: '',
      output: [],
    },
  ]
  const openai = {
    responses: {
      parse: async (request) => {
        requests.push(request)
        return responses[requests.length - 1]
      },
    },
  }

  const results = await executeAiReview({
    openai,
    documentText,
    reviewRules: [rule],
    legalSource: { title: 'Test provenance' },
  })
  const retryInstruction = requests[1].input.find(
    (message) =>
      message.role === 'system' &&
      message.content.includes('prior attempt failed'),
  ).content

  assert.equal(requests.length, 2)
  assert.equal(results[0].evidence, documentText)
  assert.match(retryInstruction, /processing-purpose/u)
  assert.match(retryInstruction, /exact, contiguous, verbatim/u)
  assert.match(retryInstruction, /evidenceFound to false/u)
})
