import PriorityBadge from './PriorityBadge.jsx'
import ResultBadge from './ResultBadge.jsx'

function RuleReviewResultCard({ result, index }) {
  const isPotentialGap = result.status === 'Potential Gap'

  return (
    <article
      className={`rule-review-result-card ${
        isPotentialGap ? 'rule-review-result-card--potential-gap' : ''
      }`}
    >
      <header className="rule-review-result-card__header">
        <div>
          <p>
            审查项目 {String(index + 1).padStart(2, '0')}
          </p>
          <h3>{result.title}</h3>
        </div>
        <div className="rule-review-result-card__badges">
          <div>
            <span>Result</span>
            <ResultBadge result={result.status} />
          </div>
          <div>
            <span>Review Priority</span>
            <PriorityBadge priority={result.riskLevel} />
          </div>
        </div>
      </header>

      <dl className="rule-review-result-card__details">
        <div>
          <dt>Evidence / 匹配证据</dt>
          <dd className="rule-review-evidence">{result.evidence}</dd>
        </div>
        <div>
          <dt>Preliminary Observation / 初步观察</dt>
          <dd>{result.observation}</dd>
        </div>
        <div>
          <dt>Legal Basis / 法律依据</dt>
          <dd>
            {result.legalBasis} {result.legalArticle}
          </dd>
        </div>
        <div>
          <dt>Analysis Method / 分析方式</dt>
          <dd>{result.analysisMethod}</dd>
        </div>
        <div>
          <dt>Confidence / 匹配置信度</dt>
          <dd>{result.confidence}</dd>
        </div>
        <div>
          <dt>Human Review Required / 需要人工复核</dt>
          <dd>{result.requiresHumanReview ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </article>
  )
}

export default RuleReviewResultCard
