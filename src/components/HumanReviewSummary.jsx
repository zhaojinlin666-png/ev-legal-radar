import { summarizeHumanReviewRecords } from '../utils/humanReview.js'

function HumanReviewSummary({ reviewKeys, records }) {
  const summary = summarizeHumanReviewRecords(reviewKeys, records)

  return (
    <section className="human-review-summary" aria-labelledby="human-review-summary-title">
      <div>
        <p className="section-kicker">Browser-local governance</p>
        <h2 id="human-review-summary-title">Human Review Summary / 人工复核概览</h2>
        <small>
          Accept marks an item as human-reviewed only; it does not make the item legally verified.
        </small>
      </div>
      <dl>
        {['Unreviewed', 'Accepted', 'Edited', 'Rejected'].map((status) => (
          <div key={status}>
            <dt>{status}</dt>
            <dd>{summary[status]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default HumanReviewSummary
