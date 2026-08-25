const reviewModes = [
  {
    id: 'rule-based',
    title: 'Rule-based Review',
    description: 'Local keyword and text-pattern based preliminary review.',
  },
  {
    id: 'ai-assisted',
    title: 'AI-assisted Review',
    description:
      'Semantic analysis against source-verified regulatory requirements.',
  },
]

function ReviewModeSelector({ activeMode, onModeChange }) {
  return (
    <section className="review-mode-selector" aria-labelledby="review-mode-title">
      <div className="review-mode-selector__heading">
        <p className="section-kicker">Analysis configuration</p>
        <h2 id="review-mode-title">Review Mode</h2>
      </div>

      <div className="review-mode-options" role="radiogroup">
        {reviewModes.map((mode) => (
          <button
            type="button"
            role="radio"
            aria-checked={activeMode === mode.id}
            className={
              activeMode === mode.id ? 'review-mode-option--active' : ''
            }
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
          >
            <span className="review-mode-option__marker" aria-hidden="true" />
            <span>
              <strong>{mode.title}</strong>
              <small>{mode.description}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default ReviewModeSelector
