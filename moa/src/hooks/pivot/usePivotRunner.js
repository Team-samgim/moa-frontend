// 작성자: 최이서
import { useCallback } from 'react'
import { usePivotQuery } from '../queries/usePivot'
import { usePivotStore } from '@/stores/pivotStore'
import { buildTimePayload } from '@/utils/pivotTime'

const usePivotRunner = () => {
  const { mutate: executeQuery, data: pivotResult, isLoading: isPivotLoading } = usePivotQuery()

  const runQueryNow = useCallback(() => {
    const cfg = usePivotStore.getState()
    const time = buildTimePayload(cfg.timeRange, cfg.customRange)

    executeQuery({
      layer: cfg.layer,
      time,
      column: cfg.column,
      rows: cfg.rows,
      values: cfg.values,
      filters: cfg.filters,
    })
  }, [executeQuery])

  return {
    runQueryNow,
    pivotResult,
    isPivotLoading,
  }
}

export default usePivotRunner
