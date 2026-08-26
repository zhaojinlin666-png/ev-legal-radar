import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getAllVerifiedProvisions,
  LEGAL_KNOWLEDGE_BASE,
  LEGAL_SOURCE_NOT_VERIFIED,
} from '../src/data/legalKnowledgeBase.js'
import {
  attachVerifiedLegalAuthorities,
  getMappedVerifiedLegalAuthorities,
} from '../src/data/ruleLegalAuthorityMap.js'

function citations(authorities) {
  return authorities.map((authority) => [authority.lawId, authority.article])
}

test('local knowledge base exposes only the supplied verified records', () => {
  const verifiedProvisions = getAllVerifiedProvisions()

  assert.equal(LEGAL_KNOWLEDGE_BASE.length, 14)
  assert.equal(verifiedProvisions.length, 14)
  assert.ok(
    verifiedProvisions.every(
      (provision) => provision.verificationStatus === 'verified',
    ),
  )
  assert.ok(
    verifiedProvisions.every((provision) =>
      /^(?:https:\/\/www\.npc\.gov\.cn\/|https:\/\/www\.cac\.gov\.cn\/)/u.test(
        provision.sourceUrl,
      ),
    ),
  )
})

test('processing-purpose receives the four supplied verified provisions', () => {
  const authorities = getMappedVerifiedLegalAuthorities('processing-purpose')

  assert.deepEqual(citations(authorities), [
    ['cn-personal-information-protection-law', 'Article 6'],
    ['cn-personal-information-protection-law', 'Article 7'],
    ['cn-automobile-data-security-provisions-trial', 'Article 4'],
    ['cn-automobile-data-security-provisions-trial', 'Article 7'],
  ])
})

test('retention-period receives only Automotive Article 7', () => {
  const authorities = getMappedVerifiedLegalAuthorities('retention-period')

  assert.deepEqual(citations(authorities), [
    ['cn-automobile-data-security-provisions-trial', 'Article 7'],
  ])
  assert.match(authorities[0].reviewScope, /disclosure/u)
})

test('storage-location adds Article 11 only for important-data context', () => {
  const ordinaryStorage = getMappedVerifiedLegalAuthorities(
    'storage-location',
  )
  const importantDataStorage = getMappedVerifiedLegalAuthorities(
    'storage-location',
    { importantDataContext: true },
  )

  assert.deepEqual(
    ordinaryStorage.map((authority) => authority.article),
    ['Article 7'],
  )
  assert.deepEqual(
    importantDataStorage.map((authority) => authority.article),
    ['Article 7', 'Article 11'],
  )
})

test('vehicle trajectory context is treated as sensitive personal information', () => {
  const authorities = getMappedVerifiedLegalAuthorities(
    'vehicle-location-or-trajectory',
    { vehicleTrajectoryContext: true },
  )

  assert.deepEqual(
    authorities.map((authority) => authority.article),
    ['Article 3', 'Article 9'],
  )
  assert.match(authorities[0].requirementSummary, /sensitive personal information/u)
  assert.match(authorities[1].topic, /sensitive personal information/u)
})

test('cross-border mapping distinguishes important data from ordinary personal information', () => {
  const ordinaryPersonalInformation = getMappedVerifiedLegalAuthorities(
    'cross-border-transfer',
  )
  const importantData = getMappedVerifiedLegalAuthorities(
    'cross-border-transfer',
    { importantDataContext: true },
  )

  assert.deepEqual(ordinaryPersonalInformation, [])
  assert.deepEqual(
    importantData.map((authority) => authority.article),
    ['Article 11'],
  )
})

test('an unmapped rule returns LEGAL_SOURCE_NOT_VERIFIED', () => {
  const rule = attachVerifiedLegalAuthorities({
    id: 'not-in-registry',
    issueType: 'data-security-obligations',
  })

  assert.deepEqual(rule.legalAuthorities, [])
  assert.equal(rule.legalAuthorityStatus, LEGAL_SOURCE_NOT_VERIFIED)
  assert.equal(rule.legalBasis, LEGAL_SOURCE_NOT_VERIFIED)
  assert.equal(rule.legalArticle, LEGAL_SOURCE_NOT_VERIFIED)
})

