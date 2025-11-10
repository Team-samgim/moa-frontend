import { useQuery } from '@tanstack/react-query'
import { runPivotChart } from '@/api/pivot'
import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotStore } from '@/stores/pivotStore'
import { buildTimePayload } from '@/utils/pivotTime'

export function usePivotChartQuery(enabled = true) {
  const layer = usePivotStore((s) => s.layer)
  const timeRange = usePivotStore((s) => s.timeRange)
  const customRange = usePivotStore((s) => s.customRange)
  const filters = usePivotStore((s) => s.filters)

  const xField = usePivotChartStore((s) => s.xField)
  const xMode = usePivotChartStore((s) => s.xMode)
  const xTopN = usePivotChartStore((s) => s.xTopN)
  const xSelectedItems = usePivotChartStore((s) => s.xSelectedItems)
  const yMetrics = usePivotChartStore((s) => s.yMetrics)
  const chartType = usePivotChartStore((s) => s.chartType)

  const time = buildTimePayload(timeRange, customRange)

  const canRun =
    enabled &&
    !!layer &&
    !!xField &&
    Array.isArray(yMetrics) &&
    yMetrics.length > 0 &&
    // pie chart: metric 한개만 허용
    (chartType !== 'pie' || yMetrics.length === 1)

  return useQuery({
    queryKey: [
      'pivot-chart',
      layer,
      time,
      filters,
      xField,
      xMode,
      xTopN,
      xSelectedItems,
      yMetrics,
      chartType,
    ],
    enabled: canRun,
    queryFn: async () =>
      runPivotChart({
        layer,
        time,
        filters,
        chartType,
        x: {
          field: xField,
          mode: xMode,
          topN: xMode === 'topN' ? { n: xTopN } : null,
          selectedItems: xMode === 'manual' ? xSelectedItems : null,
        },
        y: {
          // yMetrics: [{ field, agg, alias }]
          metrics: yMetrics,
        },
      }),
  })
}
