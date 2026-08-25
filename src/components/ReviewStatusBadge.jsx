const statusClassNames = {
  'Not reviewed': 'review-status-badge--not-reviewed',
  'Under review': 'review-status-badge--under-review',
  'Further information required':
    'review-status-badge--information-required',
  Reviewed: 'review-status-badge--reviewed',
}

function ReviewStatusBadge({ status }) {
  const fixedStatus = statusClassNames[status] ? status : 'Not reviewed'

  return (
    <span
      className={`review-status-badge ${statusClassNames[fixedStatus]}`}
    >
      <span className="review-status-badge__dot" aria-hidden="true" />
      {fixedStatus}
    </span>
  )
}

export default ReviewStatusBadge
