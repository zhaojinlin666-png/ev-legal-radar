import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  createExternalId,
  fetchOfficialRegulatorySourceContent,
  fetchRegulatoryUpdates,
  filterRelevantRegulatoryItems,
  normalizeDiscoveredItem,
  parseCacRegulatoryListing,
  parseCacOfficialSourceContent,
} from '../server/services/regulatoryMonitoringService.js'
import {
  createReviewEventFromDetectedItem,
  mergeDetectedRegulatoryItems,
} from '../src/utils/regulatoryMonitoring.js'

const fixturePath = fileURLToPath(
  new URL('./fixtures/cac-regulatory-listing.html', import.meta.url),
)
const fixtureHtml = await readFile(fixturePath, 'utf8')
const detailFixturePath = fileURLToPath(
  new URL('./fixtures/cac-regulatory-detail.html', import.meta.url),
)
const detailFixtureHtml = await readFile(detailFixturePath, 'utf8')

test('CAC listing parser extracts official metadata and rejects duplicates', () => {
  const items = parseCacRegulatoryListing(fixtureHtml)

  assert.equal(items.length, 3)
  assert.equal(
    items[0].title,
    '国家互联网信息办公室关于个人信息保护相关规定公开征求意见的通知',
  )
  assert.equal(
    items[0].sourceUrl,
    'https://www.cac.gov.cn/2026-08/07/c_example_personal_information.htm',
  )
  assert.equal(items[0].publicationDate, '2026-08-07')
  assert.equal(items[1].publicationDate, '2026-07-24')
})

test('keyword filtering is transparent and records every matched keyword', () => {
  const items = parseCacRegulatoryListing(fixtureHtml)
  const relevantItems = filterRelevantRegulatoryItems(items)

  assert.equal(relevantItems.length, 2)
  assert.deepEqual(relevantItems[0].matchedKeywords, ['个人信息'])
  assert.deepEqual(relevantItems[1].matchedKeywords, ['数据出境'])
  assert.ok(
    relevantItems.every(
      (item) => item.detectionStatus === 'Source detected',
    ),
  )
})

test('externalId generation is deterministic and URL-based', () => {
  const item = {
    sourceUrl:
      'https://www.cac.gov.cn/2026-08/07/c_example_personal_information.htm',
    title: 'First title',
    publicationDate: '2026-08-07',
  }

  assert.equal(createExternalId(item), createExternalId(item))
  assert.equal(
    createExternalId(item),
    createExternalId({
      ...item,
      title: 'A listing title correction does not change the URL identity',
      publicationDate: '2026-08-08',
    }),
  )
})

test('frontend merge rejects duplicate and malformed detected items', () => {
  const detectedItems = filterRelevantRegulatoryItems(
    parseCacRegulatoryListing(fixtureHtml),
  )
  const firstMerge = mergeDetectedRegulatoryItems([], detectedItems)
  const secondMerge = mergeDetectedRegulatoryItems(firstMerge.items, [
    detectedItems[0],
    { title: 'Malformed item' },
  ])

  assert.equal(firstMerge.addedItems.length, 2)
  assert.equal(secondMerge.addedItems.length, 0)
  assert.equal(secondMerge.items.length, 2)
})

test('malformed or non-official source items are rejected', () => {
  assert.equal(
    normalizeDiscoveredItem({
      title: '',
      sourceUrl: 'https://www.cac.gov.cn/empty.htm',
      publicationDate: '2026-01-01',
    }),
    null,
  )
  assert.equal(
    normalizeDiscoveredItem({
      title: 'External source',
      sourceUrl: 'https://example.com/external.htm',
      publicationDate: '2026-01-01',
    }),
    null,
  )
})

test('monitoring fetch normalizes the response without legal verification', async () => {
  const result = await fetchRegulatoryUpdates({
    fetchImpl: async () => ({ ok: true, text: async () => fixtureHtml }),
    now: () => new Date('2026-08-26T10:00:00.000Z'),
  })

  assert.equal(result.source.name, '中国网信网')
  assert.equal(result.source.fetchedAt, '2026-08-26T10:00:00.000Z')
  assert.equal(result.items.length, 2)
  result.items.forEach((item) => {
    assert.equal(item.detectionStatus, 'Source detected')
    assert.equal('verificationStatus' in item, false)
    assert.equal('preliminaryImpactLevel' in item, false)
  })
})

test('monitoring fetch converts network failures into a safe service error', async () => {
  await assert.rejects(
    fetchRegulatoryUpdates({
      fetchImpl: async () => {
        throw new Error('fixture network failure')
      },
    }),
    (error) => {
      assert.equal(error.code, 'REGULATORY_SOURCE_NETWORK_ERROR')
      assert.equal(error.statusCode, 502)
      assert.equal(
        error.publicMessage,
        'The official regulatory source is temporarily unavailable.',
      )
      return true
    },
  )
})

test('official detail parser extracts only title and source body content', () => {
  const result = parseCacOfficialSourceContent(detailFixtureHtml)

  assert.equal(
    result.title,
    '国家互联网信息办公室关于个人信息保护相关规定公开征求意见的通知',
  )
  assert.match(result.content, /本通知公开征求意见/u)
  assert.match(result.content, /相关材料涉及个人信息处理规则/u)
  assert.doesNotMatch(result.content, /fixtureSecret|Footer content/u)
})

test('official detail fetch enforces detected title and returns safe metadata', async () => {
  const result = await fetchOfficialRegulatorySourceContent({
    sourceUrl:
      'https://www.cac.gov.cn/2026-08/07/c_example_personal_information.htm',
    expectedTitle:
      '国家互联网信息办公室关于个人信息保护相关规定公开征求意见的通知',
    fetchImpl: async () => ({
      ok: true,
      text: async () => detailFixtureHtml,
    }),
    now: () => new Date('2026-08-26T12:00:00.000Z'),
  })

  assert.equal(result.fetchedAt, '2026-08-26T12:00:00.000Z')
  assert.equal(result.truncated, false)
  assert.equal(
    result.sourceUrl,
    'https://www.cac.gov.cn/2026-08/07/c_example_personal_information.htm',
  )

  await assert.rejects(
    fetchOfficialRegulatorySourceContent({
      sourceUrl:
        'https://www.cac.gov.cn/2026-08/07/c_example_personal_information.htm',
      expectedTitle: 'Different detected title',
      fetchImpl: async () => ({
        ok: true,
        text: async () => detailFixtureHtml,
      }),
    }),
    (error) => error.code === 'REGULATORY_SOURCE_TITLE_MISMATCH',
  )
})

test('creating a review event preserves the unreviewed boundary', () => {
  const [detectedItem] = filterRelevantRegulatoryItems(
    parseCacRegulatoryListing(fixtureHtml),
  )
  const reviewEvent = createReviewEventFromDetectedItem(detectedItem)

  assert.equal(reviewEvent.verificationStatus, 'Unreviewed')
  assert.equal(reviewEvent.preliminaryImpactLevel, null)
  assert.equal(reviewEvent.changeType, 'Unclassified')
  assert.deepEqual(reviewEvent.generatedReviewTasks, [])
  assert.deepEqual(reviewEvent.potentiallyAffectedActivities, [])
  assert.deepEqual(reviewEvent.documentsToReview, [])
  assert.equal(reviewEvent.changeSummary.newRequirement, null)
})
