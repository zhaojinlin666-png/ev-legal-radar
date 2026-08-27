import assert from 'node:assert/strict'
import test from 'node:test'
import {
  executeRegulatoryImpactAnalysis,
  extractStructuredImpactOutput,
} from '../server/services/regulatoryImpactAnalysisService.js'
import {
  RegulatoryImpactValidationError,
  createRegulatoryImpactApiResponse,
  validateAndNormalizeRegulatoryImpact,
  validateRegulatoryImpactRequest,
} from '../server/services/regulatoryImpactAnalysisValidation.js'
import { getVerifiedProvisionsForOfficialSource } from '../src/data/legalKnowledgeBase.js'
import { createExternalId } from '../server/services/regulatoryMonitoringService.js'
import {
  applyPreliminaryImpactAnalysis,
  canRequestPreliminaryImpactAnalysis,
  markRegulatoryEventAnalyzing,
  markRegulatoryEventAnalysisFailed,
} from '../src/utils/regulatoryImpactWorkflow.js'
import { createReviewEventFromDetectedItem } from '../src/utils/regulatoryMonitoring.js'
import { createDocumentReviewContext } from '../src/utils/reviewWorkflow.js'
import { parseRegulatoryImpactApiPayload } from '../src/services/regulatoryImpactAnalysisService.js'

const detectedSourceUrl =
  'https://www.cac.gov.cn/2026-08/07/c_example_personal_information.htm'

const detectedItem = Object.freeze({
  externalId: createExternalId({ sourceUrl: detectedSourceUrl }),
  title: '国家互联网信息办公室关于个人信息保护相关规定公开征求意见的通知',
  sourceUrl: detectedSourceUrl,
  publicationDate: '2026-08-07',
  regulator: '中华人民共和国国家互联网信息办公室',
  matchedKeywords: ['个人信息'],
  detectionStatus: 'Source detected',
})

const officialSource = Object.freeze({
  title: detectedItem.title,
  sourceUrl: detectedItem.sourceUrl,
  content: '本通知公开征求意见。相关材料涉及个人信息处理规则。',
  truncated: false,
})

function createModelOutput(overrides = {}) {
  return {
    sourceEvidence: [
      {
        evidenceId: 'source-1',
        quotation: '相关材料涉及个人信息处理规则。',
      },
    ],
    changeSummary: {
      comparisonMode: 'new_source_summary',
      previousRequirement: null,
      newRequirement: '当前材料涉及个人信息处理规则。',
      preliminaryInterpretation:
        '现有来源初步表明该事项可能需要进一步法律研究。',
      whyItMatters: '可能需要进一步识别受影响的数据处理活动。',
      evidenceIds: ['source-1'],
      legalAuthorityIds: [],
    },
    impactAssessment: {
      level: 'Medium',
      rationale: '基于当前来源，建议对相关数据处理活动进行初步梳理。',
      confidence: 'Medium',
      evidenceIds: ['source-1'],
      legalAuthorityIds: [],
      humanReviewRequired: true,
      factors: [
        {
          factor: '来源范围',
          assessment: '官方来源提及个人信息处理规则。',
          evidenceType: 'FACT',
          evidenceIds: ['source-1'],
          legalAuthorityIds: [],
        },
        {
          factor: '潜在活动范围',
          assessment: '该事项可能与多类个人信息处理活动相关。',
          evidenceType: 'INFERENCE',
          evidenceIds: ['source-1'],
          legalAuthorityIds: [],
        },
        {
          factor: '人工核查需求',
          assessment: '具体影响可能需要法律人员结合业务事实进一步核查。',
          evidenceType: 'INFERENCE',
          evidenceIds: ['source-1'],
          legalAuthorityIds: [],
        },
      ],
    },
    affectedActivities: [
      {
        activity: '个人信息处理活动',
        reason: '来源材料涉及个人信息处理规则，具体影响仍需人工判断。',
        evidenceIds: ['source-1'],
        legalAuthorityIds: [],
      },
    ],
    suggestedDocuments: [
      {
        documentName: '个人信息处理说明材料',
        reason: '可用于核对当前处理活动与来源材料的关系。',
        evidenceIds: ['source-1'],
        legalAuthorityIds: [],
      },
    ],
    reviewTasks: [
      {
        title: '梳理相关个人信息处理活动',
        objective: '识别需要由法律人员进一步核查的事实与材料。',
        legalTopic: '个人信息处理',
        suggestedDocument: '个人信息处理说明材料',
        priority: 'Medium',
        evidenceIds: ['source-1'],
        legalAuthorityIds: [],
      },
    ],
    ...overrides,
  }
}

