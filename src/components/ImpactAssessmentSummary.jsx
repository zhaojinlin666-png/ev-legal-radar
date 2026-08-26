import RiskBadge from './RiskBadge.jsx'
import RegulatoryStatusBadge from './RegulatoryStatusBadge.jsx'

function ImpactAssessmentSummary({ event }) {
  const summaryItems = [
    {
      label: 'Impact Level',
      value: event.preliminaryImpactLevel ? (
        <RiskBadge level={event.preliminaryImpactLevel} label="impact" />
      ) : (
        <span className="not-assessed-badge">Not assessed</span>
      ),
    },
    {
      label: 'Affected Activities',
      value: event.potentiallyAffectedActivities.length,
    },
    {
      label: 'Suggested Documents',
      value: event.documentsToReview.length,
    },
    {
      label: 'Generated Review Tasks',
      value: event.generatedReviewTasks.length,
    },
  ]

  return (
    <section
      className="impact-assessment-summary"
      aria-labelledby="impact-assessment-title"
    >
      <div className="impact-assessment-summary__heading">
        <div>
          <p className="section-kicker">Workflow triage</p>
          <h2 id="impact-assessment-title">Preliminary Impact Assessment</h2>
        </div>
        {event.demoLabel ? (
          <span className="demo-data-label">{event.demoLabel}</span>
        ) : (
          <RegulatoryStatusBadge
            status={event.analysisStatus || 'Unreviewed'}
          />
        )}
      </div>

      <dl className="impact-assessment-stats">
        {summaryItems.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="impact-assessment-disclaimer">
        This preliminary impact assessment is for legal-research and workflow
        demonstration only and does not determine whether any specific activity
        is legally non-compliant.
      </p>
    </section>
  )
}

export default ImpactAssessmentSummary
