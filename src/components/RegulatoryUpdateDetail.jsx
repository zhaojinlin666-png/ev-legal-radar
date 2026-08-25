import LegalReviewWorkspace from './LegalReviewWorkspace.jsx'
import RiskBadge from './RiskBadge.jsx'

const notReviewed = 'Not yet reviewed'

function DetailTags({ items, variant = '' }) {
  if (items.length === 0) {
    return <span className="detail-empty">{notReviewed}</span>
  }

  return (
    <div className="detail-tags">
      {items.map((item) => (
        <span className={`taxonomy-tag ${variant}`} key={item}>
          {item}
        </span>
      ))}
    </div>
  )
}

function RegulatoryUpdateDetail({ update, onBack, onReviewDemoDocument }) {
  return (
    <article className="detail-view" aria-labelledby="detail-title">
      <button type="button" className="detail-back" onClick={onBack}>
        <span aria-hidden="true">←</span>
        Back to Regulatory Updates
      </button>

      <header className="detail-hero">
        <div className="detail-hero__eyebrow">
          <span className="jurisdiction-tag">{update.jurisdiction}</span>
          <span>Regulatory update</span>
        </div>
        <h1 id="detail-title">{update.title}</h1>
        <div className="detail-hero__status">
          <RiskBadge level={update.riskLevel} />
          <span
            className={`verification-status ${
              update.verificationStatus
                ? ''
                : 'verification-status--pending'
            }`}
          >
            {update.verificationStatus || notReviewed}
          </span>
        </div>
      </header>

      <section className="detail-section" aria-labelledby="basic-info-title">
        <div className="detail-section__heading">
          <p className="section-kicker">Record details</p>
          <h2 id="basic-info-title">Basic Information</h2>
        </div>
        <dl className="detail-info-grid">
          <div className="detail-info-item detail-info-item--wide">
            <dt>Regulator</dt>
            <dd>{update.regulator}</dd>
          </div>
          <div className="detail-info-item">
            <dt>Publication date</dt>
            <dd>
              <time dateTime={update.publicationDate}>
                {update.publicationDate}
              </time>
            </dd>
          </div>
          <div className="detail-info-item">
            <dt>Effective date</dt>
            <dd>
              {update.effectiveDate ? (
                <time dateTime={update.effectiveDate}>
                  {update.effectiveDate}
                </time>
              ) : (
                <span className="detail-empty">{notReviewed}</span>
              )}
            </dd>
          </div>
          <div className="detail-info-item detail-info-item--wide">
            <dt>Business areas</dt>
            <dd>
              <DetailTags items={update.businessAreas} />
            </dd>
          </div>
          <div className="detail-info-item detail-info-item--wide">
            <dt>Legal topics</dt>
            <dd>
              <DetailTags
                items={update.legalTopics}
                variant="taxonomy-tag--legal"
              />
            </dd>
          </div>
        </dl>
      </section>

      <LegalReviewWorkspace
        items={update.legalReviewItems}
        onReviewDemoDocument={onReviewDemoDocument}
      />

      <section className="detail-section" aria-labelledby="analysis-title">
        <div className="detail-section__heading">
          <p className="section-kicker">Current assessment</p>
          <h2 id="analysis-title">AI Legal Analysis</h2>
        </div>
        <div className="analysis-grid">
          <div className="analysis-block">
            <h3>Summary</h3>
            <p>{update.summary || notReviewed}</p>
          </div>
          <div className="analysis-block">
            <h3>Business impact</h3>
            <p className={update.businessImpact ? '' : 'detail-empty'}>
              {update.businessImpact || notReviewed}
            </p>
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="source-title">
        <div className="detail-section__heading">
          <p className="section-kicker">Record provenance</p>
          <h2 id="source-title">Source &amp; Verification</h2>
        </div>
        <dl className="source-grid">
          <div className="detail-info-item">
            <dt>Verification status</dt>
            <dd>{update.verificationStatus || notReviewed}</dd>
          </div>
          <div className="detail-info-item">
            <dt>Source URL</dt>
            <dd>
              {update.sourceUrl ? (
                <a href={update.sourceUrl} target="_blank" rel="noreferrer">
                  {update.sourceUrl}
                </a>
              ) : (
                <span className="detail-empty">
                  Official source pending verification
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </article>
  )
}

export default RegulatoryUpdateDetail
