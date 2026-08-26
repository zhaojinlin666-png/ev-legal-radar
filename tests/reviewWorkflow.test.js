import test from 'node:test'
import assert from 'node:assert/strict'
import { regulatoryChangeEvents } from '../src/data/regulatoryChangeEvents.js'
import {
  createDocumentReviewContext,
  REVIEW_CONTEXT_KIND,
} from '../src/utils/reviewWorkflow.js'

const chinaAutomotiveEvent = regulatoryChangeEvents.find(
  (event) =>
    event.jurisdiction === 'China' &&
    event.title === '汽车数据安全管理若干规定（试行）',
)

test('every demo regulatory event exposes concrete review tasks', () => {
  assert.ok(regulatoryChangeEvents.length > 0)

  regulatoryChangeEvents.forEach((event) => {
    assert.equal(event.demoLabel, 'Demo change event')
    assert.ok(event.generatedReviewTasks.length > 0)

    event.generatedReviewTasks.forEach((task) => {
      assert.equal(task.relatedRegulation, event.title)
      assert.equal(task.regulatoryChangeEventId, event.id)
      assert.ok(task.regulatoryChangeEvent.includes('Demo change event'))
      assert.ok(task.title)
      assert.ok(task.legalComplianceTopic)
      assert.ok(task.suggestedDocumentType)
      assert.ok(['High', 'Medium', 'Low'].includes(task.impactRiskLevel))
      assert.ok(task.reasonForReview)
    })
  })
})

test('China automotive-data demo includes a privacy-notice review flow', () => {
  assert.ok(chinaAutomotiveEvent)

  const privacyNoticeTask = chinaAutomotiveEvent.generatedReviewTasks.find(
    (task) => task.suggestedDocuments.includes('用户隐私政策'),
  )

  assert.ok(privacyNoticeTask)
  assert.equal(privacyNoticeTask.suggestedDocumentType, '用户隐私政策')
  assert.equal(privacyNoticeTask.impactRiskLevel, 'High')
  assert.ok(privacyNoticeTask.reviewQuestions.length > 0)
})

test('review context transfers workflow metadata without legal authority or evidence', () => {
  const privacyNoticeTask = chinaAutomotiveEvent.generatedReviewTasks.find(
    (task) => task.suggestedDocuments.includes('用户隐私政策'),
  )
  const context = createDocumentReviewContext(
    chinaAutomotiveEvent,
    privacyNoticeTask,
  )

  assert.deepEqual(context, {
    contextKind: REVIEW_CONTEXT_KIND,
    originEventId: chinaAutomotiveEvent.id,
    originTaskId: privacyNoticeTask.id,
    relatedRegulationTitle: chinaAutomotiveEvent.title,
    regulatoryChangeEvent: privacyNoticeTask.regulatoryChangeEvent,
    reviewTask: privacyNoticeTask.title,
    legalTopic: privacyNoticeTask.legalComplianceTopic,
    suggestedDocumentType: '用户隐私政策',
    impactRiskLevel: 'High',
    demoLabel: 'Demo change event',
  })

  assert.equal('documentText' in context, false)
  assert.equal('evidence' in context, false)
  assert.equal('legalSource' in context, false)
  assert.equal('legalAuthorities' in context, false)
})

