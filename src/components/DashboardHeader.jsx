function DashboardHeader() {
  return (
    <header className="topbar">
      <div className="brand" aria-label="EV Legal Radar home">
        <span className="brand-mark" aria-hidden="true">
          EV
        </span>
        <span className="brand-name">EV Legal Radar</span>
      </div>

      <div className="system-status">
        <span className="system-status__indicator" aria-hidden="true" />
        Monitoring active
      </div>
    </header>
  )
}

export default DashboardHeader
