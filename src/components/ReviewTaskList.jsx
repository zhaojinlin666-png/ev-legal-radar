import ReviewTaskCard from './ReviewTaskCard.jsx'

function ReviewTaskList({
  tasks,
  highlightedTaskId,
  progress,
  onStatusChange,
  onToggleQuestion,
  onReviewDocument,
  reviewRecords = {},
  onHumanReviewChange,
}) {
  if (tasks.length === 0) {
    return (
      <div className="radar-detail-empty">
        Review tasks have not been generated for this unreviewed event.
      </div>
    )
  }

  return (
    <div className="review-task-list">
      {tasks.map((task, index) => (
        <ReviewTaskCard
          task={task}
          isHighlighted={task.id === highlightedTaskId}
          index={index}
          progress={progress[task.id]}
          key={task.id}
          onStatusChange={onStatusChange}
          onToggleQuestion={onToggleQuestion}
          onReviewDocument={onReviewDocument}
          humanReviewRecord={reviewRecords[`review-task:${task.id}`]}
          onHumanReviewChange={onHumanReviewChange}
        />
      ))}
    </div>
  )
}

export default ReviewTaskList
