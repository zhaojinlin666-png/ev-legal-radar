import { useMemo, useState } from 'react'
import {
  demoDocument,
  documentReviewBasis,
  documentReviewResults,
} from '../data/documentReviewDemo.js'
import { reviewLegalSource, reviewRules } from '../data/reviewRules.js'
import { aiAssistedReview } from '../services/aiReviewService.js'
import { ruleBasedReview } from '../utils/reviewDocument.js'
import AiReviewRequestPanel from './AiReviewRequestPanel.jsx'
import DemoDocumentPanel from './DemoDocumentPanel.jsx'
import DocumentReviewResults from './DocumentReviewResults.jsx'
import DocumentReviewContext from './DocumentReviewContext.jsx'
import DocumentUploader from './DocumentUploader.jsx'
import ReviewModeSelector from './ReviewModeSelector.jsx'
import ReviewResultTable from './ReviewResultTable.jsx'
import UploadedDocumentPreview from './UploadedDocumentPreview.jsx'
import VerificationBadge from './VerificationBadge.jsx'
import WorkflowProgress from './WorkflowProgress.jsx'

function DocumentReview({
  onBack,
  reviewContext = null,
  initialMode = 'demo',
  backLabel = 'Back to Legal Review Workspace',
}) {
  const [activeMode, setActiveMode] = useState(initialMode)
  const [uploadedDocument, setUploadedDocument] = useState(null)
  const [reviewMode, setReviewMode] = useState('rule-based')
  const [aiReviewState, setAiReviewState] = useState({
    isLoading: false,
    errorMessage: '',
    results: [],
  })

  const uploadedReviewResults = useMemo(
    () =>
      uploadedDocument && reviewMode === 'rule-based'
        ? ruleBasedReview(uploadedDocument.content, reviewRules)
        : [],
    [reviewMode, uploadedDocument],
  )

  const handleDocumentLoaded = (document) => {
    setUploadedDocument(document)
    setAiReviewState({ isLoading: false, errorMessage: '', results: [] })
  }

  const handleReviewModeChange = (mode) => {
    setReviewMode(mode)
    setAiReviewState({ isLoading: false, errorMessage: '', results: [] })
  }

  const handleAiReviewRequest = async () => {
    if (!uploadedDocument) return

    setAiReviewState({ isLoading: true, errorMessage: '', results: [] })

    try {
      const results = await aiAssistedReview({
        documentText: uploadedDocument.content,
        reviewRules,
        legalSource: reviewLegalSource,
      })
      setAiReviewState({ isLoading: false, errorMessage: '', results })
    } catch (error) {
      setAiReviewState({
        isLoading: false,
        results: [],
        errorMessage:
          error.statusCode === 503
            ? 'AI review is not configured yet. Add a valid API key to the local server environment.'
            : error.message || 'AI review request failed.',
      })
    }
  }

  const stats = [
    {
      label: 'Total Review Items',
      value: documentReviewResults.length,
    },
    {
      label: 'Found',
      value: documentReviewResults.filter((item) => item.result === 'Found')
        .length,
    },
    {
      label: 'Potential Gaps',
      value: documentReviewResults.filter(
        (item) => item.result === 'Not identified',
      ).length,
    },
    {
      label: 'Further Review Required',
      value: documentReviewResults.filter(
        (item) => item.result === 'Further review required',
      ).length,
    },
  ]

  return (
    <article className="document-review" aria-labelledby="document-review-title">
      <button type="button" className="detail-back" onClick={onBack}>
        <span aria-hidden="true">←</span>
        {backLabel}
      </button>

      <WorkflowProgress
        currentStage={
          reviewMode === 'ai-assisted' &&
          (aiReviewState.isLoading || aiReviewState.results.length > 0)
            ? 'ai-review'
            : 'document-review'
        }
      />

      <header className="document-review-hero">
        <p className="section-kicker">
          Regulatory Intelligence | Document Review
        </p>
        <h1 id="document-review-title">Document Review</h1>
        <dl className="document-review-hero__metadata">
          <div>
            <dt>Document</dt>
            <dd>
              {activeMode === 'demo'
                ? demoDocument.title
                : uploadedDocument?.name || 'No document selected'}
            </dd>
          </div>
          <div>
            <dt>Document Type</dt>
            <dd>
              {activeMode === 'demo'
                ? demoDocument.type
                : uploadedDocument
                  ? uploadedDocument.type || 'Not provided'
                  : 'Plain text (.txt)'}
            </dd>
          </div>
          <div>
            <dt>Review Basis</dt>
            <dd>
              《{documentReviewBasis.title}》
              <span>{documentReviewBasis.article}</span>
            </dd>
          </div>
          <div>
            <dt>Verification</dt>
            <dd>
              <VerificationBadge
                status={documentReviewBasis.verificationStatus}
              />
            </dd>
          </div>
        </dl>
        <p className="document-review-disclaimer">
          {activeMode === 'demo'
            ? 'AI-assisted preliminary document review. Absence of information in the reviewed text does not by itself establish legal non-compliance.'
            : reviewMode === 'rule-based'
              ? '上传模式仅执行本地规则驱动的初步文本审查，不构成法律意见。'
              : 'AI-assisted Review 会通过本地后端调用 OpenAI，并仅生成需要人工法律复核的初步结果。'}
        </p>
      </header>

      <div
        className="document-review-modes"
        role="tablist"
        aria-label="Document review mode"
      >
        <button
          type="button"
          role="tab"
          id="demo-review-tab"
          aria-controls="demo-review-panel"
          aria-selected={activeMode === 'demo'}
          className={activeMode === 'demo' ? 'document-review-mode--active' : ''}
          onClick={() => setActiveMode('demo')}
        >
          Demo Review
        </button>
        <button
          type="button"
          role="tab"
          id="upload-review-tab"
          aria-controls="upload-review-panel"
          aria-selected={activeMode === 'upload'}
          className={
            activeMode === 'upload' ? 'document-review-mode--active' : ''
          }
          onClick={() => setActiveMode('upload')}
        >
          Upload Your Document
        </button>
      </div>

      <section
        id="demo-review-panel"
        role="tabpanel"
        aria-labelledby="demo-review-tab"
        className="document-review-mode-panel"
        hidden={activeMode !== 'demo'}
      >
        {reviewContext && activeMode === 'demo' ? (
          <DocumentReviewContext context={reviewContext} />
        ) : null}
        <dl
          className="document-review-stats"
          aria-label="Document review summary"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <DemoDocumentPanel document={demoDocument} />
        <ReviewResultTable results={documentReviewResults} />
      </section>

      <section
        id="upload-review-panel"
        role="tabpanel"
        aria-labelledby="upload-review-tab"
        className="document-review-mode-panel"
        hidden={activeMode !== 'upload'}
      >
        <ReviewModeSelector
          activeMode={reviewMode}
          onModeChange={handleReviewModeChange}
        />
        {reviewContext && activeMode === 'upload' ? (
          <DocumentReviewContext context={reviewContext} />
        ) : null}
        <DocumentUploader onDocumentLoaded={handleDocumentLoaded} />
        <UploadedDocumentPreview document={uploadedDocument} />
        {uploadedDocument && reviewMode === 'rule-based' ? (
          <DocumentReviewResults results={uploadedReviewResults} />
        ) : null}
        {reviewMode === 'ai-assisted' ? (
          <AiReviewRequestPanel
            hasDocument={Boolean(uploadedDocument)}
            isLoading={aiReviewState.isLoading}
            errorMessage={aiReviewState.errorMessage}
            isComplete={aiReviewState.results.length > 0}
            onRequestReview={handleAiReviewRequest}
          />
        ) : null}
        {reviewMode === 'ai-assisted' && aiReviewState.results.length > 0 ? (
          <DocumentReviewResults results={aiReviewState.results} />
        ) : null}
      </section>
    </article>
  )
}

export default DocumentReview
