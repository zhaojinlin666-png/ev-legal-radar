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
      whatChanged: '官方来源材料说明相关文件正在公开征求意见。',
      newRequirement: '当前材料涉及个人信息处理规则。',
      whyItMatters: '可能需要进一步识别受影响的数据处理活动。',
      evidenceIds: ['source-1'],
    },
    preliminaryImpact: {
      impactLevel: 'Medium',
      reasoning: '基于当前来源，建议对相关数据处理活动进行初步梳理。',
      confidence: 'Medium',
      evidenceIds: ['source-1'],
    },
    affectedActivities: [
      {
        activity: '个人信息处理活动',
        reason: '来源材料涉及个人信息处理规则，具体影响仍需人工判断。',
        evidenceIds: ['source-1'],
      },
    ],
    suggestedDocuments: [
      {
        documentName: '个人信息处理说明材料',
        reason: '可用于核对当前处理活动与来源材料的关系。',
        evidenceIds: ['source-1'],
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
      },
    ],
    legalAuthorityIds: [],
    ...overrides,
  }
}

function createNormalizedResult(overrides = {}) {
  return validateAndNormalizeRegulatoryImpact({
    modelOutput: createModelOutput(overrides),
    officialSourceMaterial: `${officialSource.title}\n${officialSource.content}`,
    allowedAuthorities: [],
  })
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
    () => createNormalizedResult({ legalAuthorityIds: ['invented-article'] }),
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
                  legalAuthorityIds: ['invented-article'],
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
    'preliminaryImpact',
    'affectedActivities',
    'suggestedDocuments',
    'reviewTasks',
    'legalAuthorityIds',
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
  const repairedOutput = {
    ...withWhyItMatters(
      prohibitedOutput,
      '该事项可能需要进一步审查，建议法律人员核实相关事实。',
    ),
    legalAuthorityIds: ['invented-article'],
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
