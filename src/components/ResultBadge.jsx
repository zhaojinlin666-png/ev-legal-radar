const resultClassNames = {
  Found: 'result-badge--found',
  'Not identified': 'result-badge--not-identified',
  'Further review required': 'result-badge--further-review',
  'Potential Gap': 'result-badge--not-identified',
  'Further Review Required': 'result-badge--further-review',
}

function ResultBadge({ result }) {
  const fixedResult = resultClassNames[result]
    ? result
    : 'Further review required'

  return (
    <span className={`result-badge ${resultClassNames[fixedResult]}`}>
      <span className="result-badge__dot" aria-hidden="true" />
      {fixedResult}
    </span>
  )
}

export default ResultBadge
