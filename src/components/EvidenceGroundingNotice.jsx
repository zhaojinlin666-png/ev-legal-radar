function EvidenceGroundingNotice({ grounding }) {
  if (!grounding) return null

  const isVerified = grounding.status === 'verified'
  const message = isVerified
    ? 'Every displayed quotation was verified against the retrieved official-source text.'
    : grounding.status === 'partially_verified'
      ? 'Some model-suggested quotations could not be verified and were excluded. Findings that relied only on excluded evidence were also removed.'
      : 'No model-suggested quotation could be retained as verified official-source evidence. Impact analysis was downgraded for human review.'

  return (
    <div
      className={`evidence-grounding-notice evidence-grounding-notice--${grounding.status}`}
    >
      <div>
        <strong>Evidence grounding / 证据核验</strong>
        <span>{grounding.status.replaceAll('_', ' ')}</span>
      </div>
      <p>{message}</p>
      <small>
        Verified quotations: {grounding.verifiedEvidenceCount} · Excluded
        quotations: {grounding.rejectedEvidenceCount}
      </small>
    </div>
  )
}

export default EvidenceGroundingNotice