function createNormalizedResult(overrides = {}) {
  return normalizeModelOutput(createModelOutput(overrides))
}

function normalizeModelOutput(modelOutput) {
  return validateAndNormalizeRegulatoryImpact({
    modelOutput,
    officialSourceMaterial: `${officialSource.title}\n${officialSource.content}`,
    allowedAuthorities: [],
  })
}

function addUngroundedEvidence(modelOutput, evidenceItems) {
  const output = structuredClone(modelOutput)
  output.sourceEvidence.push(...evidenceItems)
  output.changeSummary.evidenceIds.push(
    ...evidenceItems.map((item) => item.evidenceId),
  )
  output.impactAssessment.evidenceIds.push(
    ...evidenceItems.map((item) => item.evidenceId),
  )
  return output
}

function withWhyItMatters(modelOutput, whyItMatters) {
  return {
    ...modelOutput,
    changeSummary: {
      ...modelOutput.changeSummary,
      whyItMatters,
    },
  }
}

test('a source-detected unreviewed event can explicitly request analysis', () => {
  const event = createReviewEventFromDetectedItem(detectedItem)

  assert.equal(canRequestPreliminaryImpactAnalysis(event), true)
  assert.equal(markRegulatoryEventAnalyzing(event).analysisStatus, 'Analyzing')
  assert.equal(event.analysisStatus, 'Unreviewed')
  assert.equal(
    validateRegulatoryImpactRequest({
      externalId: event.sourceExternalId,
      title: event.title,
      regulator: event.regulator,
      publicationDate: event.publicationDate,
      sourceUrl: event.sourceUrl,
      matchedKeywords: event.matchedKeywords,
      jurisdiction: event.jurisdiction,
      detectionStatus: event.detectionStatus,
      verificationStatus: event.verificationStatus,
      changeType: event.changeType,
    }).externalId,
    event.sourceExternalId,
  )
})

test('structured impact output is validated and missing authority is explicit', () => {
  const result = createNormalizedResult()

  assert.equal(result.legalAuthorityStatus, 'LEGAL_SOURCE_NOT_VERIFIED')
  assert.deepEqual(result.legalAuthorities, [])
  assert.equal(result.requiresHumanReview, true)
  assert.equal(
    result.analysisMethod,
    'AI-assisted preliminary impact analysis',
  )
  assert.equal(result.impactAssessment.factors.length, 3)
  assert.equal(result.impactAssessment.humanReviewRequired, true)
  assert.deepEqual(result.evidenceGrounding, {
    status: 'verified',
    verifiedEvidenceCount: 1,
    rejectedEvidenceCount: 0,
    affectedPaths: [],
  })
  assert.equal(result.sourceEvidence[0].verificationStatus, 'verified')
})

test('valid grounded quotations remain available as verified evidence', () => {
  const result = createNormalizedResult()

  assert.deepEqual(result.sourceEvidence, [
    {
      evidenceId: 'source-1',
      quotation: '相关材料涉及个人信息处理规则。',
      verificationStatus: 'verified',
    },
  ])
  assert.equal(result.evidenceGrounding.status, 'verified')
})

