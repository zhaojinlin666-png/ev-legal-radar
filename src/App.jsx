import { useMemo, useState } from 'react'
import DashboardHeader from './components/DashboardHeader.jsx'
import DocumentReview from './components/DocumentReview.jsx'
import FilterBar from './components/FilterBar.jsx'
import PrimaryNavigation from './components/PrimaryNavigation.jsx'
import RegulatoryChangeDetail from './components/RegulatoryChangeDetail.jsx'
import RegulatoryUpdateDetail from './components/RegulatoryUpdateDetail.jsx'
import RegulatoryUpdateList from './components/RegulatoryUpdateList.jsx'
import RegulatoryUpdateRadar from './components/RegulatoryUpdateRadar.jsx'
import StatsGrid from './components/StatsGrid.jsx'
import { regulatoryChangeEvents } from './data/regulatoryChangeEvents.js'
import { regulatoryUpdates } from './data/regulatoryUpdates.js'
import { requestRegulatoryImpactAnalysis } from './services/regulatoryImpactAnalysisService.js'
import {
  applyPreliminaryImpactAnalysis,
  markRegulatoryEventAnalyzing,
  markRegulatoryEventAnalysisFailed,
} from './utils/regulatoryImpactWorkflow.js'
import {
  createReviewEventFromDetectedItem,
  mergeDetectedRegulatoryItems,
} from './utils/regulatoryMonitoring.js'
import { createDocumentReviewContext } from './utils/reviewWorkflow.js'
import './App.css'

const stats = [
  {
    label: 'Regulatory Updates',
    value: '128',
    detail: 'Tracked this quarter',
    tone: 'primary',
  },
  {
    label: 'High Risk',
    value: '16',
    detail: 'Requires priority review',
    tone: 'danger',
  },
  {
    label: 'China',
    value: '52',
    detail: 'Active intelligence items',
    tone: 'neutral',
  },
  {
    label: 'EU & US',
    value: '76',
    detail: 'Combined coverage',
    tone: 'neutral',
  },
]

const filters = [
  'All',
  'China',
  'EU',
  'US',
  'AI',
  'Data',
  'Manufacturing',
  'Autonomous Driving',
]

