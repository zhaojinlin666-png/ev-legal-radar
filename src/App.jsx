import { useMemo, useState } from 'react'
import DashboardHeader from './components/DashboardHeader.jsx'
import FilterBar from './components/FilterBar.jsx'
import RegulatoryUpdateList from './components/RegulatoryUpdateList.jsx'
import StatsGrid from './components/StatsGrid.jsx'
import { regulatoryUpdates } from './data/regulatoryUpdates.js'
import './App.css'

const stats = [
  {
    label: 'Regulatory Updates',
    value: '128',
    detail: 'Tracked this quarter',
    tone: 'primary',
  },
  {
    label: 'High Risk',
    value: '16',
    detail: 'Requires priority review',
    tone: 'danger',
  },
  {
    label: 'China',
    value: '52',
    detail: 'Active intelligence items',
    tone: 'neutral',
  },
  {
    label: 'EU & US',
    value: '76',
    detail: 'Combined coverage',
    tone: 'neutral',
  },
]

const filters = [
  'All',
  'China',
  'EU',
  'US',
  'AI',
  'Data',
  'Manufacturing',
  'Autonomous Driving',
]

function App() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredUpdates = useMemo(() => {
    if (activeFilter === 'All') return regulatoryUpdates

    return regulatoryUpdates.filter(
      (update) =>
        update.jurisdiction === activeFilter ||
        update.businessAreas.includes(activeFilter) ||
        update.legalTopics.includes(activeFilter),
    )
  }, [activeFilter])

  return (
    <div className="app-shell">
      <DashboardHeader />

      <main className="dashboard">
        <section className="page-intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Regulatory Intelligence</p>
            <h1 id="page-title">EV Legal Radar</h1>
            <p className="page-subtitle">
              AI-powered Regulatory Intelligence for New Energy Vehicle
              Companies
            </p>
          </div>

          <div className="coverage-note" aria-label="Current coverage">
            <span className="coverage-note__dot" aria-hidden="true" />
            Monitoring China, EU &amp; US
          </div>
        </section>

        <StatsGrid stats={stats} />

        <section className="updates-section" aria-labelledby="updates-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Intelligence feed</p>
              <h2 id="updates-heading">Latest Regulatory Updates</h2>
            </div>
            <p className="result-count" aria-live="polite">
              {filteredUpdates.length}{' '}
              {filteredUpdates.length === 1 ? 'update' : 'updates'}
            </p>
          </div>

          <FilterBar
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          <RegulatoryUpdateList updates={filteredUpdates} />
        </section>
      </main>

      <footer className="footer">
        <p>EV Legal Radar · Internal regulatory intelligence workspace</p>
        <p>Demonstration data only</p>
      </footer>
    </div>
  )
}

export default App
