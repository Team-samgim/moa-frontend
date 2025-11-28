// 작성자: 최이서
import { create } from 'zustand'

export const usePivotChartStore = create((set, get) => ({
  isChartMode: false,
  isConfigOpen: false,

  colField: null, // ex) 'country_name_res'
  colMode: 'topN', // 'topN' | 'manual'
  colTopN: 5, // 기본 5, 최대 6
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

  setAxisAndMetric: ({ colField, rowField, metric }) =>
    set({
      colField,
      rowField,
      metric,
    }),

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

  // 레이아웃 계산 (차트를 여러 개 그릴지 결정)
  getLayout: () => {
    const state = get()
    const { colMode, colTopN, colSelectedItems, chartType } = state

    // multiplePie는 기존 로직 사용 (단일 차트에 여러 파이)
    if (chartType === 'multiplePie') {
      return { chartsPerRow: null }
    }

    // Column 항목 개수 결정
    let columnCount = 0
    if (colMode === 'topN') {
      columnCount = colTopN
    } else if (colMode === 'manual') {
      columnCount = colSelectedItems.length
    }

    // 1~4개: 2개씩, 5~6개: 3개씩
    if (columnCount >= 1 && columnCount <= 4) {
      return { chartsPerRow: 2 }
    } else if (columnCount >= 5 && columnCount <= 6) {
      return { chartsPerRow: 3 }
    }

    // 기본값 (단일 차트)
    return { chartsPerRow: null }
  },
}))
