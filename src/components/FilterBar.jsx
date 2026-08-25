function FilterBar({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="filter-bar" aria-label="Filter regulatory updates">
      {filters.map((filter) => (
        <button
          className={`filter-button ${
            activeFilter === filter ? 'filter-button--active' : ''
          }`}
          key={filter}
          type="button"
          aria-pressed={activeFilter === filter}
          onClick={() => onFilterChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}

export default FilterBar
