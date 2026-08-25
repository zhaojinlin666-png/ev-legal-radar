function RiskBadge({ level, label = 'risk' }) {
  return (
    <span className={`risk-badge risk-badge--${level.toLowerCase()}`}>
      <span className="risk-badge__dot" aria-hidden="true" />
      {level}
      {label ? ` ${label}` : ''}
    </span>
  )
}

export default RiskBadge
