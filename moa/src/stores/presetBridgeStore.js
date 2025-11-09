import { create } from 'zustand'

export const usePresetBridgeStore = create((set, get) => ({
  searchSpec: null,
  pivotSpec: null,

  setSearchSpec: (spec) => set({ searchSpec: spec }),
  setPivotSpec: (spec) => set({ pivotSpec: spec }),

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
}))
