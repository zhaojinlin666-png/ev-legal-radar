import { handleRegulatoryImpactAnalysisRequest } from '../../server/http/apiHandlers.js'
import { createNetlifyFunctionHandler } from './_shared/netlifyAdapter.js'

export function createRegulatoryImpactAnalysisFunction(dependencies = {}) {
  return createNetlifyFunctionHandler({
    method: 'POST',
    apiHandler: (request) =>
      handleRegulatoryImpactAnalysisRequest(request, dependencies),
  })
}

export default createRegulatoryImpactAnalysisFunction()

export const config = {
  method: 'POST',
}
