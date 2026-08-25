import RegulatoryUpdateCard from './RegulatoryUpdateCard.jsx'

function RegulatoryUpdateList({ updates }) {
  if (updates.length === 0) {
    return (
      <div className="empty-state">
        <p>No regulatory updates match this filter.</p>
      </div>
    )
  }

  return (
    <div className="update-list">
      {updates.map((update) => (
        <RegulatoryUpdateCard key={update.id} update={update} />
      ))}
    </div>
  )
}

export default RegulatoryUpdateList
