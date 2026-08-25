import LegalReviewItem from './LegalReviewItem.jsx'

function LegalReviewWorkspace({ items, onReviewDemoDocument }) {
  const stats = [
    {
      label: 'Total Requirements',
      value: items.length,
    },
    {
      label: 'High Priority',
      value: items.filter((item) => item.priority === 'High').length,
    },
    {
      label: 'Further Information Required',
      value: items.filter(
        (item) => item.reviewStatus === 'Further information required',
      ).length,
    },
    {
      label: 'Human Reviewed',
      value: items.filter(
        (item) => item.verificationStatus === 'Human-reviewed',
      ).length,
    },
  ]

  return (
    <section
      className="detail-section legal-review-workspace"
      aria-labelledby="legal-review-workspace-title"
    >
      <div className="detail-section__heading legal-review-workspace__heading">
        <div>
          <p className="section-kicker">Preliminary legal review</p>
          <h2 id="legal-review-workspace-title">Legal Review Workspace</h2>
        </div>
        <p>Structure regulatory requirements for preliminary factual review.</p>
      </div>

      <p className="legal-review-disclaimer">
        AI-assisted preliminary review. Regulatory interpretation and
        compliance conclusions require human legal verification.
      </p>

      <dl className="legal-review-stats" aria-label="Legal review summary">
        {stats.map((stat) => (
          <div className="legal-review-stat" key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {items.length > 0 ? (
        <div className="legal-review-list">
          {items.map((item, index) => (
            <LegalReviewItem
              item={item}
              index={index}
              key={item.requirement}
              onReviewDemoDocument={onReviewDemoDocument}
            />
          ))}
        </div>
      ) : (
        <div className="legal-review-workspace__empty">
          <p>Legal review requirements not yet reviewed</p>
        </div>
      )}
    </section>
  )
}

export default LegalReviewWorkspace
