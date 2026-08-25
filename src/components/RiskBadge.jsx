function RiskBadge({ level }) {
  return (
    <span className={`risk-badge risk-badge--${level.toLowerCase()}`}>
      <span className="risk-badge__dot" aria-hidden="true" />
      {level} risk
    </span>
  )
}

export default RiskBadge