function App() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSection, setActiveSection] = useState('intelligence')
  const [selectedUpdate, setSelectedUpdate] = useState(null)
  const [selectedChangeEvent, setSelectedChangeEvent] = useState(null)
  const [radarEvents, setRadarEvents] = useState(regulatoryChangeEvents)
  const [detectedRegulatoryItems, setDetectedRegulatoryItems] = useState([])
  const [taskProgress, setTaskProgress] = useState({})
  const [humanReviewRecords, setHumanReviewRecords] = useState({})
  const [documentReviewContext, setDocumentReviewContext] = useState(null)
  const [documentReviewInitialMode, setDocumentReviewInitialMode] =
    useState('demo')
  const [documentReviewReturnSection, setDocumentReviewReturnSection] =
    useState('intelligence')
  const [returnedTaskId, setReturnedTaskId] = useState(null)

  const filteredUpdates = useMemo(() => {
    if (activeFilter === 'All') return regulatoryUpdates

    return regulatoryUpdates.filter(
      (update) =>
        update.jurisdiction === activeFilter ||
        update.businessAreas.includes(activeFilter) ||
        update.legalTopics.includes(activeFilter),
    )
  }, [activeFilter])

  const createdReviewEventIds = useMemo(
    () =>
      new Set(
        radarEvents
          .map((event) => event.sourceExternalId)
          .filter(Boolean),
      ),
    [radarEvents],
  )

  const handleDetectedItems = (incomingItems) => {
    const mergeResult = mergeDetectedRegulatoryItems(
      detectedRegulatoryItems,
      incomingItems,
    )

    setDetectedRegulatoryItems(mergeResult.items)
    return mergeResult.addedItems.length
  }

  const handleCreateReviewEvent = (detectedItem) => {
    const existingEvent = radarEvents.find(
      (event) => event.sourceExternalId === detectedItem.externalId,
    )
    const reviewEvent =
      existingEvent || createReviewEventFromDetectedItem(detectedItem)

    if (!existingEvent) {
      setRadarEvents((currentEvents) => [reviewEvent, ...currentEvents])
    }

    setReturnedTaskId(null)
    setSelectedChangeEvent(reviewEvent)
  }

  const replaceRadarEvent = (updatedEvent) => {
    setRadarEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    )
    setSelectedChangeEvent(updatedEvent)
  }

  const handleRunPreliminaryImpactAnalysis = async (event) => {
    const analyzingEvent = markRegulatoryEventAnalyzing(event)
    replaceRadarEvent(analyzingEvent)

    try {
      const result = await requestRegulatoryImpactAnalysis(event)
      setHumanReviewRecords((currentRecords) => {
        const nextRecords = { ...currentRecords }
        delete nextRecords[event.id]
        return nextRecords
      })
      replaceRadarEvent(applyPreliminaryImpactAnalysis(event, result))
    } catch (error) {
      replaceRadarEvent(
        markRegulatoryEventAnalysisFailed(event, error.message),
      )
    }
  }

  const handleNavigate = (section) => {
    setActiveSection(section)
    setDocumentReviewContext(null)
    setReturnedTaskId(null)

    if (section === 'intelligence') {
      setSelectedUpdate(null)
      setSelectedChangeEvent(null)
    } else if (section === 'radar') {
      setSelectedUpdate(null)
      setSelectedChangeEvent(null)
    } else {
      setDocumentReviewReturnSection('intelligence')
      setDocumentReviewInitialMode('demo')
      setSelectedUpdate(null)
      setSelectedChangeEvent(null)
    }
  }

  const openDocumentReview = (
    context,
    returnSection,
    initialMode = 'demo',
  ) => {
    setDocumentReviewContext(context)
    setReturnedTaskId(null)
    setDocumentReviewReturnSection(returnSection)
    setDocumentReviewInitialMode(initialMode)
    setActiveSection('document-review')
  }

  const handleDocumentReviewBack = () => {
    if (
      documentReviewReturnSection === 'radar' &&
      documentReviewContext?.originTaskId
    ) {
      setReturnedTaskId(documentReviewContext.originTaskId)
    }
    setActiveSection(documentReviewReturnSection)
    setDocumentReviewContext(null)
  }

  const updateTaskProgress = (eventId, taskId, update) => {
    setTaskProgress((currentProgress) => {
      const eventProgress = currentProgress[eventId] || {}
      const currentTaskProgress = eventProgress[taskId] || {}

      return {
        ...currentProgress,
        [eventId]: {
          ...eventProgress,
          [taskId]: update(currentTaskProgress),
        },
      }
    })
  }

  const handleTaskStatusChange = (eventId, taskId, status) => {
    updateTaskProgress(eventId, taskId, (currentTaskProgress) => ({
      ...currentTaskProgress,
      status,
    }))
  }

  const handleReviewQuestionToggle = (eventId, taskId, questionIndex) => {
    updateTaskProgress(eventId, taskId, (currentTaskProgress) => {
      const checkedQuestions = currentTaskProgress.checkedQuestions || []
      const isChecked = checkedQuestions.includes(questionIndex)

      return {
        ...currentTaskProgress,
        checkedQuestions: isChecked
          ? checkedQuestions.filter((index) => index !== questionIndex)
          : [...checkedQuestions, questionIndex],
      }
    })
  }

  const handleTaskDocumentReview = (event, task) => {
    openDocumentReview(
      createDocumentReviewContext(event, task),
      'radar',
      'upload',
    )
  }

  const handleHumanReviewChange = (eventId, reviewKey, record) => {
    setHumanReviewRecords((currentRecords) => ({
      ...currentRecords,
      [eventId]: {
        ...(currentRecords[eventId] || {}),
        [reviewKey]: record,
      },
    }))
  }

  return (
    <div className="app-shell">
      <DashboardHeader />
      <PrimaryNavigation
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      <main
        className={`dashboard ${
          selectedUpdate ||
          selectedChangeEvent ||
          activeSection === 'document-review'
            ? 'dashboard--detail'
            : ''
        }`}
      >
        {activeSection === 'document-review' ? (
          <DocumentReview
            onBack={handleDocumentReviewBack}
            reviewContext={documentReviewContext}
            initialMode={documentReviewInitialMode}
            backLabel={
              documentReviewReturnSection === 'radar'
                ? 'Back to originating regulatory review task'
                : 'Back to Legal Review Workspace'
            }
          />
        ) : activeSection === 'radar' && selectedChangeEvent ? (
          <RegulatoryChangeDetail
            event={selectedChangeEvent}
            highlightedTaskId={returnedTaskId}
            taskProgress={taskProgress[selectedChangeEvent.id] || {}}
            onBack={() => {
              setReturnedTaskId(null)
              setSelectedChangeEvent(null)
            }}
            onStatusChange={(taskId, status) =>
              handleTaskStatusChange(selectedChangeEvent.id, taskId, status)
            }
            onToggleQuestion={(taskId, questionIndex) =>
              handleReviewQuestionToggle(
                selectedChangeEvent.id,
                taskId,
                questionIndex,
              )
            }
            onReviewDocument={(task) =>
              handleTaskDocumentReview(selectedChangeEvent, task)
            }
            onRunPreliminaryImpactAnalysis={() =>
              handleRunPreliminaryImpactAnalysis(selectedChangeEvent)
            }
            humanReviewRecords={
              humanReviewRecords[selectedChangeEvent.id] || {}
            }
            onHumanReviewChange={(reviewKey, record) =>
              handleHumanReviewChange(
                selectedChangeEvent.id,
                reviewKey,
                record,
              )
            }
          />
        ) : activeSection === 'radar' ? (
          <RegulatoryUpdateRadar
            events={radarEvents}
            detectedItems={detectedRegulatoryItems}
            createdReviewEventIds={createdReviewEventIds}
            onDetectedItems={handleDetectedItems}
            onCreateReviewEvent={handleCreateReviewEvent}
            onSelectEvent={(event) => {
              setReturnedTaskId(null)
              setSelectedChangeEvent(event)
            }}
          />
        ) : selectedUpdate ? (
          <RegulatoryUpdateDetail
            update={selectedUpdate}
            onBack={() => {
              setSelectedUpdate(null)
            }}
            onReviewDemoDocument={() =>
              openDocumentReview(
                {
                  relatedRegulationTitle: selectedUpdate.title,
                  reviewTask: 'Review existing demo privacy notice',
                  legalTopic:
                    selectedUpdate.legalTopics[0] ||
                    'Not specified in current project data',
                },
                'intelligence',
                'demo',
              )
            }
          />
        ) : (
          <>
            <section className="page-intro" aria-labelledby="page-title">
              <div>
                <p className="eyebrow">Regulatory Intelligence</p>
                <h1 id="page-title">EV Legal Radar</h1>
                <p className="page-subtitle">
                  AI-assisted regulatory research and preliminary compliance
                  review for legal interns and junior legal professionals
                </p>
              </div>

              <div className="coverage-note" aria-label="Current coverage">
                <span className="coverage-note__dot" aria-hidden="true" />
                Monitoring China, EU &amp; US
              </div>
            </section>

            <StatsGrid stats={stats} />

            <section
              className="updates-section"
              aria-labelledby="updates-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="section-kicker">Intelligence feed</p>
                  <h2 id="updates-heading">Latest Regulatory Updates</h2>
                </div>
                <p className="result-count" aria-live="polite">
                  {filteredUpdates.length}{' '}
                  {filteredUpdates.length === 1 ? 'update' : 'updates'}
                </p>
              </div>

              <FilterBar
                filters={filters}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />

              <RegulatoryUpdateList
                updates={filteredUpdates}
                onSelectUpdate={setSelectedUpdate}
              />
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <p>EV Legal Radar · Internal regulatory intelligence workspace</p>
        <p>Demonstration data only</p>
      </footer>
    </div>
  )
}

export default App
