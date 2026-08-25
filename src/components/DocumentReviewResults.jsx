import RuleReviewResultCard from './RuleReviewResultCard.jsx'

function DocumentReviewResults({ results }) {
  const isAiAssisted =
    results[0]?.analysisMethod === 'AI-assisted preliminary review'
  const stats = [
    {
      label: '审查项目总数',
      value: results.length,
    },
    {
      label: '发现',
      value: results.filter((result) => result.status === 'Found').length,
    },
    {
      label: '潜在缺口',
      value: results.filter((result) => result.status === 'Potential Gap')
        .length,
    },
    {
      label: '需要进一步审查',
      value: results.filter(
        (result) => result.status === 'Further Review Required',
      ).length,
    },
  ]

  return (
    <section
      className="rule-review-results"
      aria-labelledby="rule-review-results-title"
    >
      <header className="rule-review-results__header">
        <p className="section-kicker">
          {isAiAssisted
            ? 'AI-assisted preliminary review'
            : 'Rule-based preliminary review'}
        </p>
        <h2 id="rule-review-results-title">初步审查结果</h2>
        <p className="rule-review-results__disclaimer">
          {isAiAssisted
            ? '本结果由 AI 根据上传文本、既有审查规则和已提供的法律来源生成，仅用于初步法律研究，不构成法律意见。所有结果均需要法律专业人员结合完整业务场景进一步复核。'
            : '本结果由规则驱动的文本匹配生成，仅用于演示和初步法律研究，不构成法律意见。未识别到相关表述并不当然意味着不合规，建议由法律专业人员结合完整业务场景进一步复核。'}
        </p>
        <p className="rule-review-confidence-note">
          Confidence 仅表示当前初步文本分析的把握程度，不代表合规概率。
        </p>
      </header>

      <dl className="rule-review-stats" aria-label="初步审查结果统计">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rule-review-result-list">
        {results.map((result, index) => (
          <RuleReviewResultCard
            result={result}
            index={index}
            key={result.ruleId}
          />
        ))}
      </div>
    </section>
  )
}

export default DocumentReviewResults
