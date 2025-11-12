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

  const colField = usePivotChartStore((s) => s.colField)
  const colMode = usePivotChartStore((s) => s.colMode)
  const colTopN = usePivotChartStore((s) => s.colTopN)
  const colSelectedItems = usePivotChartStore((s) => s.colSelectedItems)

  const rowField = usePivotChartStore((s) => s.rowField)
  const rowMode = usePivotChartStore((s) => s.rowMode)
  const rowTopN = usePivotChartStore((s) => s.rowTopN)
  const rowSelectedItems = usePivotChartStore((s) => s.rowSelectedItems)

  const metric = usePivotChartStore((s) => s.metric)
  const chartType = usePivotChartStore((s) => s.chartType)

  const time = buildTimePayload(timeRange, customRange)

  const canRun =
    enabled && !!layer && !!colField && !!rowField && metric && !!metric.field && !!metric.agg

  return useQuery({
    queryKey: [
      'pivot-chart',
      layer,
      time,
      filters,
      colField,
      colMode,
      colTopN,
      colSelectedItems,
      rowField,
      rowMode,
      rowTopN,
      rowSelectedItems,
      metric,
      chartType,
    ],
    enabled: canRun,
    queryFn: async () =>
      runPivotChart({
        layer,
        time,
        filters,
        chartType,
        col: {
          field: colField,
          mode: colMode,
          topN: colMode === 'topN' ? { n: colTopN } : null,
          selectedItems: colMode === 'manual' ? colSelectedItems : null,
        },
        row: {
          field: rowField,
          mode: rowMode,
          topN: rowMode === 'topN' ? { n: rowTopN } : null,
          selectedItems: rowMode === 'manual' ? rowSelectedItems : null,
        },
        metric, // { field, agg, alias }
      }),
  })
}
