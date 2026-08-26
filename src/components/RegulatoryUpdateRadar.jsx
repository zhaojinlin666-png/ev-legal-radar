import { useMemo, useState } from 'react'
import DetectedRegulatoryItemCard from './DetectedRegulatoryItemCard.jsx'
import FilterBar from './FilterBar.jsx'
import RegulatoryChangeCard from './RegulatoryChangeCard.jsx'
import WorkflowProgress from './WorkflowProgress.jsx'
import { fetchRegulatoryUpdates } from '../services/regulatoryMonitoringService.js'

const radarFilters = [
  'All',
  'China',
  'EU',
  'US',
  'High Impact',
  'New Regulation',
  'Amendment',
  'Guidance',
]

function matchesFilter(event, filter) {
  if (filter === 'All') return true
  if (['China', 'EU', 'US'].includes(filter)) {
    return event.jurisdiction === filter
  }
  if (filter === 'High Impact') {
    return event.preliminaryImpactLevel === 'High'
  }
  if (filter === 'Guidance') {
    return event.changeType === 'Implementation Guidance'
  }

  return event.changeType === filter
}

function matchesDetectedFilter(filter) {
  return filter === 'All' || filter === 'China'
}

function RegulatoryUpdateRadar({
  events,
  detectedItems,
  createdReviewEventIds,
  onDetectedItems,
  onCreateReviewEvent,
  onSelectEvent,
}) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [fetchState, setFetchState] = useState({
    status: 'idle',
    message: '',
    source: null,
  })
  const filteredEvents = useMemo(
    () => events.filter((event) => matchesFilter(event, activeFilter)),
    [activeFilter, events],
  )
  const filteredDetectedItems = matchesDetectedFilter(activeFilter)
    ? detectedItems
    : []

  const handleFetchUpdates = async () => {
    setFetchState({ status: 'loading', message: '', source: null })

    try {
      const result = await fetchRegulatoryUpdates()
      const addedCount = onDetectedItems(result.items)
      const detectedCount = result.items.length

      setFetchState({
        status: 'success',
        source: result.source,
        message: `${detectedCount} relevant ${
          detectedCount === 1 ? 'update' : 'updates'
        } detected, ${addedCount} new ${
          addedCount === 1 ? 'item' : 'items'
        } added.`,
      })
    } catch (error) {
      setFetchState({
        status: 'error',
        message: error.message,
        source: null,
      })
    }
  }

  return (
    <article className="regulatory-update-radar">
      <section className="page-intro" aria-labelledby="radar-page-title">
        <div>
          <p className="eyebrow">Regulatory workflow prototype</p>
          <h1 id="radar-page-title">Regulatory Update Radar</h1>
          <p className="radar-page-title-cn">法规更新雷达</p>
          <p className="page-subtitle">
            Turn demo regulatory change records into structured source checks,
            impact questions, and preliminary legal-review tasks.
          </p>
        </div>
        <div className="radar-demo-note">
          <strong>On-demand official-source retrieval</strong>
          <span>One CAC listing page · User-triggered fetch only</span>
        </div>
      </section>

      <WorkflowProgress currentStage="radar" />

      <section
        className="regulatory-monitoring-panel"
        aria-labelledby="regulatory-monitoring-title"
      >
        <div>
          <p className="section-kicker">Official-source metadata</p>
          <h2 id="regulatory-monitoring-title">Regulatory Monitoring MVP</h2>
          <p>
            Detected items are retrieved from an official public source but
            have not yet undergone legal verification or impact analysis.
          </p>
        </div>
        <button
          type="button"
          onClick={handleFetchUpdates}
          disabled={fetchState.status === 'loading'}
        >
          {fetchState.status === 'loading'
            ? '正在获取…'
            : '获取最新监管动态'}
        </button>

        {fetchState.message ? (
          <div
            className={`regulatory-monitoring-panel__message regulatory-monitoring-panel__message--${fetchState.status}`}
            role={fetchState.status === 'error' ? 'alert' : 'status'}
          >
            {fetchState.message}
          </div>
        ) : null}

        {fetchState.source ? (
          <p className="regulatory-monitoring-panel__source">
            Source:{' '}
            <a href={fetchState.source.url} target="_blank" rel="noreferrer">
              {fetchState.source.name}
            </a>{' '}
            · Fetched at {fetchState.source.fetchedAt}
          </p>
        ) : null}
      </section>

      <section className="updates-section" aria-labelledby="radar-feed-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Update-event feed</p>
            <h2 id="radar-feed-title">Regulatory Change Events</h2>
          </div>
          <p className="result-count" aria-live="polite">
            {filteredDetectedItems.length + filteredEvents.length}{' '}
            {filteredDetectedItems.length + filteredEvents.length === 1
              ? 'item'
              : 'items'}
          </p>
        </div>

        <FilterBar
          filters={radarFilters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {filteredDetectedItems.length > 0 ? (
          <section
            className="detected-regulatory-feed"
            aria-labelledby="detected-regulatory-feed-title"
          >
            <div className="radar-feed-subheading">
              <div>
                <p className="section-kicker">Source detected</p>
                <h3 id="detected-regulatory-feed-title">
                  Official-source metadata awaiting review
                </h3>
              </div>
              <span>{filteredDetectedItems.length}</span>
            </div>
            <div className="detected-regulatory-list">
              {filteredDetectedItems.map((item) => (
                <DetectedRegulatoryItemCard
                  item={item}
                  key={item.externalId}
                  reviewEventCreated={createdReviewEventIds.has(
                    item.externalId,
                  )}
                  onCreateReviewEvent={onCreateReviewEvent}
                />
              ))}
            </div>
          </section>
        ) : null}

        {filteredEvents.length > 0 ? (
          <section
            className="review-event-feed"
            aria-labelledby="review-event-feed-title"
          >
            <div className="radar-feed-subheading">
              <div>
                <p className="section-kicker">Review events</p>
                <h3 id="review-event-feed-title">
                  Demo and unreviewed workflow records
                </h3>
              </div>
              <span>{filteredEvents.length}</span>
            </div>
            <div className="change-event-list">
              {filteredEvents.map((event) => (
                <RegulatoryChangeCard
                  event={event}
                  key={event.id}
                  onSelect={onSelectEvent}
                />
              ))}
            </div>
          </section>
        ) : filteredDetectedItems.length === 0 ? (
          <div className="empty-state change-event-empty">
            <p>No regulatory items match this filter.</p>
          </div>
        ) : null}
      </section>
    </article>
  )
}

export default RegulatoryUpdateRadar
