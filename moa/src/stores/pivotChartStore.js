import { create } from 'zustand'

export const usePivotChartStore = create((set) => ({
  isChartMode: false,
  isConfigOpen: false, // 추가

  xField: null,
  xMode: 'topN',
  xTopN: 5,
  xSelectedItems: [],

  yMetrics: [],
  chartType: 'bar',

  setIsChartMode: (v) => set({ isChartMode: v }),
  setIsConfigOpen: (v) => set({ isConfigOpen: v }), // 추가

  setXField: (field) => set({ xField: field }),
  setXMode: (mode) => set({ xMode: mode }),
  setXTopN: (n) => set({ xTopN: n }),
  setXSelectedItems: (items) => set({ xSelectedItems: items }),

  setYMetrics: (updater) =>
    set((s) => ({
      yMetrics: typeof updater === 'function' ? updater(s.yMetrics) : updater,
    })),
  setChartType: (type) => set({ chartType: type }),

  resetChartConfig: () =>
    set({
      xField: null,
      xMode: 'topN',
      xTopN: 10,
      xSelectedItems: [],
      yMetrics: [],
      chartType: 'bar', // null 대신 기본값
    }),
}))
