import ResultBadge from './ResultBadge.jsx'
import VerificationBadge from './VerificationBadge.jsx'

function ReviewResultItem({ result, index }) {
  return (
    <article className="review-result-item">
      <div className="review-result-row">
        <div className="review-result-cell review-result-cell--item">
          <span className="review-result-cell__label">Review Item</span>
          <p className="review-result-item__number">
            Item {String(index + 1).padStart(2, '0')}
          </p>
          <h3>{result.reviewItem}</h3>
          {result.potentialGap ? (
            <span className="potential-gap-label">Potential Gap</span>
          ) : null}
        </div>
        <div className="review-result-cell">
          <span className="review-result-cell__label">Result</span>
          <ResultBadge result={result.result} />
        </div>
        <div className="review-result-cell">
          <span className="review-result-cell__label">Evidence</span>
          <p>{result.evidence}</p>
        </div>
        <div className="review-result-cell">
          <span className="review-result-cell__label">Observation</span>
          <p>{result.observation}</p>
        </div>
      </div>

      {result.potentialGap ? (
        <details className="potential-gap-detail">
          <summary>
            <span>Potential Gap</span>
            <span>Review details</span>
          </summary>
          <dl>
            <div>
              <dt>Legal Basis</dt>
              <dd>{result.potentialGap.legalBasis}</dd>
            </div>
            <div>
              <dt>Verification Status</dt>
              <dd>
                <VerificationBadge
                  status={result.potentialGap.verificationStatus}
                />
              </dd>
            </div>
            <div className="potential-gap-detail__wide">
              <dt>AI Observation</dt>
              <dd>{result.observation}</dd>
            </div>
            <div className="potential-gap-detail__wide">
              <dt>Recommended Review Action</dt>
              <dd>{result.potentialGap.recommendedReviewAction}</dd>
            </div>
          </dl>
        </details>
      ) : null}
    </article>
  )
}

export default ReviewResultItem
