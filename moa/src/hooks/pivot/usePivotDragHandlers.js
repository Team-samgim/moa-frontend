// 작성자: 최이서
import { useCallback } from 'react'
import { arrayMove } from '@dnd-kit/sortable'

const usePivotDragHandlers = ({ rows, setRows, values, setValues, runQueryNow }) => {
  const handleDragEndRows = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = rows.findIndex((r) => r.field === active.id)
      const newIndex = rows.findIndex((r) => r.field === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(rows, oldIndex, newIndex)
      setRows(reordered)
      runQueryNow()
    },
    [rows, setRows, runQueryNow],
  )

  const handleDragEndValues = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const getId = (v) => v.field + '::' + v.agg

      const oldIndex = values.findIndex((v) => getId(v) === active.id)
      const newIndex = values.findIndex((v) => getId(v) === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(values, oldIndex, newIndex)
      setValues(reordered)
      runQueryNow()
    },
    [values, setValues, runQueryNow],
  )

  return {
    handleDragEndRows,
    handleDragEndValues,
  }
}

export default usePivotDragHandlers
