function LegalSource({ source, onReviewDemoDocument }) {
  return (
    <section className="legal-source" aria-label="Legal Source">
      <div className="legal-source__header">
        <div>
          <p>Legal Source</p>
          <h4>{source.title}</h4>
        </div>
        <div className="legal-source__actions">
          <button
            type="button"
            className="legal-source__demo-button"
            onClick={onReviewDemoDocument}
          >
            Review Demo Document
          </button>
          <a
            className="legal-source__link"
            href={source.officialSource}
            target="_blank"
            rel="noreferrer"
          >
            View Official Source
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>

      <dl className="legal-source__details">
        <div>
          <dt>Article</dt>
          <dd>{source.article}</dd>
        </div>
        <div>
          <dt>Effective Date</dt>
          <dd>
            <time dateTime={source.effectiveDate}>{source.effectiveDate}</time>
          </dd>
        </div>
        <div className="legal-source__authorities">
          <dt>Issuing Authorities</dt>
          <dd>{source.issuingAuthorities}</dd>
        </div>
      </dl>
    </section>
  )
}

export default LegalSource
