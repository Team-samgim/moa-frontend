import { usePivotStore } from '@/stores/pivotStore'

export function buildPivotPresetConfigFromStore() {
  const { pivotMode, gridContext, layer, timeRange, customRange, column, rows, values, filters } =
    usePivotStore.getState()

  const pivotConfig = {
    layer,
    timeRange,
    customRange,
    column,
    rows,
    values,
    filters,
  }

  const config = {
    pivot: {
      mode: pivotMode, // "free" | "fromGrid"
      config: pivotConfig,
    },
  }

  // fromGrid: grid 블록 포함
  if (pivotMode === 'fromGrid' && gridContext && gridContext.searchPreset) {
    config.search = {
      preset_type: 'SEARCH',
      config: gridContext.searchPreset,
    }
  }

  return config
}

// JSONB config → pivotStore 상태로 반영
export function applyPivotPresetConfigToStore(rawConfig) {
  const cfg = rawConfig || {}
  const pivotPart = cfg.pivot && cfg.pivot.config ? cfg.pivot.config : {}
  const mode = cfg.pivot && cfg.pivot.mode ? cfg.pivot.mode : 'free'
  const gridPart = cfg.search && cfg.search.config ? cfg.search.config : null

  usePivotStore.setState((prev) => ({
    ...prev,
    pivotMode: mode === 'fromGrid' && gridPart ? 'fromGrid' : 'free',
    gridContext: gridPart
      ? {
          layer: gridPart.layer,
          time: (gridPart.baseSpec && gridPart.baseSpec.time) || null,
          columns: gridPart.columns || [],
          conditions: (gridPart.query && gridPart.query.conditions) || [],
          searchPreset: gridPart,
        }
      : null,
    layer: pivotPart.layer || prev.layer,
    timeRange: pivotPart.timeRange || prev.timeRange,
    customRange: pivotPart.customRange || { from: null, to: null },
    column: pivotPart.column || null,
    rows: Array.isArray(pivotPart.rows) ? pivotPart.rows : [],
    values: Array.isArray(pivotPart.values) ? pivotPart.values : [],
    filters: Array.isArray(pivotPart.filters) ? pivotPart.filters : [],
  }))
}
