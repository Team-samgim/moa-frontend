import { useRef, useState, useEffect } from 'react'

export default function useActiveFilters() {
  const [activeFilters, setActiveFilters] = useState({})
  const ref = useRef(activeFilters)

  useEffect(() => {
    ref.current = activeFilters
  }, [activeFilters])

  const updateFilter = (field, filterData) => {
    setActiveFilters((prev) => {
      const next = { ...prev }
      if (!filterData) delete next[field]
      else next[field] = filterData
      return next
    })
  }

  return { activeFilters, activeFiltersRef: ref, updateFilter, setActiveFilters }
}
