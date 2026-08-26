import { useState } from 'react'
import HumanReviewControls from './HumanReviewControls.jsx'
import LegalBasisDisclosure from './LegalBasisDisclosure.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import { REVIEW_TASK_STATUSES } from '../data/regulatoryChangeEvents.js'

function ReviewTaskCard({
  task,
  isHighlighted = false,
  index,
  progress,
  onStatusChange,
  onToggleQuestion,
  onReviewDocument,
  humanReviewRecord,
  onHumanReviewChange,
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const status = progress?.status || task.status
  const checkedQuestions = progress?.checkedQuestions || []

  return (
    <article
      className={`review-task-card ${
        isHighlighted ? 'review-task-card--returned' : ''
      }`}
      id={`review-task-${task.id}`}
    >
      <header className="review-task-card__header">
        <div>
          <p>
            Review task {String(index + 1).padStart(2, '0')}
            {isHighlighted ? ' · Returned from Document Review' : ''}
          </p>
          <h3>{task.title}</h3>
        </div>
        <div className="review-task-card__controls">
          <PriorityBadge priority={task.priority} />
          <label>
            <span>Task status</span>
            <select
              value={status}
              className={`task-status-select task-status-select--${status
                .toLowerCase()
                .replaceAll(' ', '-')}`}
              onChange={(event) => onStatusChange(task.id, event.target.value)}
            >
              {REVIEW_TASK_STATUSES.map((taskStatus) => (
                <option value={taskStatus} key={taskStatus}>
                  {taskStatus}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="review-task-card__reason">
        <span>Reason for review / 审查原因</span>
        <p>{task.reasonForReview}</p>
      </div>

      {task.legalBasis ? (
        <div className="review-task-card__governance">
          <HumanReviewControls
            reviewKey={`review-task:${task.id}`}
            originalText={task.description}
            record={humanReviewRecord}
            onChange={onHumanReviewChange}
          />
          <LegalBasisDisclosure legalBasis={task.legalBasis} />
        </div>
      ) : (
        <p className="review-task-card__description">{task.description}</p>
      )}

      <details
        className="review-task-card__details"
        open={isExpanded}
        onToggle={(event) => setIsExpanded(event.currentTarget.open)}
      >
        <summary>
          <span>Review questions and suggested documents</span>
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </summary>

        <div className="review-task-card__detail-content">
          <section aria-labelledby={`${task.id}-questions`}>
            <h4 id={`${task.id}-questions`}>Review Questions</h4>
            {task.reviewQuestions.length > 0 ? (
              <div className="review-task-question-list">
                {task.reviewQuestions.map((question, questionIndex) => (
                  <label key={question}>
                    <input
                      type="checkbox"
                      checked={checkedQuestions.includes(questionIndex)}
                      onChange={() => onToggleQuestion(task.id, questionIndex)}
                    />
                    <span>{question}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="detail-empty">
                No review questions were generated. Define factual questions
                during human task scoping.
              </p>
            )}
          </section>

          <section aria-labelledby={`${task.id}-documents`}>
            <h4 id={`${task.id}-documents`}>Suggested Documents</h4>
            {task.suggestedDocuments.length > 0 ? (
              <ul className="review-task-document-list">
                {task.suggestedDocuments.map((document) => (
                  <li key={document}>{document}</li>
                ))}
              </ul>
            ) : (
              <p className="detail-empty">
                No suggested documents recorded for this demo task.
              </p>
            )}
          </section>

          <dl className="review-task-related-metadata">
            <div>
              <dt>Related regulation</dt>
              <dd>{task.relatedRegulation}</dd>
            </div>
            <div>
              <dt>Regulatory change / event</dt>
              <dd>{task.regulatoryChangeEvent}</dd>
            </div>
            <div>
              <dt>Legal / compliance topic</dt>
              <dd>{task.legalComplianceTopic}</dd>
            </div>
            <div>
              <dt>Suggested document type</dt>
              <dd>{task.suggestedDocumentType}</dd>
            </div>
            <div>
              <dt>Impact / risk level</dt>
              <dd>{task.impactRiskLevel}</dd>
            </div>
            <div>
              <dt>Workflow source reference</dt>
              <dd>{task.relatedLegalSource}</dd>
            </div>
          </dl>
        </div>
      </details>

      <footer className="review-task-card__footer">
        <p>Local prototype state only · No task data is saved</p>
        <button type="button" onClick={() => onReviewDocument(task)}>
          Review Document
        </button>
      </footer>
    </article>
  )
}

export default ReviewTaskCard
