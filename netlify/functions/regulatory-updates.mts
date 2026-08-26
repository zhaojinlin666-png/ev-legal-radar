import { handleRegulatoryUpdatesRequest } from '../../server/http/apiHandlers.js'
import { createNetlifyFunctionHandler } from './_shared/netlifyAdapter.js'

export function createRegulatoryUpdatesFunction(dependencies = {}) {
  return createNetlifyFunctionHandler({
    method: 'GET',
    apiHandler: (request) =>
      handleRegulatoryUpdatesRequest(request, dependencies),
  })
}

export default createRegulatoryUpdatesFunction()

export const config = {
  method: 'GET',
}
