const navigationItems = [
  { id: 'intelligence', label: 'Regulatory Intelligence' },
  { id: 'radar', label: 'Regulatory Update Radar' },
  { id: 'document-review', label: 'Document Review' },
]

function PrimaryNavigation({ activeSection, onNavigate }) {
  return (
    <nav className="primary-navigation" aria-label="Primary workspace">
      <div className="primary-navigation__inner">
        {navigationItems.map((item) => (
          <button
            type="button"
            key={item.id}
            className={
              activeSection === item.id
                ? 'primary-navigation__item primary-navigation__item--active'
                : 'primary-navigation__item'
            }
            aria-current={activeSection === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export default PrimaryNavigation
