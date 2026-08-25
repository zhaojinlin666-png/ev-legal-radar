import RiskBadge from './RiskBadge.jsx'

function RegulatoryUpdateCard({ update, onSelect }) {
  const renderTags = (items, className = '') =>
    items.length > 0 ? (
      items.map((item) => (
        <span className={`taxonomy-tag ${className}`} key={item}>
          {item}
        </span>
      ))
    ) : (
      <span className="taxonomy-empty">Not provided</span>
    )

  return (
    <article className="update-card">
      <button
        type="button"
        className="update-card__click-target"
        aria-label={`View details for ${update.title}`}
        onClick={() => onSelect(update)}
      />

      <div className="update-card__accent" aria-hidden="true">
        {update.jurisdiction}
      </div>

      <div className="update-card__content">
        <div className="update-card__heading">
          <div>
            <div className="update-card__labels">
              <span className="jurisdiction-tag">{update.jurisdiction}</span>
            </div>
            <h3>{update.title}</h3>
          </div>
          <RiskBadge level={update.riskLevel} />
        </div>

        <p className="update-card__summary">{update.summary}</p>

        <div className="update-card__taxonomy">
          <div className="taxonomy-group">
            <p>Business areas</p>
            <div className="taxonomy-tags">
              {renderTags(update.businessAreas)}
            </div>
          </div>
          <div className="taxonomy-group">
            <p>Legal topics</p>
            <div className="taxonomy-tags">
              {renderTags(update.legalTopics, 'taxonomy-tag--legal')}
            </div>
          </div>
        </div>

        <dl className="update-card__metadata">
          <div>
            <dt>Regulator</dt>
            <dd>{update.regulator}</dd>
          </div>
          <div>
            <dt>Publication date</dt>
            <dd>
              <time dateTime={update.publicationDate}>
                {update.publicationDate}
              </time>
            </dd>
          </div>
          <div>
            <dt>Verification status</dt>
            <dd>
              {update.verificationStatus ? (
                <span className="verification-status">
                  {update.verificationStatus}
                </span>
              ) : (
                'Not provided'
              )}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export default RegulatoryUpdateCard