test('one ungrounded quotation is excluded without discarding otherwise grounded analysis', () => {
  const fabricatedQuotation = '这段文字并不存在于抓取到的官方来源中。'
  const modelOutput = addUngroundedEvidence(createModelOutput(), [
    { evidenceId: 'source-invalid-1', quotation: fabricatedQuotation },
  ])
  modelOutput.suggestedDocuments[0].evidenceIds = ['source-invalid-1']
  modelOutput.impactAssessment.factors[0].evidenceIds.push('source-invalid-1')
  const capturedWarnings = []
  const originalConsoleWarn = console.warn
  console.warn = (...entries) => capturedWarnings.push(entries)

  try {
    const result = normalizeModelOutput(modelOutput)

    assert.equal(result.evidenceGrounding.status, 'partially_verified')
    assert.equal(result.evidenceGrounding.verifiedEvidenceCount, 1)
    assert.equal(result.evidenceGrounding.rejectedEvidenceCount, 1)
    assert.equal(result.sourceEvidence.length, 1)
    assert.equal(result.sourceEvidence[0].quotation, '相关材料涉及个人信息处理规则。')
    assert.equal(result.suggestedDocuments.length, 0)
    assert.equal(result.impactAssessment.factors[0].evidenceType, 'INFERENCE')
    assert.equal(
      result.changeSummary.evidenceIds.includes('source-invalid-1'),
      false,
    )
  } finally {
    console.warn = originalConsoleWarn
  }

  assert.equal(capturedWarnings.length, 1)
  assert.equal(capturedWarnings[0][1].validationCode, 'SOURCE_EVIDENCE_NOT_GROUNDED')
  assert.doesNotMatch(JSON.stringify(capturedWarnings), new RegExp(fabricatedQuotation, 'u'))
})

test('multiple ungrounded quotations and their exclusive findings are removed', () => {
  const modelOutput = addUngroundedEvidence(createModelOutput(), [
    { evidenceId: 'source-invalid-1', quotation: '不存在的引文一。' },
    { evidenceId: 'source-invalid-2', quotation: '不存在的引文二。' },
  ])
  modelOutput.affectedActivities[0].evidenceIds = ['source-invalid-1']
  modelOutput.reviewTasks[0].evidenceIds = ['source-invalid-2']

  const originalConsoleWarn = console.warn
  console.warn = () => {}
  try {
    const result = normalizeModelOutput(modelOutput)

    assert.equal(result.evidenceGrounding.status, 'partially_verified')
    assert.equal(result.evidenceGrounding.rejectedEvidenceCount, 2)
    assert.equal(result.affectedActivities.length, 0)
    assert.equal(result.reviewTasks.length, 0)
    assert.deepEqual(
      result.sourceEvidence.map((item) => item.evidenceId),
      ['source-1'],
    )
  } finally {
    console.warn = originalConsoleWarn
  }
})

test('all ungrounded quotations produce a safe unavailable-evidence result', () => {
  const fabricatedQuotation = '完全未出现在官方来源中的模型引文。'
  const modelOutput = createModelOutput({
    sourceEvidence: [
      { evidenceId: 'source-1', quotation: fabricatedQuotation },
    ],
  })
  const originalConsoleWarn = console.warn
  console.warn = () => {}

  try {
    const result = normalizeModelOutput(modelOutput)

    assert.equal(result.evidenceGrounding.status, 'unavailable')
    assert.equal(result.evidenceGrounding.verifiedEvidenceCount, 0)
    assert.equal(result.evidenceGrounding.rejectedEvidenceCount, 1)
    assert.deepEqual(result.sourceEvidence, [])
    assert.equal(result.impactAssessment.level, 'Further Review Required')
    assert.equal(result.impactAssessment.confidence, 'Low')
    assert.deepEqual(result.impactAssessment.factors, [])
    assert.deepEqual(result.affectedActivities, [])
    assert.deepEqual(result.suggestedDocuments, [])
    assert.deepEqual(result.reviewTasks, [])
    assert.deepEqual(result.legalAuthorities, [])
    assert.doesNotMatch(JSON.stringify(result), new RegExp(fabricatedQuotation, 'u'))
  } finally {
    console.warn = originalConsoleWarn
  }
})

test('ungrounded evidence is handled without a second OpenAI request', async () => {
  let attempt = 0
  const modelOutput = addUngroundedEvidence(createModelOutput(), [
    { evidenceId: 'source-invalid-1', quotation: '模型重构的非原文引文。' },
  ])
  const openai = {
    responses: {
      parse: async () => {
        attempt += 1
        return { status: 'completed', output_parsed: modelOutput }
      },
    },
  }
  const originalConsoleWarn = console.warn
  console.warn = () => {}

  try {
    const result = await executeRegulatoryImpactAnalysis({
      openai,
      event: createReviewEventFromDetectedItem(detectedItem),
      officialSource,
      allowedAuthorities: [],
    })

    assert.equal(attempt, 1)
    assert.equal(result.evidenceGrounding.status, 'partially_verified')
  } finally {
    console.warn = originalConsoleWarn
  }
})

