import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotStore } from '@/stores/pivotStore'

export function buildChartPresetConfig() {
  const pivot = usePivotStore.getState()
  const chart = usePivotChartStore.getState()

  const pivotConfig = {
    layer: pivot.layer,
    timeRange: pivot.timeRange,
    customRange: pivot.customRange,
    column: pivot.column,
    rows: pivot.rows,
    values: pivot.values,
    filters: pivot.filters,
  }

  const chartConfig = {
    chartType: chart.chartType,
    col: {
      field: chart.colField,
      mode: chart.colMode,
      topN: chart.colMode === 'topN' ? { n: chart.colTopN } : null,
      selectedItems: chart.colMode === 'manual' ? chart.colSelectedItems : null,
    },
    row: {
      field: chart.rowField,
      mode: chart.rowMode,
      topN: chart.rowMode === 'topN' ? { n: chart.rowTopN } : null,
      selectedItems: chart.rowMode === 'manual' ? chart.rowSelectedItems : null,
    },
    metric: chart.metric, // { field, agg, alias }
  }

  const config = {}

  if (pivot.pivotMode === 'fromGrid' && pivot.gridContext?.searchPreset) {
    config.search = pivot.gridContext.searchPreset
    config.pivot = {
      mode: 'fromGrid',
      config: pivotConfig,
    }
  } else {
    config.pivot = {
      mode: 'free',
      config: pivotConfig,
    }
  }

  config.chart = chartConfig

  return config
}
