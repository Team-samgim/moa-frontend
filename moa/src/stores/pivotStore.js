import { create } from 'zustand'
import { epochSecToIsoUtc } from '@/utils/dateFormat'

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

  pivotMode: 'free', // 'free' | 'fromGrid'
  gridContext: null,

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
      customRange: {
        from: from ? from.toISOString() : null,
        to: to ? to.toISOString() : null,
      },
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

  initFromGrid: (payload) =>
    set(() => {
      const { layer, time, columns, conditions, searchPreset } = payload || {}

      const fromIso = time?.fromEpoch !== null ? epochSecToIsoUtc(time.fromEpoch) : null
      const toIso = time?.toEpoch !== null ? epochSecToIsoUtc(time.toEpoch) : null

      return {
        pivotMode: 'fromGrid',

        gridContext: {
          layer,
          time,
          columns,
          conditions,
          searchPreset,
        },

        layer,
        timeRange: {
          type: 'custom',
          value: null,
          now: new Date().toISOString(),
        },
        customRange: {
          from: fromIso,
          to: toIso,
        },
        column: null,
        rows: [],
        values: [],
        filters: [],
      }
    }),

  // 자유 피벗 모드로 되돌아가기
  resetToFreeMode: () =>
    set(() => ({
      pivotMode: 'free',
      gridContext: null,
      layer: 'HTTP_PAGE',
      timeRange: {
        type: 'preset',
        value: '1h',
        now: new Date().toISOString(),
      },
      customRange: { from: null, to: null },
      column: null,
      rows: [],
      values: [],
      filters: [],
    })),
}))
