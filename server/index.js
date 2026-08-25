import 'dotenv/config'
import express from 'express'
import {
  isOpenAiProxyConfigured,
  runAiReview,
} from './services/aiReviewService.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))

app.post('/api/ai-review', async (request, response) => {
  const { documentText, reviewRules, legalSource } = request.body ?? {}

  if (typeof documentText !== 'string' || documentText.trim().length === 0) {
    return response.status(400).json({ error: 'documentText is required.' })
  }

  if (!Array.isArray(reviewRules) || reviewRules.length === 0) {
    return response.status(400).json({ error: 'reviewRules are required.' })
  }

  if (
    reviewRules.length > 50 ||
    reviewRules.some(
      (rule) =>
        !rule ||
        typeof rule !== 'object' ||
        typeof rule.id !== 'string' ||
        typeof rule.title !== 'string' ||
        typeof rule.legalBasis !== 'string' ||
        typeof rule.legalArticle !== 'string' ||
        !['High', 'Medium', 'Low'].includes(rule.riskLevel),
    ) ||
    new Set(reviewRules.map((rule) => rule.id)).size !== reviewRules.length
  ) {
    return response.status(400).json({ error: 'reviewRules are invalid.' })
  }

  if (
    !legalSource ||
    typeof legalSource !== 'object' ||
    Array.isArray(legalSource) ||
    Object.keys(legalSource).length === 0
  ) {
    return response.status(400).json({ error: 'legalSource is required.' })
  }

  if (!process.env.OPENAI_API_KEY) {
    return response.status(503).json({
      error: 'AI review service is not configured.',
    })
  }

  try {
    const results = await runAiReview({
      documentText,
      reviewRules,
      legalSource,
    })

    return response.json({ results })
  } catch (error) {
    console.error('AI review request failed.', {
      errorName: error.name,
      statusCode: error.statusCode,
      providerStatus: error.providerStatus,
      requestId: error.requestId,
    })

    return response.status(error.statusCode ?? 500).json({
      error: error.publicMessage || 'AI review request failed.',
    })
  }
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
