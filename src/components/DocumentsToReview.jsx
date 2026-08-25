function DocumentsToReview({ documents }) {
  return (
    <section className="documents-to-review" aria-label="Documents to review">
      <div className="review-subsection-heading">
        <h4>Documents / Evidence to Review</h4>
        <span>待核查材料</span>
      </div>
      <ul className="review-checklist review-checklist--documents">
        {documents.map((document) => (
          <li key={document}>
            <span className="review-checkbox" aria-hidden="true" />
            <span>{document}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default DocumentsToReview
