import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  layer: 'HTTP_PAGE',
  timePreset: '1H', // '1H' | '24H' | '7D' ...
  customRange: null, // {fromEpoch, toEpoch}
  live: true, // 라이브 업데이트(폴링)
  setLayer: (layer) => set({ layer }),
  setTimePreset: (timePreset) => set({ timePreset, customRange: null }),
  setCustomRange: (range) => set({ customRange: range, timePreset: null }),
  setLive: (live) => set({ live }),
}))
