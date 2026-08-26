import assert from 'node:assert/strict'
import test from 'node:test'
import {
  NO_VERIFIED_PREVIOUS_VERSION_NOTICE,
  PRELIMINARY_IMPACT_DISCLAIMER,
} from '../shared/regulatoryImpactContract.js'
import {
  createHumanReviewRecord,
  getHumanReviewedText,
  summarizeHumanReviewRecords,
} from '../src/utils/humanReview.js'
import { getRegulatoryChangePresentation } from '../src/utils/regulatoryChangePresentation.js'

test('new-source presentation never fabricates a prior requirement', () => {
  const presentation = getRegulatoryChangePresentation({
    comparisonMode: 'new_source_summary',
    previousRequirement: null,
  })

  assert.equal(presentation.hasVerifiedComparison, false)
  assert.equal(
    presentation.title,
    'What the New Source Introduces / 新文件提出了什么',
  )
  assert.equal(presentation.notice, NO_VERIFIED_PREVIOUS_VERSION_NOTICE)
  assert.equal(presentation.previousRequirement, null)
})

test('What Changed is available only with a verified prior requirement', () => {
  const missingPrior = getRegulatoryChangePresentation({
    comparisonMode: 'verified_change_comparison',
    previousRequirement: null,
  })
  const verifiedPrior = getRegulatoryChangePresentation({
    comparisonMode: 'verified_change_comparison',
    previousRequirement: 'Verified previous requirement',
  })

  assert.equal(missingPrior.hasVerifiedComparison, false)
  assert.equal(verifiedPrior.hasVerifiedComparison, true)
  assert.equal(verifiedPrior.title, 'What Changed / 发生了什么变化')
})

test('human review supports accept, edit, reject and reset semantics', () => {
  const original = 'Original AI-generated preliminary analysis.'
  const accepted = createHumanReviewRecord('Accepted', original)
  const edited = createHumanReviewRecord('Edited', original, 'Human edit.')
  const rejected = createHumanReviewRecord('Rejected', original)
  const unreviewed = createHumanReviewRecord('Unreviewed', original)

  assert.equal(accepted.humanReviewed, true)
  assert.equal(accepted.legallyVerified, false)
  assert.equal(getHumanReviewedText(original, edited), 'Human edit.')
  assert.equal(getHumanReviewedText(original, rejected), original)
  assert.equal(unreviewed.humanReviewed, false)
})

test('human review summary counts every local governance state', () => {
  const keys = ['one', 'two', 'three', 'four', 'five']
  const records = {
    one: createHumanReviewRecord('Accepted', 'One'),
    two: createHumanReviewRecord('Edited', 'Two', 'Edited two'),
    three: createHumanReviewRecord('Rejected', 'Three'),
    four: createHumanReviewRecord('Accepted', 'Four'),
  }
  const summary = summarizeHumanReviewRecords(keys, records)

  assert.deepEqual(summary, {
    total: 5,
    Unreviewed: 1,
    Accepted: 2,
    Edited: 1,
    Rejected: 1,
  })
})

test('explainable impact disclaimer preserves the preliminary-review boundary', () => {
  assert.equal(
    PRELIMINARY_IMPACT_DISCLAIMER,
    'This impact level is a preliminary prioritization signal for legal review, not a determination of legal non-compliance.',
  )
})
