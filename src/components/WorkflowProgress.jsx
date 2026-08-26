const WORKFLOW_STAGES = Object.freeze([
  { id: 'radar', label: 'Radar', labelCn: '法规雷达' },
  { id: 'impact', label: 'Impact', labelCn: '影响分析' },
  { id: 'review-task', label: 'Review Task', labelCn: '审查任务' },
  {
    id: 'document-review',
    label: 'Document Review',
    labelCn: '文档审查',
  },
  { id: 'ai-review', label: 'AI Review', labelCn: 'AI 初步审查' },
])

function WorkflowProgress({ currentStage }) {
  const currentIndex = WORKFLOW_STAGES.findIndex(
    (stage) => stage.id === currentStage,
  )

  return (
    <nav className="workflow-progress" aria-label="Legal review workflow">
      <p>Regulatory review workflow / 法规审查流程</p>
      <ol>
        {WORKFLOW_STAGES.map((stage, index) => {
          const state =
            index === currentIndex
              ? 'current'
              : index < currentIndex
                ? 'complete'
                : 'upcoming'

          return (
            <li
              className={`workflow-progress__stage workflow-progress__stage--${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
              key={stage.id}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{stage.label}</strong>
                <small>{stage.labelCn}</small>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default WorkflowProgress

