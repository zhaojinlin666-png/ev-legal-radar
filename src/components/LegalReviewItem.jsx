import DocumentsToReview from './DocumentsToReview.jsx'
import LegalSource from './LegalSource.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import ReviewQuestions from './ReviewQuestions.jsx'
import ReviewStatusBadge from './ReviewStatusBadge.jsx'
import VerificationBadge from './VerificationBadge.jsx'

function LegalReviewItem({ item, index, onReviewDemoDocument }) {
  return (
    <article className="legal-review-item">
      <header className="legal-review-item__header">
        <div>
          <p className="legal-review-item__number">
            Requirement {String(index + 1).padStart(2, '0')}
            <span>Regulatory Requirement</span>
          </p>
          <h3>{item.requirement}</h3>
        </div>
        <div className="legal-review-item__badges">
          <div className="review-badge-field">
            <span>Priority</span>
            <PriorityBadge priority={item.priority} />
          </div>
          <div className="review-badge-field">
            <span>Review Status</span>
            <ReviewStatusBadge status={item.reviewStatus} />
          </div>
          <div className="review-badge-field">
            <span>Verification Status</span>
            <VerificationBadge status={item.verificationStatus} />
          </div>
        </div>
      </header>

      <div className="legal-review-item__content">
        <section className="affected-activities">
          <div className="review-subsection-heading">
            <h4>Potentially Affected Activities</h4>
            <span>潜在受影响业务活动</span>
          </div>
          <ul>
            {item.affectedActivities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
        </section>

        {item.legalSource ? (
          <LegalSource
            source={item.legalSource}
            onReviewDemoDocument={onReviewDemoDocument}
          />
        ) : null}

        <ReviewQuestions questions={item.reviewQuestions} />
        <DocumentsToReview documents={item.documentsToReview} />

        <dl className="review-notes-grid">
          <div>
            <dt>Preliminary Observation</dt>
            <dd className={item.preliminaryObservation ? '' : 'detail-empty'}>
              {item.preliminaryObservation ||
                'No preliminary observation recorded.'}
            </dd>
          </div>
          <div>
            <dt>Suggested Legal Action</dt>
            <dd>{item.suggestedLegalAction}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}

export default LegalReviewItem
