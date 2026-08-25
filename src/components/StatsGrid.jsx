import StatCard from './StatCard.jsx'

function StatsGrid({ stats }) {
  return (
    <section className="stats-grid" aria-label="Regulatory overview">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  )
}

export default StatsGrid
