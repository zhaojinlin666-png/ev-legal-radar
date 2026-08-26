import PriorityBadge from './PriorityBadge.jsx'
import ResultBadge from './ResultBadge.jsx'
import LegalAuthorityPanel from './LegalAuthorityPanel.jsx'

function RuleReviewResultCard({ result, index }) {
  const isPotentialGap = result.status === 'Potential Gap'
  const isAiAssisted =
    result.analysisMethod === 'AI-assisted preliminary review'
  return (
    <article
      className={`rule-review-result-card ${
        isPotentialGap ? 'rule-review-result-card--potential-gap' : ''
      } ${isAiAssisted ? 'rule-review-result-card--ai' : ''}`}
    >
      <header className="rule-review-result-card__header">
        <div>
          <p>
            {isAiAssisted ? '审查事项' : '审查项目'}{' '}
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3>{result.title}</h3>
        </div>
        <div className="rule-review-result-card__badges">
          <div>
            <span>{isAiAssisted ? '审查结果' : 'Result'}</span>
            <ResultBadge result={result.status} />
          </div>
          <div>
            <span>{isAiAssisted ? '风险等级' : 'Review Priority'}</span>
            <PriorityBadge priority={result.riskLevel} />
          </div>
        </div>
      </header>

      <dl className="rule-review-result-card__details">
        {isAiAssisted ? (
          <div className="rule-review-detail--wide rule-review-issue-summary">
            <dt>问题摘要</dt>
            <dd>{result.issueSummary}</dd>
          </div>
        ) : null}
        <div className="rule-review-detail--wide rule-review-section rule-review-section--evidence">
          <dt>Document Evidence / 文档原文证据</dt>
          <dd className="rule-review-evidence">{result.evidence}</dd>
        </div>
        <div className="rule-review-detail--wide rule-review-section rule-review-section--authority">
          <dt>Legal Authority / 法律权威</dt>
          <dd>
            <LegalAuthorityPanel
              authorities={result.legalAuthorities}
              status={result.legalAuthorityStatus}
            />
          </dd>
        </div>
        <div className="rule-review-section rule-review-section--analysis">
          <dt>
            {isAiAssisted
              ? 'AI Analysis / AI 初步分析'
              : 'Preliminary Analysis / 初步分析'}
          </dt>
          <dd>{result.observation}</dd>
        </div>
        <div className="rule-review-section rule-review-section--analysis">
          <dt>{isAiAssisted ? '风险说明' : 'Review Note / 审查说明'}</dt>
          <dd>{result.riskReason}</dd>
        </div>
        <div className="rule-review-section rule-review-section--recommendation">
          <dt>{isAiAssisted ? '建议修改' : 'Suggested Revision / 建议修改'}</dt>
          <dd>{result.suggestedRevision}</dd>
        </div>
        <div className="rule-review-section rule-review-section--recommendation">
          <dt>{isAiAssisted ? '下一步核查' : 'Next Step / 下一步核查'}</dt>
          <dd>{result.suggestedNextStep}</dd>
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
