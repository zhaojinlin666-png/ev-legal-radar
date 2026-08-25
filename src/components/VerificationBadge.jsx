const verificationClassNames = {
  'AI-generated': 'verification-badge--ai',
  'Human-reviewed': 'verification-badge--human',
  'Source Verified': 'verification-badge--source',
}

function VerificationBadge({ status }) {
  const fixedStatus = verificationClassNames[status]
    ? status
    : 'AI-generated'

  return (
    <span
      className={`verification-badge ${verificationClassNames[fixedStatus]}`}
    >
      <span className="verification-badge__dot" aria-hidden="true" />
      {fixedStatus}
    </span>
  )
}

export default VerificationBadge
