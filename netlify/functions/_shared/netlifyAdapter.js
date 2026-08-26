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

export function createNetlifyFunctionHandler({ method, apiHandler }) {
  return async function netlifyFunctionHandler(request) {
    if (request.method !== method) {
      return jsonResponse(
        405,
        { error: 'Method not allowed.' },
        { Allow: method },
      )
    }

    try {
      const requestInput = {}

      if (method !== 'GET') {
        const parsedBody = await readJsonBody(request)

        if (parsedBody.errorResponse) return parsedBody.errorResponse
        requestInput.body = parsedBody.body
      }

      const result = await apiHandler(requestInput)
      return jsonResponse(result.status, result.body, result.headers)
    } catch (error) {
      console.error('Unhandled Netlify function error.', {
        errorName: error?.name,
      })
      return jsonResponse(500, { error: 'Internal server error.' })
    }
  }
}
