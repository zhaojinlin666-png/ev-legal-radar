import ImpactAssessmentSummary from './ImpactAssessmentSummary.jsx'
import HumanReviewControls from './HumanReviewControls.jsx'
import HumanReviewSummary from './HumanReviewSummary.jsx'
import ImpactFactors from './ImpactFactors.jsx'
import LegalBasisDisclosure from './LegalBasisDisclosure.jsx'
import LegalAuthorityPanel from './LegalAuthorityPanel.jsx'
import PreliminaryImpactAnalysisPanel from './PreliminaryImpactAnalysisPanel.jsx'
import RegulatoryStatusBadge from './RegulatoryStatusBadge.jsx'
import ReviewTaskList from './ReviewTaskList.jsx'
import RiskBadge from './RiskBadge.jsx'
import WorkflowProgress from './WorkflowProgress.jsx'
import { getRegulatoryImpactReviewKeys } from '../utils/humanReview.js'
import { getRegulatoryChangePresentation } from '../utils/regulatoryChangePresentation.js'

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
  humanReviewRecords = {},
  onHumanReviewChange,
}) {
  const impactAnalysis = event.impactAnalysis
  const hasImpactAnalysis = Boolean(impactAnalysis)
  const changePresentation = getRegulatoryChangePresentation(
    event.changeSummary,
  )
  const { hasVerifiedComparison } = changePresentation
  const humanReviewKeys = getRegulatoryImpactReviewKeys(event)

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

      {hasImpactAnalysis ? (
        <HumanReviewSummary
          reviewKeys={humanReviewKeys}
          records={humanReviewRecords}
        />
      ) : null}

      <section className="detail-section" aria-labelledby="what-changed-title">
        <div className="detail-section__heading">
          <p className="section-kicker">
            {hasVerifiedComparison ? 'Verified change comparison' : 'New source summary'}
          </p>
          <h2 id="what-changed-title">
            {changePresentation.title}
          </h2>
        </div>
        {!hasVerifiedComparison ? (
          <p className="change-version-notice">
            {changePresentation.notice}
          </p>
        ) : null}
        <div className="change-comparison-grid">
          {hasVerifiedComparison ? (
            <div>
              <h3>Previous Requirement <GroundingLabel type="FACT" /></h3>
              <p>{event.changeSummary.previousRequirement}</p>
            </div>
          ) : null}
          <div>
            <h3>
              {hasVerifiedComparison ? 'New Requirement' : 'Source-backed New Requirement'}
              {hasImpactAnalysis ? <GroundingLabel type="FACT" /> : null}
            </h3>
            {hasImpactAnalysis ? (
              <HumanReviewControls
                reviewKey="change:new-requirement"
                originalText={event.changeSummary.newRequirement}
                record={humanReviewRecords['change:new-requirement']}
                onChange={onHumanReviewChange}
              />
            ) : (
              <p className={event.changeSummary.newRequirement ? '' : 'detail-empty'}>
                {event.changeSummary.newRequirement ||
                  'The detected source has not yet been legally reviewed.'}
              </p>
            )}
            {hasImpactAnalysis ? (
              <LegalBasisDisclosure legalBasis={event.changeSummary.legalBasis} />
            ) : null}
          </div>
          <div>
            <h3>
              Preliminary Interpretation
              {hasImpactAnalysis ? <GroundingLabel type="INFERENCE" /> : null}
            </h3>
            {hasImpactAnalysis ? (
              <HumanReviewControls
                reviewKey="change:preliminary-interpretation"
                originalText={event.changeSummary.preliminaryInterpretation}
                record={humanReviewRecords['change:preliminary-interpretation']}
                onChange={onHumanReviewChange}
              />
            ) : (
              <p className={event.changeSummary.preliminaryInterpretation ? '' : 'detail-empty'}>
                {event.changeSummary.preliminaryInterpretation ||
                  'Preliminary interpretation has not been prepared.'}
              </p>
            )}
            {hasImpactAnalysis ? (
              <LegalBasisDisclosure legalBasis={event.changeSummary.legalBasis} />
            ) : null}
          </div>
          <div>
            <h3>Why It May Matter <GroundingLabel type="INFERENCE" /></h3>
            {hasImpactAnalysis ? (
              <HumanReviewControls
                reviewKey="change:why-it-matters"
                originalText={event.changeSummary.whyItMatters}
                record={humanReviewRecords['change:why-it-matters']}
                onChange={onHumanReviewChange}
              />
            ) : (
              <p className={event.changeSummary.whyItMatters ? '' : 'detail-empty'}>
                {event.changeSummary.whyItMatters ||
                  'Preliminary legal impact has not been assessed.'}
              </p>
            )}
            {hasImpactAnalysis ? (
              <LegalBasisDisclosure legalBasis={event.changeSummary.legalBasis} />
            ) : null}
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
            {event.affectedActivityDetails.map((item, index) => {
              const reviewKey = `affected-activity:${index}`

              return <article key={`${item.activity}-${index}`}>
                <div>
                  <GroundingLabel type="INFERENCE" />
                  <h3>{item.activity}</h3>
                </div>
                <HumanReviewControls
                  reviewKey={reviewKey}
                  originalText={item.reason}
                  record={humanReviewRecords[reviewKey]}
                  onChange={onHumanReviewChange}
                />
                <LegalBasisDisclosure legalBasis={item.legalBasis} />
              </article>
            })}
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
            {event.documentReviewDetails.map((document, index) => {
              const reviewKey = `suggested-document:${index}`

              return <li key={`${document.documentName}-${index}`}>
                <span aria-hidden="true" />
                <div>
                  <strong>
                    <GroundingLabel type="INFERENCE" /> Suggested document to
                    review
                  </strong>
                  <p>{document.documentName}</p>
                  <HumanReviewControls
                    reviewKey={reviewKey}
                    originalText={document.reason}
                    record={humanReviewRecords[reviewKey]}
                    onChange={onHumanReviewChange}
                  />
                  <LegalBasisDisclosure legalBasis={document.legalBasis} />
                </div>
              </li>
            })}
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
              <HumanReviewControls
                reviewKey="impact:rationale"
                originalText={impactAnalysis.impactAssessment.rationale}
                record={humanReviewRecords['impact:rationale']}
                onChange={onHumanReviewChange}
              />
              <LegalBasisDisclosure
                legalBasis={impactAnalysis.impactAssessment.legalBasis}
              />
            </div>
            <dl className="preliminary-impact-metadata">
              <div>
                <dt>Confidence</dt>
                <dd>{impactAnalysis.impactAssessment.confidence}</dd>
              </div>
              <div>
                <dt>Analysis method</dt>
                <dd>{impactAnalysis.analysisMethod}</dd>
              </div>
            </dl>
            <strong className="human-review-required">
              HUMAN REVIEW REQUIRED
            </strong>

            <ImpactFactors
              assessment={impactAnalysis.impactAssessment}
              reviewRecords={humanReviewRecords}
              onHumanReviewChange={onHumanReviewChange}
            />

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
          reviewRecords={humanReviewRecords}
          onHumanReviewChange={onHumanReviewChange}
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
