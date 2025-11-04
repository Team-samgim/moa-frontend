import { create } from 'zustand'

export const usePivotStore = create((set) => ({
  layer: 'HTTP_PAGE',
  timeRange: {
    type: 'preset', // 'preset' | 'custom'
    value: '1h', // '1h' | '2h' | '24h' | '1w'
    now: new Date().toISOString(),
  },
  customRange: {
    from: null,
    to: null,
  },
  column: null,
  rows: [],
  values: [],
  filters: [],

  setLayer: (layer) =>
    set(() => ({
      layer,
      column: null,
      rows: [],
      values: [],
      filters: [],
    })),

  setTimePreset: (value) =>
    set(() => ({
      timeRange: {
        type: 'preset',
        value,
        now: new Date().toISOString(),
      },
      customRange: { from: null, to: null },
    })),

  setCustomRange: (from, to) =>
    set(() => ({
      timeRange: {
        type: 'custom',
        value: null,
        now: new Date().toISOString(),
      },
      customRange: { from, to },
    })),

  setColumnField: (field) =>
    set(() => ({
      column: field ? { field } : null,
    })),

  setRows: (rows) => set(() => ({ rows })),

  setValues: (values) => set(() => ({ values })),

  setFilters: (next) =>
    set((s) => ({
      filters: typeof next === 'function' ? next(s.filters) : next,
    })),
}))
