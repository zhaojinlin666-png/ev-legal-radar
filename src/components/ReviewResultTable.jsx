import ReviewResultItem from './ReviewResultItem.jsx'

function ReviewResultTable({ results }) {
  return (
    <section className="document-review-section" aria-labelledby="results-title">
      <div className="document-review-section__heading">
        <p className="section-kicker">Preset analysis</p>
        <h2 id="results-title">Review Results</h2>
      </div>

      <div className="review-result-columns" aria-hidden="true">
        <span>Review Item</span>
        <span>Result</span>
        <span>Evidence</span>
        <span>Observation</span>
      </div>

      <div className="review-result-list">
        {results.map((result, index) => (
          <ReviewResultItem
            result={result}
            index={index}
            key={result.reviewItem}
          />
        ))}
      </div>
    </section>
  )
}

export default ReviewResultTable
