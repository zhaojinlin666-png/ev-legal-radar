import { handleRegulatoryImpactAnalysisRequest } from '../../server/http/apiHandlers.js'
import { createNetlifyFunctionHandler } from './_shared/netlifyAdapter.js'

const NETLIFY_EXECUTION_TIMEOUT_MS = 50_000

export function createRegulatoryImpactAnalysisFunction(dependencies = {}) {
  return createNetlifyFunctionHandler({
    method: 'POST',
    apiHandler: (request) =>
      handleRegulatoryImpactAnalysisRequest(request, dependencies),
    executionTimeoutMs: NETLIFY_EXECUTION_TIMEOUT_MS,
    timeoutResponse: {
      status: 504,
      body: {
        error:
          'Preliminary impact analysis timed out before a structured response could be returned. Please try again.',
        code: 'REGULATORY_IMPACT_TIMEOUT',
      },
    },
  })
}

export default createRegulatoryImpactAnalysisFunction()

export const config = {
  method: 'POST',
}
