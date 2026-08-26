import RegulatoryStatusBadge from './RegulatoryStatusBadge.jsx'
import { canRequestPreliminaryImpactAnalysis } from '../utils/regulatoryImpactWorkflow.js'

function getActionLabel(status) {
  if (status === 'Analysis failed' || status === 'Further Review Required') {
    return 'Retry Preliminary Impact Analysis / 重试初步影响分析'
  }

  return 'Run Preliminary Impact Analysis / 运行初步影响分析'
}

function PreliminaryImpactAnalysisPanel({ event, onRunAnalysis }) {
  const status = event.analysisStatus || 'Unreviewed'
  const isAnalyzing = status === 'Analyzing'
  const canRun = canRequestPreliminaryImpactAnalysis(event)

  return (
    <section
      className={`preliminary-impact-action preliminary-impact-action--${status
        .toLowerCase()
        .replaceAll(' ', '-')}`}
      aria-labelledby="preliminary-impact-action-title"
    >
      <div>
        <p className="section-kicker">User-triggered AI assistance</p>
        <h2 id="preliminary-impact-action-title">
          Preliminary Impact Analysis / 初步影响分析
        </h2>
        <p>
          The server will retrieve this detected item’s official-source content
          and produce a grounded preliminary workflow assessment. It does not
          run automatically, verify the event, or determine legal compliance.
        </p>
        <div className="preliminary-impact-action__status">
          <span>Analysis status</span>
          <RegulatoryStatusBadge status={status} />
        </div>
        {event.analysisError ? (
          <p className="preliminary-impact-action__error" role="alert">
            {event.analysisError}
          </p>
        ) : null}
      </div>

      {canRun || isAnalyzing ? (
        <button
          type="button"
          onClick={() => onRunAnalysis(event)}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing official source…' : getActionLabel(status)}
        </button>
      ) : null}
    </section>
  )
}

export default PreliminaryImpactAnalysisPanel
