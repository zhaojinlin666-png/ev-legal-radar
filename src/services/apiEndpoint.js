const API_ENDPOINTS = Object.freeze({
  'ai-review': {
    development: '/api/ai-review',
    production: '/.netlify/functions/ai-review',
  },
  'regulatory-updates': {
    development: '/api/regulatory-updates',
    production: '/.netlify/functions/regulatory-updates',
  },
  'regulatory-impact-analysis': {
    development: '/api/regulatory-impact-analysis',
    production: '/.netlify/functions/regulatory-impact-analysis',
  },
})

export function getApiEndpoint(
  endpointName,
  { isDevelopment = Boolean(import.meta.env?.DEV) } = {},
) {
  const endpoint = API_ENDPOINTS[endpointName]

  if (!endpoint) {
    throw new Error(`Unsupported API endpoint: ${endpointName}`)
  }

  return isDevelopment ? endpoint.development : endpoint.production
}
