import { handleAiReviewRequest } from '../../server/http/apiHandlers.js'
import { createNetlifyFunctionHandler } from './_shared/netlifyAdapter.js'

export function createAiReviewFunction(dependencies = {}) {
  return createNetlifyFunctionHandler({
    method: 'POST',
    apiHandler: (request) =>
      handleAiReviewRequest(request, dependencies),
  })
}

export default createAiReviewFunction()

export const config = {
  method: 'POST',
}