test('no fabricated quotation can reach the production client contract', () => {
  const fabricatedQuotation = '前端绝不能收到这段未核验引文。'
  const modelOutput = addUngroundedEvidence(createModelOutput(), [
    { evidenceId: 'source-invalid-1', quotation: fabricatedQuotation },
  ])
  const originalConsoleWarn = console.warn
  console.warn = () => {}

  try {
    const normalizedResult = normalizeModelOutput(modelOutput)
    const apiResponse = createRegulatoryImpactApiResponse(normalizedResult)
    const clientResult = parseRegulatoryImpactApiPayload(apiResponse)

    assert.doesNotMatch(
      JSON.stringify(clientResult),
      new RegExp(fabricatedQuotation, 'u'),
    )
    assert.equal(
      clientResult.sourceEvidence.every(
        (item) => item.verificationStatus === 'verified',
      ),
      true,
    )
  } finally {
    console.warn = originalConsoleWarn
  }
})

test('verified legal basis is resolved server-side with official provenance', () => {
  const authorities = getVerifiedProvisionsForOfficialSource({
    title: '汽车数据安全管理若干规定（试行）',
    sourceUrl:
      'https://www.cac.gov.cn/2021-08/20/c_1631049984897667.htm',
  })
  const authority = authorities.find((item) => item.article === 'Article 7')
  const modelOutput = createModelOutput({
    changeSummary: {
      ...createModelOutput().changeSummary,
      legalAuthorityIds: [authority.provisionId],
    },
  })
  const result = validateAndNormalizeRegulatoryImpact({
    modelOutput,
    officialSourceMaterial: `${officialSource.title}\n${officialSource.content}`,
    allowedAuthorities: [authority],
  })

  assert.deepEqual(result.changeSummary.legalBasis, [
    {
      sourceTitle: authority.lawName,
      provision: authority.article,
      excerpt: authority.requirementSummary,
      excerptType: 'verified requirement summary',
      sourceUrl: authority.sourceUrl,
      sourceAuthority: authority.sourceAuthority,
      verificationStatus: 'verified',
    },
  ])
  assert.equal(result.changeSummary.legalBasis[0].sourceUrl, authority.sourceUrl)
})

test('fabricated article cannot enter the API legal-basis response', () => {
  const result = createNormalizedResult()
  const fabricatedResult = {
    ...result,
    changeSummary: {
      ...result.changeSummary,
      legalBasis: [
        {
          sourceTitle: 'Invented regulation',
          provision: 'Article 999',
          excerpt: 'Invented text',
          excerptType: 'verified requirement summary',
          sourceUrl: 'https://example.com/invented',
          sourceAuthority: 'Invented authority',
          verificationStatus: 'verified',
        },
      ],
    },
  }

  assert.throws(
    () => createRegulatoryImpactApiResponse(fabricatedResult),
    (error) => error.validationCode === 'LEGAL_BASIS_PROVENANCE_INVALID',
  )
})

test('a verified comparison requires an explicitly verified previous version', () => {
  const comparisonOutput = createModelOutput({
    changeSummary: {
      ...createModelOutput().changeSummary,
      comparisonMode: 'verified_change_comparison',
      previousRequirement: '已核验旧版本中的要求。',
    },
  })

  assert.throws(
    () =>
      validateAndNormalizeRegulatoryImpact({
        modelOutput: comparisonOutput,
        officialSourceMaterial: `${officialSource.title}\n${officialSource.content}`,
        allowedAuthorities: [],
      }),
    (error) =>
      error.validationCode === 'UNVERIFIED_PREVIOUS_VERSION_COMPARISON',
  )

  const result = validateAndNormalizeRegulatoryImpact({
    modelOutput: comparisonOutput,
    officialSourceMaterial: `${officialSource.title}\n${officialSource.content}`,
    allowedAuthorities: [],
    hasVerifiedPreviousVersion: true,
  })
  assert.equal(
    result.changeSummary.comparisonMode,
    'verified_change_comparison',
  )
})

test('impact rationale is mandatory in the strict model schema', () => {
  const modelOutput = createModelOutput()
  const { rationale: _rationale, ...impactWithoutRationale } =
    modelOutput.impactAssessment

  assert.throws(
    () =>
      createNormalizedResult({
        impactAssessment: impactWithoutRationale,
      }),
    (error) => error.validationCode === 'MODEL_SCHEMA_MISMATCH',
  )
})

