import { create } from 'zustand'

export const usePivotChartStore = create((set) => ({
  isChartMode: false,
  isConfigOpen: false,

  colField: null, // ex) 'country_name_res'
  colMode: 'topN', // 'topN' | 'manual'
  colTopN: 5, // 기본 5 (백엔드에서도 5로 캡)
  colSelectedItems: [], // manual 모드에서 선택된 값들

  rowField: null, // ex) 'ts_date'
  rowMode: 'topN',
  rowTopN: 5,
  rowSelectedItems: [],

  metric: null,

  chartType: 'groupedColumn',

  setIsChartMode: (v) => set({ isChartMode: v }),
  setIsConfigOpen: (v) => set({ isConfigOpen: v }),

  setColField: (field) => set({ colField: field }),
  setColMode: (mode) => set({ colMode: mode }),
  setColTopN: (n) => set({ colTopN: n }),
  setColSelectedItems: (items) => set({ colSelectedItems: items }),

  setRowField: (field) => set({ rowField: field }),
  setRowMode: (mode) => set({ rowMode: mode }),
  setRowTopN: (n) => set({ rowTopN: n }),
  setRowSelectedItems: (items) => set({ rowSelectedItems: items }),

  setMetric: (metric) => set({ metric }),
  setChartType: (type) => set({ chartType: type }),

  resetChartConfig: () =>
    set({
      colField: null,
      colMode: 'topN',
      colTopN: 5,
      colSelectedItems: [],

      rowField: null,
      rowMode: 'topN',
      rowTopN: 5,
      rowSelectedItems: [],

      metric: null,
      chartType: 'groupedColumn',
    }),
}))
