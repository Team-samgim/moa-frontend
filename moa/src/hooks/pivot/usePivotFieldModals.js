// hooks/pivot/usePivotFieldModals.js
import { useCallback } from 'react'
import { usePivotModalStore } from '@/stores/pivotModalStore'

const usePivotFieldModals = ({
  rows,
  column,
  values,
  setRows,
  setColumnField,
  setValues,
  runQueryNow,
}) => {
  const { isOpen, mode, openModal, closeModal, draftRows, draftColumn, draftValues } =
    usePivotModalStore()

  const openRowsModal = useCallback(() => {
    openModal('rows', { rows, column, values })
  }, [openModal, rows, column, values])

  const openColumnModal = useCallback(() => {
    openModal('column', { rows, column, values })
  }, [openModal, rows, column, values])

  const openValuesModal = useCallback(() => {
    openModal('values', { rows, column, values })
  }, [openModal, rows, column, values])

  const applyRows = useCallback(
    (newRows) => {
      setRows(newRows)
      closeModal()
      runQueryNow()
    },
    [setRows, closeModal, runQueryNow],
  )

  const applyColumn = useCallback(
    (newCol) => {
      setColumnField(newCol && newCol.field ? newCol.field : null)
      closeModal()
      runQueryNow()
    },
    [setColumnField, closeModal, runQueryNow],
  )

  const applyValues = useCallback(
    (newValues) => {
      setValues(newValues)
      closeModal()
      runQueryNow()
    },
    [setValues, closeModal, runQueryNow],
  )

  return {
    modalState: {
      isOpen,
      mode,
      draftRows,
      draftColumn,
      draftValues,
    },
    openRowsModal,
    openColumnModal,
    openValuesModal,
    applyRows,
    applyColumn,
    applyValues,
    closeModal,
  }
}

export default usePivotFieldModals
