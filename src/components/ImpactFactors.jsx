import HumanReviewControls from './HumanReviewControls.jsx'
import LegalBasisDisclosure from './LegalBasisDisclosure.jsx'
import { PRELIMINARY_IMPACT_DISCLAIMER } from '../../shared/regulatoryImpactContract.js'

function ImpactFactors({ assessment, reviewRecords, onHumanReviewChange }) {
  const impactLabel =
    assessment.level === 'High'
      ? '高影响'
      : assessment.level === 'Medium'
        ? '中等影响'
        : assessment.level === 'Low'
          ? '低影响'
          : '需进一步审查'

  return (
    <section className="impact-factors" aria-labelledby="impact-factors-title">
      <div className="impact-factors__heading">
        <div>
          <p className="section-kicker">Explainable prioritization</p>
          <h3 id="impact-factors-title">
            Why this is {assessment.level} Impact / 为什么被评为{impactLabel}
          </h3>
        </div>
        <strong className="human-review-required">HUMAN REVIEW REQUIRED</strong>
      </div>

      <div className="impact-factor-list">
        {assessment.factors.map((factor, index) => {
          const reviewKey = `impact-factor:${index}`

          return (
            <article key={`${factor.factor}-${index}`}>
              <div className="impact-factor-list__label">
                <span className={`grounding-label grounding-label--${factor.evidenceType.toLowerCase()}`}>
                  {factor.evidenceType}
                </span>
                <h4>{factor.factor}</h4>
              </div>
              <HumanReviewControls
                reviewKey={reviewKey}
                originalText={factor.assessment}
                record={reviewRecords[reviewKey]}
                onChange={onHumanReviewChange}
              />
              <LegalBasisDisclosure legalBasis={factor.legalBasis} />
            </article>
          )
        })}
      </div>
      <p className="impact-factor-disclaimer">
        {PRELIMINARY_IMPACT_DISCLAIMER}
      </p>
    </section>
  )
}

export default ImpactFactors
