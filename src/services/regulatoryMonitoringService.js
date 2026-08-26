const FETCH_ERROR_MESSAGE =
  'Regulatory updates could not be retrieved from the official source.'

function isDetectedItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.externalId === 'string' &&
    typeof item.title === 'string' &&
    typeof item.sourceUrl === 'string' &&
    (item.publicationDate === null ||
      typeof item.publicationDate === 'string') &&
    typeof item.regulator === 'string' &&
    Array.isArray(item.matchedKeywords) &&
    item.matchedKeywords.every((keyword) => typeof keyword === 'string') &&
    item.detectionStatus === 'Source detected'
  )
}

function isMonitoringResponse(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    payload.source &&
    typeof payload.source.name === 'string' &&
    typeof payload.source.url === 'string' &&
    typeof payload.source.fetchedAt === 'string' &&
    Array.isArray(payload.items) &&
    payload.items.every(isDetectedItem)
  )
}

export async function fetchRegulatoryUpdates() {
  let response

  try {
    response = await fetch('/api/regulatory-updates', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error(FETCH_ERROR_MESSAGE)
  }

  let payload

  try {
    payload = await response.json()
  } catch {
    throw new Error(FETCH_ERROR_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string' ? payload.error : FETCH_ERROR_MESSAGE,
    )
  }

  if (!isMonitoringResponse(payload)) {
    throw new Error('The regulatory monitoring service returned invalid data.')
  }

  return payload
}
