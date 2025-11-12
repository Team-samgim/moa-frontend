import { useCallback } from 'react'
import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotStore } from '@/stores/pivotStore'

const usePivotChart = () => {
  const column = usePivotStore((s) => s.column)
  const rows = usePivotStore((s) => s.rows)
  const values = usePivotStore((s) => s.values)

  const {
    isChartMode,
    setIsChartMode,
    isConfigOpen,
    setIsConfigOpen,

    colField,
    rowField,
    metric,
    chartType,

    resetChartConfig,
  } = usePivotChartStore()

  const hasPivotStructure =
    !!(column && column.field) &&
    Array.isArray(rows) &&
    rows.length > 0 &&
    Array.isArray(values) &&
    values.length > 0

  const isConfigReusable = useCallback(() => {
    if (!colField || !rowField || !metric || !chartType) return false

    const colMatches = column && column.field === colField
    if (!colMatches) return false

    const rowMatches = (rows || []).some((r) => r.field === rowField)
    if (!rowMatches) return false

    const metricMatches = (values || []).some(
      (v) => v.field === metric.field && v.agg === metric.agg,
    )
    if (!metricMatches) return false

    return true
  }, [colField, rowField, metric, chartType, column, rows, values])

  const handleToggleChart = useCallback(() => {
    if (!hasPivotStructure) {
      window.alert('차트 모드로 진입하려면 열/행과 값(Values)을 먼저 선택해주세요.')
      return
    }

    // 켜져 있으면 끄기
    if (isChartMode) {
      setIsChartMode(false)
      return
    }

    // 기존 설정 재사용 가능하면 바로 차트 ON
    if (isConfigReusable()) {
      setIsChartMode(true)
      setIsConfigOpen(false)
    } else {
      // 아니면 설정 초기화 후 설정 모달 오픈
      resetChartConfig()
      setIsConfigOpen(true)
    }
  }, [
    hasPivotStructure,
    isChartMode,
    isConfigReusable,
    resetChartConfig,
    setIsChartMode,
    setIsConfigOpen,
  ])

  const closeConfig = useCallback(() => {
    setIsConfigOpen(false)
  }, [setIsConfigOpen])

  return {
    isChartMode,
    isConfigOpen,
    handleToggleChart,
    closeConfig,
    setIsConfigOpen,
  }
}

export default usePivotChart
