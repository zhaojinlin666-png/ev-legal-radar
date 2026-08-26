import 'dotenv/config'
import express from 'express'
import {
  handleAiReviewRequest,
  handleRegulatoryImpactAnalysisRequest,
  handleRegulatoryUpdatesRequest,
} from './http/apiHandlers.js'
import { isOpenAiProxyConfigured } from './services/aiReviewService.js'

const app = express()
const port = Number(process.env.PORT) || 3001

function sendApiResult(response, result) {
  Object.entries(result.headers || {}).forEach(([name, value]) => {
    response.set(name, value)
  })
  return response.status(result.status).json(result.body)
}

app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

app.get('/api/regulatory-updates', async (request, response) => {
  void request
  return sendApiResult(response, await handleRegulatoryUpdatesRequest())
})

app.post('/api/regulatory-impact-analysis', async (request, response) => {
  return sendApiResult(
    response,
    await handleRegulatoryImpactAnalysisRequest({ body: request.body }),
  )
})

app.post('/api/ai-review', async (request, response) => {
  return sendApiResult(
    response,
    await handleAiReviewRequest({ body: request.body }),
  )
})

app.use((error, request, response, next) => {
  void request
  void next

  if (error?.type === 'entity.too.large') {
    return response.status(413).json({ error: 'Request body is too large.' })
  }

  if (error instanceof SyntaxError) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' })
  }

  console.error('Unhandled server error.', { errorName: error?.name })
  return response.status(500).json({ error: 'Internal server error.' })
})

app.listen(port, () => {
  console.log(`EV Legal Radar server listening on http://localhost:${port}`)
  console.log(
    `OpenAI proxy configured: ${isOpenAiProxyConfigured() ? 'yes' : 'no'}`,
  )
})
