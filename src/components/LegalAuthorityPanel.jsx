import { LEGAL_SOURCE_NOT_VERIFIED } from '../data/legalKnowledgeBase.js'

function LegalAuthorityPanel({ authorities, status }) {
  if (status === LEGAL_SOURCE_NOT_VERIFIED || authorities.length === 0) {
    return (
      <div className="legal-authority-empty">
        <strong>{LEGAL_SOURCE_NOT_VERIFIED}</strong>
        <span>
          当前本地知识库尚无足够具体且已核验的条文映射；不得由模型补写引用。
        </span>
      </div>
    )
  }

  return (
    <div className="legal-authority-list">
      {authorities.map((authority) => (
        <article
          className="legal-authority-card"
          key={authority.provisionId}
        >
          <div className="legal-authority-card__heading">
            <div>
              <strong>《{authority.lawName}》</strong>
              <span>{authority.article}</span>
            </div>
            <span className="legal-authority-badge">
              Verified local knowledge base
            </span>
          </div>
          <p>{authority.requirementSummary}</p>
          <dl>
            <div>
              <dt>Jurisdiction</dt>
              <dd>{authority.jurisdiction}</dd>
            </div>
            <div>
              <dt>Issuing authority</dt>
              <dd>{authority.sourceAuthority}</dd>
            </div>
            <div>
              <dt>Verification status</dt>
              <dd>{authority.verificationStatus}</dd>
            </div>
          </dl>
          <a
            href={authority.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Official Source
          </a>
        </article>
      ))}
    </div>
  )
}

export default LegalAuthorityPanel
