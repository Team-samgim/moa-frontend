import { useRef, useState, useEffect, useCallback } from 'react'

export default function useActiveFilters() {
  const [activeFilters, setActiveFilters] = useState({})
  const activeFiltersRef = useRef(activeFilters)

  useEffect(() => {
    activeFiltersRef.current = activeFilters
  }, [activeFilters])

  const updateFilter = useCallback((field, filterData) => {
    setActiveFilters((prev) => {
      const next = { ...prev }
      if (!filterData) delete next[field]
      else next[field] = filterData
      return next
    })
  }, [])

  return { activeFilters, activeFiltersRef, updateFilter, setActiveFilters }
}