test('server response remains compatible with the production client schema', () => {
  const normalizedResult = createNormalizedResult()
  const apiResponse = createRegulatoryImpactApiResponse(normalizedResult)

  assert.deepEqual(
    parseRegulatoryImpactApiPayload(apiResponse),
    normalizedResult,
  )
  assert.throws(
    () =>
      parseRegulatoryImpactApiPayload({
        schemaVersion: apiResponse.schemaVersion,
        result: { reviewTasks: [] },
      }),
    /invalid response/u,
  )
})

test('definitive company non-compliance conclusion is rejected with a semantic path', () => {
  assert.throws(
    () =>
      createNormalizedResult({
        changeSummary: {
          ...createModelOutput().changeSummary,
          whyItMatters: '该公司违反法律并且不合规。',
        },
      }),
    (error) => {
      assert.equal(error.validationCode, 'PROHIBITED_CONCLUSION')
      assert.deepEqual(error.validationIssues, [
        { path: 'changeSummary.whyItMatters', code: 'custom' },
      ])
      return true
    },
  )
})

test('cautious preliminary impact wording passes unchanged validation', () => {
  const result = createNormalizedResult({
    changeSummary: {
      ...createModelOutput().changeSummary,
      whyItMatters:
        '现有来源初步表明该事项可能与个人信息处理活动相关，建议法律人员进一步核实是否受到影响。',
    },
  })

  assert.match(result.changeSummary.whyItMatters, /可能与/u)
  assert.equal(result.requiresHumanReview, true)
})

test('every impact claim must reference grounded official-source evidence', () => {
  assert.throws(
    () =>
      createNormalizedResult({
        affectedActivities: [
          {
            activity: '个人信息处理活动',
            reason: '建议进一步核查。',
            evidenceIds: ['unknown-source'],
            legalAuthorityIds: [],
          },
        ],
      }),
    (error) => {
      assert.equal(
        error.validationCode,
        'SOURCE_EVIDENCE_REFERENCE_INVALID',
      )
      return true
    },
  )
})

test('unsupported or fabricated legal authority is rejected', () => {
  assert.throws(
    () =>
      createNormalizedResult({
        changeSummary: {
          ...createModelOutput().changeSummary,
          legalAuthorityIds: ['invented-article'],
        },
      }),
    (error) => {
      assert.equal(error.validationCode, 'UNSUPPORTED_LEGAL_AUTHORITY')
      return true
    },
  )
})

test('verified authorities are available only for an exact source and title match', () => {
  const title = '汽车数据安全管理若干规定（试行）'
  const sourceUrl =
    'https://www.cac.gov.cn/2021-08/20/c_1631049984897667.htm'
  const authorities = getVerifiedProvisionsForOfficialSource({
    title,
    sourceUrl,
  })

  assert.ok(authorities.length > 1)
  assert.deepEqual(
    getVerifiedProvisionsForOfficialSource({
      title: `${title}（错误标题）`,
      sourceUrl,
    }),
    [],
  )
  assert.deepEqual(
    getVerifiedProvisionsForOfficialSource({
      title,
      sourceUrl: 'https://www.cac.gov.cn/2026-01/01/unrelated.htm',
    }),
    [],
  )
})

test('review tasks are created only after successful analysis and retain provenance', () => {
  const event = createReviewEventFromDetectedItem(detectedItem)
  const analyzedEvent = applyPreliminaryImpactAnalysis(
    event,
    createNormalizedResult(),
  )

  assert.deepEqual(event.generatedReviewTasks, [])
  assert.equal(analyzedEvent.generatedReviewTasks.length, 1)
  assert.equal(analyzedEvent.analysisStatus, 'Analysis completed')
  assert.equal(
    analyzedEvent.generatedReviewTasks[0].regulatoryChangeEventId,
    event.id,
  )
  assert.deepEqual(
    analyzedEvent.generatedReviewTasks[0].provenance.sourceEvidenceIds,
    ['source-1'],
  )
  assert.equal(
    analyzedEvent.generatedReviewTasks[0].provenance.officialSourceUrl,
    event.sourceUrl,
  )

  const documentReviewContext = createDocumentReviewContext(
    analyzedEvent,
    analyzedEvent.generatedReviewTasks[0],
  )
  assert.equal(documentReviewContext.originEventId, event.id)
  assert.equal(documentReviewContext.originTaskId, analyzedEvent.generatedReviewTasks[0].id)
  assert.equal(documentReviewContext.contextKind, 'workflow-metadata-only')
  assert.equal('legalAuthorities' in documentReviewContext, false)
  assert.equal('sourceEvidence' in documentReviewContext, false)
})

