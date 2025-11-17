import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // 기존 상태
  timePreset: '1H', // '1H' | '24H' | '7D'
  customRange: null,
  live: false,
  filters: {}, // ✅ 필터 추가

  // 시간 프리셋 변경
  setTimePreset: (preset) => set({ timePreset: preset, customRange: null }),

  // 커스텀 시간 범위 설정
  setCustomRange: (range) => set({ customRange: range, timePreset: null }),

  // 실시간 모드 토글
  toggleLive: () => set((state) => ({ live: !state.live })),

  // ✅ 필터 설정
  setFilters: (filters) => set({ filters }),

  // ✅ 필터 초기화
  resetFilters: () => set({ filters: {} }),
}))
