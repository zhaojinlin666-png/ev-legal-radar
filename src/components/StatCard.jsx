function StatCard({ label, value, detail, tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__header">
        <p>{label}</p>
        <span className="stat-card__marker" aria-hidden="true" />
      </div>
      <p className="stat-card__value">{value}</p>
      <p className="stat-card__detail">{detail}</p>
    </article>
  )
}

export default StatCard
