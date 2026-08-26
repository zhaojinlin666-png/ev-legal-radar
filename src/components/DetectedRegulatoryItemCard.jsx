import RegulatoryStatusBadge from './RegulatoryStatusBadge.jsx'

function DetectedRegulatoryItemCard({
  item,
  reviewEventCreated,
  onCreateReviewEvent,
}) {
  return (
    <article className="detected-regulatory-card">
      <header className="detected-regulatory-card__header">
        <div>
          <RegulatoryStatusBadge status={item.detectionStatus} />
          <h3>{item.title}</h3>
        </div>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
          View official source
        </a>
      </header>

      <dl className="detected-regulatory-card__metadata">
        <div>
          <dt>Official source / regulator</dt>
          <dd>{item.regulator}</dd>
        </div>
        <div>
          <dt>Publication date</dt>
          <dd>
            {item.publicationDate ? (
              <time dateTime={item.publicationDate}>{item.publicationDate}</time>
            ) : (
              'Not available on the listing page'
            )}
          </dd>
        </div>
        <div>
          <dt>Matched keywords</dt>
          <dd className="detected-regulatory-card__keywords">
            {item.matchedKeywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </dd>
        </div>
      </dl>

      <footer className="detected-regulatory-card__footer">
        <p>
          Metadata only · No legal verification or impact analysis has been
          performed.
        </p>
        <button type="button" onClick={() => onCreateReviewEvent(item)}>
          {reviewEventCreated ? 'Open Review Event' : 'Start Legal Review'}
        </button>
      </footer>
    </article>
  )
}

export default DetectedRegulatoryItemCard
