import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { runDrilldownTimeSeries, runPivotChart, runPivotHeatmapTable } from '@/api/pivot'
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
  const getLayout = usePivotChartStore((s) => s.getLayout)

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
    queryFn: async () => {
      const layout = getLayout()

      return runPivotChart({
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
        layout: layout.chartsPerRow ? { chartsPerRow: layout.chartsPerRow } : null,
      })
    },
  })
}

export function usePivotHeatmapTable(enabled = true) {
  const layer = usePivotStore((s) => s.layer)
  const timeRange = usePivotStore((s) => s.timeRange)
  const customRange = usePivotStore((s) => s.customRange)
  const filters = usePivotStore((s) => s.filters)

  const time = buildTimePayload(timeRange, customRange)

  const colField = usePivotChartStore((s) => s.colField)
  const rowField = usePivotChartStore((s) => s.rowField)
  const metric = usePivotChartStore((s) => s.metric)

  const canRun =
    enabled &&
    !!layer &&
    !!time &&
    !!colField &&
    !!rowField &&
    metric &&
    !!metric.field &&
    !!metric.agg

  return useInfiniteQuery({
    queryKey: [
      'pivot-heatmap-table',
      layer,
      time,
      filters,
      colField,
      rowField,
      metric,
      metric?.field,
      metric?.agg,
    ],
    enabled: canRun,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam?.offset ?? 0
      const limit = pageParam?.limit ?? 100

      return runPivotHeatmapTable({
        layer,
        time,
        filters,
        colField,
        rowField,
        metric,
        page: { offset, limit },
      })
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      const { offset, limit, totalRowCount } = lastPage
      const nextOffset = offset + limit
      if (nextOffset >= totalRowCount) return undefined
      return { offset: nextOffset, limit }
    },
  })
}

export function useDrilldownTimeSeries() {
  const layer = usePivotStore((s) => s.layer)
  const timeRange = usePivotStore((s) => s.timeRange)
  const customRange = usePivotStore((s) => s.customRange)
  const filters = usePivotStore((s) => s.filters)

  const colField = usePivotChartStore((s) => s.colField)
  const rowField = usePivotChartStore((s) => s.rowField)
  const metric = usePivotChartStore((s) => s.metric)

  const time = buildTimePayload(timeRange, customRange)

  return useMutation({
    mutationKey: ['pivot-drilldown-time-series', layer, time, filters, colField, rowField, metric],
    mutationFn: async ({ selectedColKey, rowKeys }) => {
      if (!layer || !time || !colField || !rowField || !metric?.field || !metric?.agg) {
        throw new Error('드릴다운에 필요한 정보가 부족합니다.')
      }

      return runDrilldownTimeSeries({
        layer,
        time,
        filters,
        colField,
        rowField,
        selectedColKey,
        rowKeys,
        timeField: time.field,
        metric,
        timeBucket: 'RAW',
      })
    },
  })
}
