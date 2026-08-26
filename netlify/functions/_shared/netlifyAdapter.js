const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

async function readJsonBody(request) {
  const declaredLength = Number(request.headers.get('content-length'))

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_JSON_BODY_BYTES
  ) {
    return { errorResponse: jsonResponse(413, { error: 'Request body is too large.' }) }
  }

  const bodyText = await request.text()

  if (Buffer.byteLength(bodyText, 'utf8') > MAX_JSON_BODY_BYTES) {
    return { errorResponse: jsonResponse(413, { error: 'Request body is too large.' }) }
  }

  try {
    return { body: JSON.parse(bodyText) }
  } catch {
    return {
      errorResponse: jsonResponse(400, {
        error: 'Request body must be valid JSON.',
      }),
    }
  }
}

export function createNetlifyFunctionHandler({
  method,
  apiHandler,
  executionTimeoutMs,
  timeoutResponse,
}) {
  return async function netlifyFunctionHandler(request, context = {}) {
    if (request.method !== method) {
      return jsonResponse(
        405,
        { error: 'Method not allowed.' },
        { Allow: method },
      )
    }

    let timeoutId
    const hasExecutionDeadline =
      Number.isFinite(executionTimeoutMs) && executionTimeoutMs > 0
    const abortController = hasExecutionDeadline
      ? new AbortController()
      : null

    try {
      const requestInput = {}

      if (method !== 'GET') {
        const parsedBody = await readJsonBody(request)

        if (parsedBody.errorResponse) return parsedBody.errorResponse
        requestInput.body = parsedBody.body
      }

      if (abortController) requestInput.signal = abortController.signal

      const handlerPromise = Promise.resolve().then(() =>
        apiHandler(requestInput),
      )
      const result = hasExecutionDeadline
        ? await Promise.race([
            handlerPromise,
            new Promise((resolve) => {
              timeoutId = setTimeout(() => {
                abortController.abort()
                console.error('Netlify function execution deadline reached.', {
                  method,
                  executionTimeoutMs,
                  requestId: context?.requestId,
                })
                resolve(
                  timeoutResponse || {
                    status: 504,
                    body: {
                      error:
                        'The serverless request timed out before a structured response could be returned.',
                      code: 'FUNCTION_EXECUTION_TIMEOUT',
                    },
                  },
                )
              }, executionTimeoutMs)
            }),
          ])
        : await handlerPromise

      return jsonResponse(result.status, result.body, result.headers)
    } catch (error) {
      console.error('Unhandled Netlify function error.', {
        errorName: error?.name,
        requestId: context?.requestId,
      })
      return jsonResponse(500, { error: 'Internal server error.' })
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }
}
