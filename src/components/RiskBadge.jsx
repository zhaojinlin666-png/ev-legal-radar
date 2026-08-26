function RiskBadge({ level, label = 'risk' }) {
  const tone =
    typeof level === 'string'
      ? level.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-')
      : 'unavailable'

  return (
    <span className={`risk-badge risk-badge--${tone}`}>
      <span className="risk-badge__dot" aria-hidden="true" />
      {level || 'Unavailable'}
      {label ? ` ${label}` : ''}
    </span>
  )
}

export default RiskBadge
