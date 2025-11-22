import { useCallback, useMemo, useState } from 'react'
import { buildTimePayload } from '@/utils/pivotTime'

const usePivotFilterModal = ({
  values,
  filters,
  timeRange,
  customRange,
  setFilters,
  runQueryNow,
}) => {
  const [filterModal, setFilterModal] = useState({
    open: false,
    field: null,
    valueAliases: [],
  })

  const openFilterForField = useCallback(
    (fieldName) => {
      const valueAliases = values?.length
        ? values.map((v) => v.alias ?? `${v.agg?.toUpperCase() || ''}: ${v.field}`)
        : ['Values 값들']

      setFilterModal({
        open: true,
        field: fieldName,
        valueAliases,
      })
    },
    [values],
  )

  const closeFilter = useCallback(
    () =>
      setFilterModal((m) => ({
        ...m,
        open: false,
      })),
    [],
  )

  const applyFilter = useCallback(
    (payload) => {
      setFilters((prev) => {
        const others = (prev || []).filter((f) => f.field !== payload.field)
        return [
          ...others,
          {
            field: payload.field,
            op: 'IN',
            value: payload.selected,
            topN: payload.topN,
            order: payload.order,
          },
        ]
      })
      closeFilter()
      runQueryNow()
    },
    [setFilters, closeFilter, runQueryNow],
  )

  const currentFilterForModal = filters.find((f) => f.field === filterModal.field && f.op === 'IN')

  const selectedValuesForModal = Array.isArray(currentFilterForModal?.value)
    ? currentFilterForModal.value
    : undefined

  const timeForFilter = useMemo(
    () => buildTimePayload(timeRange, customRange),
    [timeRange, customRange],
  )

  const initialTopNForModal = currentFilterForModal?.topN

  return {
    filterModal,
    openFilterForField,
    closeFilter,
    applyFilter,
    selectedValuesForModal,
    timeForFilter,
    initialTopNForModal,
  }
}

export default usePivotFilterModal
