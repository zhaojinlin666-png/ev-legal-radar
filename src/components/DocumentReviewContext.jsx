function DocumentReviewContext({ context }) {
  return (
    <section
      className="document-review-context"
      aria-labelledby="document-review-context-title"
    >
      <div>
        <div>
          <p className="section-kicker">Linked review context</p>
          <h2 id="document-review-context-title">Review Context</h2>
        </div>
        {context.demoLabel ? (
          <span className="demo-data-label">{context.demoLabel}</span>
        ) : null}
      </div>
      <dl>
        <div>
          <dt>Related Regulation</dt>
          <dd>
            {context.relatedRegulationTitle ||
              'Not specified in current project data'}
          </dd>
        </div>
        <div>
          <dt>Regulatory Change / Event</dt>
          <dd>
            {context.regulatoryChangeEvent ||
              'Not linked to a regulatory change event'}
          </dd>
        </div>
        <div>
          <dt>Review Task</dt>
          <dd>{context.reviewTask || 'Not specified'}</dd>
        </div>
        <div>
          <dt>Legal Topic</dt>
          <dd>{context.legalTopic || 'Not specified'}</dd>
        </div>
        <div>
          <dt>Impact / Risk Level</dt>
          <dd>{context.impactRiskLevel || 'Not specified'}</dd>
        </div>
        <div>
          <dt>Suggested Document</dt>
          <dd>
            {context.suggestedDocumentType ||
              'Not specified in current project data'}
          </dd>
        </div>
      </dl>
      <p>
        Workflow metadata only. It is not used as document evidence or verified
        legal authority, and no document is selected or uploaded automatically.
      </p>
    </section>
  )
}

export default DocumentReviewContext