test('failed analysis leaves the original event unreviewed and creates no tasks', () => {
  const event = createReviewEventFromDetectedItem(detectedItem)
  const failedEvent = markRegulatoryEventAnalysisFailed(
    event,
    'Safe public failure message.',
  )

  assert.equal(event.analysisStatus, 'Unreviewed')
  assert.equal(event.analysisError, null)
  assert.deepEqual(event.generatedReviewTasks, [])
  assert.equal(failedEvent.analysisStatus, 'Analysis failed')
  assert.equal(failedEvent.preliminaryImpactLevel, null)
  assert.deepEqual(failedEvent.generatedReviewTasks, [])
  assert.equal(canRequestPreliminaryImpactAnalysis(failedEvent), true)
})

test('structured analysis retries once after unsupported authority output', async () => {
  let attempt = 0
  const openai = {
    responses: {
      parse: async () => {
        attempt += 1
        return {
          status: 'completed',
          output_parsed:
            attempt === 1
              ? createModelOutput({
                  changeSummary: {
                    ...createModelOutput().changeSummary,
                    legalAuthorityIds: ['invented-article'],
                  },
                })
              : createModelOutput(),
        }
      },
    },
  }

  const result = await executeRegulatoryImpactAnalysis({
    openai,
    event: createReviewEventFromDetectedItem(detectedItem),
    officialSource,
    allowedAuthorities: [],
  })

  assert.equal(attempt, 2)
  assert.equal(result.legalAuthorityStatus, 'LEGAL_SOURCE_NOT_VERIFIED')
})

test('impact request uses strict JSON Schema structured output', async () => {
  let structuredRequest
  let requestOptions
  const abortController = new AbortController()
  const openai = {
    responses: {
      parse: async (request, options) => {
        structuredRequest = request
        requestOptions = options
        return {
          status: 'completed',
          output_parsed: createModelOutput(),
        }
      },
    },
  }

  const result = await executeRegulatoryImpactAnalysis({
    openai,
    event: createReviewEventFromDetectedItem(detectedItem),
    officialSource,
    allowedAuthorities: [],
    signal: abortController.signal,
  })

  assert.equal(structuredRequest.text.format.type, 'json_schema')
  assert.equal(structuredRequest.text.format.strict, true)
  assert.equal(
    structuredRequest.text.format.schema.additionalProperties,
    false,
  )
  assert.deepEqual(structuredRequest.text.format.schema.required, [
    'sourceEvidence',
    'changeSummary',
    'impactAssessment',
    'affectedActivities',
    'suggestedDocuments',
    'reviewTasks',
  ])
  assert.equal(requestOptions.signal, abortController.signal)
  assert.equal(requestOptions.maxRetries, 0)
  assert.equal(result.requiresHumanReview, true)
})

test('valid structured output_text is parsed when output_parsed is unavailable', async () => {
  const output = createModelOutput()
  const parsed = extractStructuredImpactOutput({
    status: 'completed',
    output_parsed: null,
    output_text: JSON.stringify(output),
    output: [],
  })

  assert.deepEqual(parsed, output)
})

test('malformed structured output_text is rejected without fallback analysis', () => {
  assert.throws(
    () =>
      extractStructuredImpactOutput({
        status: 'completed',
        output_parsed: null,
        output_text: '{"sourceEvidence":',
        output: [],
      }),
    (error) => {
      assert.equal(error.validationCode, 'STRUCTURED_OUTPUT_PARSE_FAILED')
      assert.deepEqual(error.validationIssues, [
        { path: 'response.output_text', code: 'invalid_json' },
      ])
      return true
    },
  )
})

