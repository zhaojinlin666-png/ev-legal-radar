import RegulatoryStatusBadge from './RegulatoryStatusBadge.jsx'
import RiskBadge from './RiskBadge.jsx'

function RegulatoryChangeCard({ event, onSelect }) {
  return (
    <article className="change-event-card">
      <button
        type="button"
        className="change-event-card__click-target"
        aria-label={`View regulatory review event for ${event.title}`}
        onClick={() => onSelect(event)}
      />

      <header className="change-event-card__header">
        <div>
          <div className="change-event-card__labels">
            <span className="jurisdiction-tag">{event.jurisdiction}</span>
            {event.demoLabel ? (
              <span className="demo-data-label">{event.demoLabel}</span>
            ) : null}
            {event.detectionStatus ? (
              <RegulatoryStatusBadge status={event.detectionStatus} />
            ) : null}
            {event.analysisStatus ? (
              <RegulatoryStatusBadge status={event.analysisStatus} />
            ) : null}
          </div>
          <h3>{event.title}</h3>
        </div>
        {event.preliminaryImpactLevel ? (
          <RiskBadge level={event.preliminaryImpactLevel} label="impact" />
        ) : (
          <span className="not-assessed-badge">Impact not assessed</span>
        )}
      </header>

      <p
        className={`change-event-card__summary ${
          event.shortSummary ? '' : 'detail-empty'
        }`}
      >
        {event.shortSummary ||
          'No legal summary has been prepared for this unreviewed event.'}
      </p>

      <dl className="change-event-card__metadata">
        <div>
          <dt>Regulator</dt>
          <dd>{event.regulator}</dd>
        </div>
        <div>
          <dt>Change type</dt>
          <dd>{event.changeType}</dd>
        </div>
        <div>
          <dt>Publication date</dt>
          <dd>
            {event.publicationDate ? (
              <time dateTime={event.publicationDate}>
                {event.publicationDate}
              </time>
            ) : (
              <span className="detail-empty">Not available</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Effective date</dt>
          <dd>
            {event.effectiveDate ? (
              <time dateTime={event.effectiveDate}>{event.effectiveDate}</time>
            ) : (
              <span className="detail-empty">
                Not available in current project data
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Review tasks</dt>
          <dd>{event.generatedReviewTasks?.length ?? 0}</dd>
        </div>
        <div className="change-event-card__verification">
          <dt>Verification status</dt>
          <dd>
            <RegulatoryStatusBadge status={event.verificationStatus} />
          </dd>
        </div>
      </dl>
    </article>
  )
}

export default RegulatoryChangeCard
