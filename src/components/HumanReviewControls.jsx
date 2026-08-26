import { useState } from 'react'
import {
  createHumanReviewRecord,
  getHumanReviewedText,
} from '../utils/humanReview.js'

function HumanReviewControls({ reviewKey, originalText, record, onChange }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(record?.editedText || originalText)
  const status = record?.status || 'Unreviewed'
  const displayedText = getHumanReviewedText(originalText, record)

  const saveEdit = () => {
    onChange(
      reviewKey,
      createHumanReviewRecord('Edited', originalText, draft),
    )
    setIsEditing(false)
  }

  return (
    <div className={`human-review-control human-review-control--${status.toLowerCase()}`}>
      <div className="human-review-control__status">
        <span>HUMAN REVIEW / 人工复核</span>
        <strong>{status}</strong>
        {status === 'Accepted' ? (
          <small>Human-reviewed · Not legally verified</small>
        ) : null}
      </div>

      {status === 'Rejected' ? (
        <p className="human-review-control__audit">
          Rejected from workflow use. Original AI text remains visible for audit.
        </p>
      ) : null}

      {isEditing ? (
        <div className="human-review-control__editor">
          <textarea
            aria-label="Edit generated analysis"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div>
            <button type="button" onClick={saveEdit} disabled={!draft.trim()}>
              Save edit
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="human-review-control__text">{displayedText}</p>
      )}

      <div className="human-review-control__actions">
        <button
          type="button"
          onClick={() =>
            onChange(
              reviewKey,
              createHumanReviewRecord('Accepted', originalText),
            )
          }
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(displayedText)
            setIsEditing(true)
          }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(
              reviewKey,
              createHumanReviewRecord('Rejected', originalText),
            )
          }
        >
          Reject
        </button>
        {status !== 'Unreviewed' ? (
          <button
            type="button"
            onClick={() =>
              onChange(
                reviewKey,
                createHumanReviewRecord('Unreviewed', originalText),
              )
            }
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default HumanReviewControls
