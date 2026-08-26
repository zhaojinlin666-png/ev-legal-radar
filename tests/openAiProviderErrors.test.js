import assert from 'node:assert/strict'
import test from 'node:test'
import { handleRegulatoryImpactAnalysisRequest } from '../server/http/apiHandlers.js'
import { mapOpenAiProviderError } from '../server/services/aiReviewService.js'

const canonicalEvent = Object.freeze({
  title: 'Detected regulatory event',
  sourceUrl: 'https://www.cac.gov.cn/example.htm',
})

function createProviderError({
  name = 'APIError',
  status,
  type,
  code,
  message,
  requestID = 'req_safe_test',
}) {
  return {
    name,
    status,
    type,
    code,
    message,
    requestID,
    error: { type, code, message },
  }
}

async function requestImpactWithProviderError(providerError) {
  return handleRegulatoryImpactAnalysisRequest(
    { body: { event: { externalId: 'source-event-id' } } },
    {
      validateRequestImpl: () => canonicalEvent,
      hasOpenAiApiKeyImpl: () => true,
      fetchOfficialSourceImpl: async () => ({
        title: canonicalEvent.title,
        content: 'Official source content',
      }),
      getVerifiedAuthoritiesImpl: () => [],
      runImpactAnalysisImpl: async () => {
        throw mapOpenAiProviderError(providerError)
      },
    },
  )
}

test('missing API key has a distinct safe impact-analysis response', async () => {
  const response = await handleRegulatoryImpactAnalysisRequest(
    { body: { event: { externalId: 'source-event-id' } } },
    {
      validateRequestImpl: () => canonicalEvent,
      hasOpenAiApiKeyImpl: () => false,
    },
  )

  assert.equal(response.status, 503)
  assert.deepEqual(response.body, {
    error:
      'AI impact analysis service is not configured. Configure OPENAI_API_KEY in the server environment.',
    code: 'AI_SERVICE_NOT_CONFIGURED',
  })
})

test('provider errors map to distinct safe client categories', async () => {
  const scenarios = [
    {
      error: createProviderError({
        name: 'AuthenticationError',
        status: 401,
        type: 'invalid_request_error',
        code: 'invalid_api_key',
        message: 'Incorrect API key provided.',
      }),
      status: 502,
      clientCode: 'OPENAI_AUTHENTICATION_FAILED',
    },
    {
      error: createProviderError({
        name: 'RateLimitError',
        status: 429,
        type: 'insufficient_quota',
        code: 'credit_balance_exhausted',
        message: 'Credit balance exhausted.',
      }),
      status: 429,
      clientCode: 'OPENAI_INSUFFICIENT_QUOTA',
    },
    {
      error: createProviderError({
        name: 'RateLimitError',
        status: 429,
        type: 'rate_limit_error',
        code: 'rate_limit_exceeded',
        message: 'Rate limit reached.',
      }),
      status: 429,
      clientCode: 'OPENAI_RATE_LIMITED',
    },
    {
      error: createProviderError({
        name: 'NotFoundError',
        status: 404,
        type: 'invalid_request_error',
        code: 'model_not_found',
        message: 'The requested model does not exist.',
      }),
      status: 502,
      clientCode: 'OPENAI_MODEL_UNAVAILABLE',
    },
    {
      error: createProviderError({
        name: 'APIConnectionError',
        message: 'Connection error.',
        requestID: undefined,
      }),
      status: 502,
      clientCode: 'OPENAI_NETWORK_ERROR',
    },
    {
      error: createProviderError({
        name: 'APIUserAbortError',
        message: 'Request was aborted.',
        requestID: undefined,
      }),
      status: 504,
      clientCode: 'OPENAI_REQUEST_TIMEOUT',
    },
    {
      error: createProviderError({
        name: 'InternalServerError',
        status: 503,
        type: 'server_error',
        code: 'server_error',
        message: 'The provider is temporarily unavailable.',
      }),
      status: 503,
      clientCode: 'OPENAI_PROVIDER_UNAVAILABLE',
    },
  ]
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    for (const scenario of scenarios) {
      const response = await requestImpactWithProviderError(scenario.error)

      assert.equal(response.status, scenario.status)
      assert.equal(response.body.code, scenario.clientCode)
      assert.equal(typeof response.body.error, 'string')
      assert.equal('providerMessage' in response.body, false)
    }
  } finally {
    console.error = originalConsoleError
  }
})

test('Netlify-safe diagnostics retain provider fields and redact credentials', async () => {
  const exposedCredential = [
    'sk',
    'test',
    'secret',
    'value',
    '1234567890',
  ].join('-')
  const providerError = createProviderError({
    name: 'AuthenticationError',
    status: 401,
    type: 'invalid_request_error',
    code: 'invalid_api_key',
    message: `Incorrect API key provided: ${exposedCredential}`,
    requestID: 'req_provider_diagnostic',
  })
  const capturedLogs = []
  const originalConsoleError = console.error
  console.error = (...entries) => capturedLogs.push(entries)

  let response
  try {
    response = await requestImpactWithProviderError(providerError)
  } finally {
    console.error = originalConsoleError
  }

  assert.equal(response.body.code, 'OPENAI_AUTHENTICATION_FAILED')
  assert.equal(capturedLogs.length, 1)

  const [logMessage, details] = capturedLogs[0]
  const serializedLog = JSON.stringify(capturedLogs[0])

  assert.equal(logMessage, 'Regulatory impact analysis request failed.')
  assert.equal(details.providerStatus, 401)
  assert.equal(details.providerType, 'invalid_request_error')
  assert.equal(details.providerCode, 'invalid_api_key')
  assert.equal(details.requestId, 'req_provider_diagnostic')
  assert.match(details.providerMessage, /\[REDACTED_API_KEY\]/u)
  assert.doesNotMatch(serializedLog, new RegExp(exposedCredential, 'u'))
  assert.doesNotMatch(
    JSON.stringify(response.body),
    new RegExp(['sk', 'test', 'secret'].join('-'), 'u'),
  )
})
