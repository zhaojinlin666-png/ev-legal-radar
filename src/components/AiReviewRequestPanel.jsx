function AiReviewRequestPanel({
  hasDocument,
  isLoading,
  errorMessage,
  isComplete,
  onRequestReview,
}) {
  return (
    <section className="ai-review-request" aria-labelledby="ai-review-title">
      <div>
        <p className="section-kicker">Local backend proxy</p>
        <h2 id="ai-review-title">AI-assisted Review</h2>
        <p>
          The prototype will send the selected document text, review rules, and
          verified legal source metadata through the local backend to OpenAI.
        </p>
      </div>

      <button
        type="button"
        className="ai-review-request__button"
        disabled={!hasDocument || isLoading}
        onClick={onRequestReview}
      >
        {isLoading ? 'Requesting review…' : 'Run AI-assisted Review'}
      </button>

      {!hasDocument ? (
        <p className="ai-review-request__note">
          Upload a TXT document before requesting an AI-assisted review.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="ai-review-request__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {isComplete ? (
        <p className="ai-review-request__success" role="status">
          AI-assisted preliminary review completed. Results are shown below.
        </p>
      ) : null}
    </section>
  )
}

export default AiReviewRequestPanel
