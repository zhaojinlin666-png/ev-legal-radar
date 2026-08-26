function LegalBasisDisclosure({ legalBasis = [] }) {
  return (
    <details className="legal-basis-disclosure">
      <summary>
        <span>LEGAL BASIS / 法律依据</span>
        <span>{legalBasis.length > 0 ? `${legalBasis.length} verified` : 'Not verified'}</span>
      </summary>
      {legalBasis.length > 0 ? (
        <div className="legal-basis-disclosure__content">
          {legalBasis.map((basis) => (
            <article key={`${basis.sourceUrl}-${basis.provision}`}>
              <div>
                <strong>{basis.sourceTitle}</strong>
                <span>{basis.provision}</span>
              </div>
              <p>{basis.excerpt}</p>
              <small>
                {basis.excerptType} · {basis.verificationStatus} · {basis.sourceAuthority}
              </small>
              <a href={basis.sourceUrl} target="_blank" rel="noreferrer">
                View official source
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="legal-basis-disclosure__empty">
          Legal basis not independently verified
        </p>
      )}
    </details>
  )
}

export default LegalBasisDisclosure