test('SDK structured parser failures become safe validation errors', async () => {
  const openai = {
    responses: {
      parse: async () => {
        throw new SyntaxError('Unexpected token in provider output')
      },
    },
  }

  await assert.rejects(
    executeRegulatoryImpactAnalysis({
      openai,
      event: createReviewEventFromDetectedItem(detectedItem),
      officialSource,
      allowedAuthorities: [],
    }),
    (error) => {
      assert.equal(error.validationCode, 'STRUCTURED_OUTPUT_PARSE_FAILED')
      assert.equal(error.publicMessage.includes('invalid response'), true)
      return true
    },
  )
})

test('a first prohibited conclusion is repaired exactly once', async () => {
  let attempt = 0
  let repairRequest
  const prohibitedOutput = withWhyItMatters(
    createModelOutput(),
    '该公司违反法律并且不合规。',
  )
  const repairedOutput = withWhyItMatters(
    prohibitedOutput,
    '现有来源初步表明该事项可能需要进一步审查，建议法律人员核实是否受到影响。',
  )
  const openai = {
    responses: {
      parse: async (request) => {
        attempt += 1
        if (attempt === 2) repairRequest = request

        return {
          status: 'completed',
          output_parsed: attempt === 1 ? prohibitedOutput : repairedOutput,
        }
      },
    },
  }

  const result = await executeRegulatoryImpactAnalysis({
    openai,
    event: createReviewEventFromDetectedItem(detectedItem),
    officialSource,
    allowedAuthorities: [],
  })
  const repairPrompt = repairRequest.input
    .map((message) => message.content)
    .join('\n')

  assert.equal(attempt, 2)
  assert.match(result.changeSummary.whyItMatters, /进一步审查/u)
  assert.match(repairPrompt, /changeSummary\.whyItMatters/u)
  assert.match(repairPrompt, /Preserve sourceEvidence quotations/u)
})

test('a failed prohibited-conclusion repair is still rejected', async () => {
  let attempt = 0
  const prohibitedOutput = withWhyItMatters(
    createModelOutput(),
    '该公司违反法律并且不合规。',
  )
  const openai = {
    responses: {
      parse: async () => {
        attempt += 1
        return { status: 'completed', output_parsed: prohibitedOutput }
      },
    },
  }

  await assert.rejects(
    executeRegulatoryImpactAnalysis({
      openai,
      event: createReviewEventFromDetectedItem(detectedItem),
      officialSource,
      allowedAuthorities: [],
    }),
    (error) => {
      assert.equal(error.validationCode, 'PROHIBITED_CONCLUSION')
      return true
    },
  )
  assert.equal(attempt, 2)
})

test('prohibited-conclusion repair cannot add an unapproved legal citation', async () => {
  let attempt = 0
  const prohibitedOutput = withWhyItMatters(
    createModelOutput(),
    '该公司违反法律并且不合规。',
  )
  const cautiousOutput = withWhyItMatters(
    prohibitedOutput,
    '该事项可能需要进一步审查，建议法律人员核实相关事实。',
  )
  const repairedOutput = {
    ...cautiousOutput,
    changeSummary: {
      ...cautiousOutput.changeSummary,
      legalAuthorityIds: ['invented-article'],
    },
  }
  const openai = {
    responses: {
      parse: async () => {
        attempt += 1
        return {
          status: 'completed',
          output_parsed: attempt === 1 ? prohibitedOutput : repairedOutput,
        }
      },
    },
  }

  await assert.rejects(
    executeRegulatoryImpactAnalysis({
      openai,
      event: createReviewEventFromDetectedItem(detectedItem),
      officialSource,
      allowedAuthorities: [],
    }),
    (error) => {
      assert.equal(error.validationCode, 'UNSUPPORTED_LEGAL_AUTHORITY')
      return true
    },
  )
  assert.equal(attempt, 2)
})

test('model schema failures are not converted into fake analysis', async () => {
  const openai = {
    responses: {
      parse: async () => ({
        status: 'completed',
        output_parsed: { reviewTasks: [] },
      }),
    },
  }

  await assert.rejects(
    executeRegulatoryImpactAnalysis({
      openai,
      event: createReviewEventFromDetectedItem(detectedItem),
      officialSource,
      allowedAuthorities: [],
    }),
    (error) => error instanceof RegulatoryImpactValidationError,
  )
})
