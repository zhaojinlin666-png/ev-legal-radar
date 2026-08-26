function getStatusTone(status) {
  if (typeof status !== 'string') return 'neutral'
  if (status === 'Source detected') return 'detected'
  if (status === 'Analyzing') return 'analyzing'
  if (status === 'Analysis failed') return 'failed'
  if (status === 'Further Review Required') return 'further-review'
  if (status === 'Unreviewed' || status.includes('pending')) return 'unreviewed'
  if (status === 'Analysis completed') return 'verified'
  if (status.includes('verified') || status.includes('reviewed')) return 'verified'
  return 'neutral'
}

function RegulatoryStatusBadge({ status }) {
  const label = typeof status === 'string' ? status : 'Status unavailable'

  return (
    <span
      className={`regulatory-status-badge regulatory-status-badge--${getStatusTone(
        label,
      )}`}
    >
      <span aria-hidden="true" />
      {label}
    </span>
  )
}

export default RegulatoryStatusBadge
