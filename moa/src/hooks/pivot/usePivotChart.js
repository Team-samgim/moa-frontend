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
    xField,
    yMetrics,
    chartType,
    resetChartConfig,
  } = usePivotChartStore()

  const hasPivotStructure =
    ((column && column.field) || (rows && rows.length > 0)) && values && values.length > 0

  const isConfigReusable = useCallback(() => {
    if (!xField || !yMetrics || yMetrics.length === 0 || !chartType) return false

    const xMatches =
      (column && column.field === xField) || (rows && rows.some((r) => r.field === xField))
    if (!xMatches) return false

    const valueMatches = yMetrics.every((metric) =>
      values.some((v) => v.field === metric.field && v.agg === metric.agg),
    )

    return valueMatches
  }, [xField, yMetrics, chartType, column, rows, values])

  const handleToggleChart = useCallback(() => {
    if (!hasPivotStructure) {
      window.alert('차트 모드로 진입하려면 열/행과 값(Values)을 먼저 선택해주세요.')
      return
    }

    if (isChartMode) {
      setIsChartMode(false)
      return
    }

    if (isConfigReusable()) {
      setIsChartMode(true)
      setIsConfigOpen(false)
    } else {
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
