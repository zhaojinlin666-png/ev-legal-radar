const priorityClassNames = {
  High: 'priority-badge--high',
  Medium: 'priority-badge--medium',
  Low: 'priority-badge--low',
}

function PriorityBadge({ priority }) {
  const fixedPriority = priorityClassNames[priority] ? priority : 'Low'

  return (
    <span className={`priority-badge ${priorityClassNames[fixedPriority]}`}>
      <span className="priority-badge__dot" aria-hidden="true" />
      {fixedPriority}
    </span>
  )
}

export default PriorityBadge
