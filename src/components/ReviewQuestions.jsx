function ReviewQuestions({ questions }) {
  return (
    <section className="review-questions" aria-label="Review Questions">
      <div className="review-subsection-heading">
        <h4>Review Questions</h4>
        <span>待核查问题</span>
      </div>
      <ul className="review-checklist review-checklist--questions">
        {questions.map((question) => (
          <li key={question}>
            <span className="review-checkbox" aria-hidden="true" />
            <span>{question}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ReviewQuestions
