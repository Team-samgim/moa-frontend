import { create } from 'zustand'

export const usePresetBridgeStore = create((set, get) => ({
  searchSpec: null,
  pivotSpec: null,
  chartSpec: null,

  setSearchSpec: (spec) => set({ searchSpec: spec }),
  setPivotSpec: (spec) => set({ pivotSpec: spec }),
  setChartSpec: (spec) => set({ chartSpec: spec }),

  takeSearchSpec: () => {
    const v = get().searchSpec
    set({ searchSpec: null })
    return v
  },
  takePivotSpec: () => {
    const v = get().pivotSpec
    set({ pivotSpec: null })
    return v
  },
  takeChartSpec: () => {
    const v = get().chartSpec
    set({ chartSpec: null })
    return v
  },
}))
