import ImpactAssessmentSummary from './ImpactAssessmentSummary.jsx'
import LegalAuthorityPanel from './LegalAuthorityPanel.jsx'
import PreliminaryImpactAnalysisPanel from './PreliminaryImpactAnalysisPanel.jsx'
import RegulatoryStatusBadge from './RegulatoryStatusBadge.jsx'
import ReviewTaskList from './ReviewTaskList.jsx'
import RiskBadge from './RiskBadge.jsx'
import WorkflowProgress from './WorkflowProgress.jsx'

function TagList({ items, emptyMessage }) {
  if (items.length === 0) {
    return <p className="radar-detail-empty">{emptyMessage}</p>
  }

  return (
    <div className="radar-detail-tags">
      {items.map((item) => (
        <span className="taxonomy-tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  )
}

function GroundingLabel({ type }) {
  return (
    <span className={`grounding-label grounding-label--${type.toLowerCase()}`}>
      {type}
    </span>
  )
}

function RegulatoryChangeDetail({
  event,
  highlightedTaskId,
  taskProgress,
  onBack,
  onStatusChange,
  onToggleQuestion,
  onReviewDocument,
  onRunPreliminaryImpactAnalysis,
}) {
  const impactAnalysis = event.impactAnalysis
  const hasImpactAnalysis = Boolean(impactAnalysis)

  return (
    <article className="change-event-detail" aria-labelledby="change-detail-title">
      <button type="button" className="detail-back" onClick={onBack}>
        <span aria-hidden="true">←</span>
        Back to Regulatory Update Radar
      </button>

      <header className="detail-hero change-event-detail__hero">
        <div className="detail-hero__eyebrow">
          <span className="jurisdiction-tag">{event.jurisdiction}</span>
          <span>{event.changeType}</span>
          {event.demoLabel ? (
            <span className="demo-data-label">{event.demoLabel}</span>
          ) : null}
          {event.detectionStatus ? (
            <RegulatoryStatusBadge status={event.detectionStatus} />
          ) : null}
        </div>
        <h1 id="change-detail-title">{event.title}</h1>
        <div className="detail-hero__status">
          {event.preliminaryImpactLevel ? (
            <RiskBadge level={event.preliminaryImpactLevel} label="impact" />
          ) : (
            <span className="not-assessed-badge">Impact not assessed</span>
          )}
          <RegulatoryStatusBadge status={event.verificationStatus} />
        </div>
      </header>

      <WorkflowProgress
        currentStage={event.generatedReviewTasks.length > 0 ? 'review-task' : 'impact'}
      />

      {event.eventKind === 'source-detected-review' ? (
        <PreliminaryImpactAnalysisPanel
          event={event}
          onRunAnalysis={onRunPreliminaryImpactAnalysis}
        />
      ) : null}

      <ImpactAssessmentSummary event={event} />

      <section className="detail-section" aria-labelledby="what-changed-title">
        <div className="detail-section__heading">
          <p className="section-kicker">Change comparison</p>
          <h2 id="what-changed-title">What Changed / 发生了什么变化</h2>
        </div>
        <div className="change-comparison-grid">
          <div>
            <h3>
              Before / Previous Understanding
            </h3>
            {hasImpactAnalysis ? (
              <>
                <p className="detail-empty">
                  No verified previous-state comparison was supplied.
                </p>
                <div className="source-backed-change">
                  <GroundingLabel type="FACT" />
                  <strong>Source-backed change</strong>
                  <p>{event.changeSummary.sourceBackedChange}</p>
                </div>
              </>
            ) : (
              <p className="detail-empty">
                {event.changeSummary.previousUnderstanding ||
                  'No change comparison has been prepared.'}
              </p>
            )}
          </div>
          <div>
            <h3>
              After / New Requirement
              {hasImpactAnalysis ? <GroundingLabel type="FACT" /> : null}
            </h3>
            <p className={event.changeSummary.newRequirement ? '' : 'detail-empty'}>
              {event.changeSummary.newRequirement ||
                'The detected source has not yet been legally reviewed.'}
            </p>
          </div>
          <div>
            <h3>
              Why It Matters
              {hasImpactAnalysis ? <GroundingLabel type="INFERENCE" /> : null}
            </h3>
            <p className={event.changeSummary.whyItMatters ? '' : 'detail-empty'}>
              {event.changeSummary.whyItMatters ||
                'Preliminary legal impact has not been assessed.'}
            </p>
          </div>
        </div>
      </section>

      <section
        className="detail-section"
        aria-labelledby="affected-activities-title"
      >
        <div className="detail-section__heading">
          <p className="section-kicker">Activity mapping</p>
          <h2 id="affected-activities-title">
            Potentially Affected Activities / 潜在受影响业务活动
          </h2>
        </div>
        {event.affectedActivityDetails?.length > 0 ? (
          <div className="impact-detail-grid">
            {event.affectedActivityDetails.map((item) => (
              <article key={item.activity}>
                <div>
                  <GroundingLabel type="INFERENCE" />
                  <h3>{item.activity}</h3>
                </div>
                <p>{item.reason}</p>
              </article>
            ))}
          </div>
        ) : (
          <TagList
            items={event.potentiallyAffectedActivities}
            emptyMessage="Potentially affected activities have not been reviewed for this event."
          />
        )}
      </section>

      <section
        className="detail-section"
        aria-labelledby="documents-review-title"
      >
        <div className="detail-section__heading">
          <p className="section-kicker">Suggested review targets</p>
          <h2 id="documents-review-title">
            Documents / Evidence to Review / 建议核查材料
          </h2>
        </div>
        {event.documentReviewDetails?.length > 0 ? (
          <ul className="radar-document-list">
            {event.documentReviewDetails.map((document) => (
              <li key={document.documentName}>
                <span aria-hidden="true" />
                <div>
                  <strong>
                    <GroundingLabel type="INFERENCE" /> Suggested document to
                    review
                  </strong>
                  <p>{document.documentName}</p>
                  <small>{document.reason}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : event.documentsToReview.length > 0 ? (
          <ul className="radar-document-list">
            {event.documentsToReview.map((document) => (
              <li key={document}>
                <span aria-hidden="true" />
                <div>
                  <strong>Suggested document to review</strong>
                  <p>{document}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="radar-detail-empty">
            Suggested documents have not been reviewed for this event.
          </p>
        )}
      </section>

      <section
        className="detail-section"
        aria-labelledby="preliminary-impact-title"
      >
        <div className="detail-section__heading">
          <p className="section-kicker">Human review required</p>
          <h2 id="preliminary-impact-title">
            Preliminary Legal Impact / 初步法律影响
          </h2>
        </div>
        {impactAnalysis ? (
          <div className="preliminary-impact-note">
            <RiskBadge level={event.preliminaryImpactLevel} label="priority" />
            <div className="preliminary-impact-note__analysis">
              <GroundingLabel type="INFERENCE" />
              <p>{impactAnalysis.preliminaryImpact.reasoning}</p>
            </div>
            <dl className="preliminary-impact-metadata">
              <div>
                <dt>Confidence</dt>
                <dd>{impactAnalysis.preliminaryImpact.confidence}</dd>
              </div>
              <div>
                <dt>Analysis method</dt>
                <dd>{impactAnalysis.analysisMethod}</dd>
              </div>
            </dl>
            <strong className="human-review-required">
              HUMAN REVIEW REQUIRED
            </strong>

            <section className="source-evidence-panel" aria-labelledby="source-evidence-title">
              <div>
                <GroundingLabel type="FACT" />
                <h3 id="source-evidence-title">Official-source evidence</h3>
              </div>
              {impactAnalysis.sourceEvidence.length > 0 ? (
                <ul>
                  {impactAnalysis.sourceEvidence.map((evidence) => (
                    <li key={evidence.evidenceId}>
                      <q>{evidence.quotation}</q>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="detail-empty">
                  No exact supporting passage was available. Further human
                  review is required.
                </p>
              )}
            </section>

            <section className="impact-legal-authority" aria-labelledby="impact-authority-title">
              <div className="impact-legal-authority__heading">
                <h3 id="impact-authority-title">
                  Verified Legal Authority used for analysis
                </h3>
                <span>Local verified knowledge base only</span>
              </div>
              <LegalAuthorityPanel
                authorities={impactAnalysis.legalAuthorities}
                status={impactAnalysis.legalAuthorityStatus}
              />
            </section>

            <small>
              Impact level is a workflow priority indicator, not a legal
              conclusion. The event remains unreviewed until verified by a
              legal professional.
            </small>
          </div>
        ) : event.preliminaryImpactLevel && event.changeSummary.whyItMatters ? (
          <div className="preliminary-impact-note">
            <RiskBadge level={event.preliminaryImpactLevel} label="priority" />
            <p>{event.changeSummary.whyItMatters}</p>
            <small>
              Impact level is a workflow priority indicator, not a legal
              conclusion. Human legal review required:{' '}
              {event.requiresHumanReview ? 'Yes' : 'No'}.
            </small>
          </div>
        ) : (
          <p className="radar-detail-empty">
            No preliminary impact assessment has been prepared. Human legal
            review is required before assigning an impact level.
          </p>
        )}
      </section>

      <section className="detail-section" aria-labelledby="review-tasks-title">
        <div className="detail-section__heading">
          <p className="section-kicker">Local workflow</p>
          <h2 id="review-tasks-title">
            Generated Review Tasks / 建议审查任务
          </h2>
        </div>
        <ReviewTaskList
          tasks={event.generatedReviewTasks}
          highlightedTaskId={highlightedTaskId}
          progress={taskProgress}
          onStatusChange={onStatusChange}
          onToggleQuestion={onToggleQuestion}
          onReviewDocument={onReviewDocument}
        />
      </section>

      <section className="detail-section" aria-labelledby="change-source-title">
        <div className="detail-section__heading">
          <p className="section-kicker">Record provenance</p>
          <h2 id="change-source-title">
            Official Source for Regulatory Event / 监管事件官方来源
          </h2>
        </div>
        <dl className="source-grid">
          <div className="detail-info-item">
            <dt>Source title</dt>
            <dd>{event.sourceTitle}</dd>
          </div>
          <div className="detail-info-item">
            <dt>Verification status</dt>
            <dd>
              <RegulatoryStatusBadge status={event.verificationStatus} />
            </dd>
          </div>
          {event.analysisStatus ? (
            <div className="detail-info-item">
              <dt>Preliminary analysis status</dt>
              <dd>
                <RegulatoryStatusBadge status={event.analysisStatus} />
              </dd>
            </div>
          ) : null}
          {event.matchedKeywords?.length > 0 ? (
            <div className="detail-info-item detail-info-item--wide">
              <dt>Source-detection keywords</dt>
              <dd className="radar-detail-tags">
                {event.matchedKeywords.map((keyword) => (
                  <span className="taxonomy-tag" key={keyword}>
                    {keyword}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          <div className="detail-info-item detail-info-item--wide">
            <dt>Official source</dt>
            <dd>
              {event.sourceUrl ? (
                <a href={event.sourceUrl} target="_blank" rel="noreferrer">
                  View official source
                </a>
              ) : (
                <span className="detail-empty">
                  Official source not available in current project data.
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </article>
  )
}

export default RegulatoryChangeDetail
