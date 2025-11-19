// src/stores/dashboardStore.js

import { create } from 'zustand'

export const useDashboardStore = create((set, get) => ({
  // 기존 상태
  timePreset: '1H',
  customRange: null,
  live: false,
  filters: {},

  // SSE 관련 상태
  realtimeData: [],
  isWebSocketConnected: false,
  lastUpdateTime: null,

  // 시간 프리셋 변경
  setTimePreset: (preset) => set({ timePreset: preset, customRange: null }),

  // 커스텀 시간 범위 설정
  setCustomRange: (range) => set({ customRange: range, timePreset: null }),

  // 실시간 모드 토글
  toggleLive: () => set((state) => ({ live: !state.live })),

  // 필터 설정
  setFilters: (filters) => set({ filters }),

  // 필터 초기화
  resetFilters: () => set({ filters: {} }),

  // ⭐ 실시간 데이터 추가 (중복 제거 로직 추가!)
  addRealtimeData: (newData) =>
    set((state) => {
      // ⭐ 1. 기존 데이터의 timestamp Set 생성 (빠른 중복 체크)
      const existingTimestamps = new Set(state.realtimeData.map((d) => d.tsServer))

      // ⭐ 2. 중복되지 않은 새 데이터만 필터링
      const uniqueNewData = newData.filter((d) => !existingTimestamps.has(d.tsServer))

      console.log('📊 중복 제거:', {
        받은데이터: newData.length,
        중복제거후: uniqueNewData.length,
        제거된개수: newData.length - uniqueNewData.length,
      })

      // ⭐ 3. 기존 데이터와 병합
      const combined = [...state.realtimeData, ...uniqueNewData]

      // ⭐ 4. 최근 1000개만 유지
      const trimmed = combined.slice(-1000)

      return {
        realtimeData: trimmed,
        lastUpdateTime: new Date().toISOString(),
      }
    }),

  // SSE 연결 상태 설정
  setWebSocketConnected: (connected) => set({ isWebSocketConnected: connected }),

  // 실시간 데이터 초기화
  clearRealtimeData: () =>
    set({
      realtimeData: [],
      lastUpdateTime: null,
    }),

  // 필터가 적용된 실시간 데이터 가져오기
  getFilteredRealtimeData: () => {
    const { realtimeData, filters } = get()

    // 필터가 없으면 전체 데이터 반환
    if (Object.keys(filters).length === 0) {
      return realtimeData
    }

    // 필터 적용
    return realtimeData.filter((item) => {
      // 국가 필터
      if (filters.countries?.length > 0) {
        if (!filters.countries.includes(item.countryNameReq)) {
          return false
        }
      }

      // 브라우저 필터
      if (filters.browsers?.length > 0) {
        if (!filters.browsers.includes(item.userAgentSoftwareName)) {
          return false
        }
      }

      // 디바이스 필터
      if (filters.devices?.length > 0) {
        if (!filters.devices.includes(item.userAgentHardwareType)) {
          return false
        }
      }

      // HTTP Method 필터
      if (filters.httpMethods?.length > 0) {
        if (!filters.httpMethods.includes(item.httpMethod)) {
          return false
        }
      }

      // HTTP Host 필터
      if (filters.httpHost) {
        if (item.httpHost !== filters.httpHost) {
          return false
        }
      }

      // HTTP URI 필터
      if (filters.httpUri) {
        if (!item.httpUri?.includes(filters.httpUri)) {
          return false
        }
      }

      // HTTP 응답 코드 필터
      if (filters.httpResCode) {
        const code = parseInt(item.httpResCode)
        const filterCode = parseInt(filters.httpResCode)
        const operator = filters.httpResCodeOperator || '>='

        switch (operator) {
          case '>=':
            if (code < filterCode) return false
            break
          case '<=':
            if (code > filterCode) return false
            break
          case '==':
            if (code !== filterCode) return false
            break
          default:
            break
        }
      }

      // 응답 시간 필터 (tsPage)
      if (filters.minResponseTime !== undefined) {
        if ((item.tsPage || 0) < filters.minResponseTime) {
          return false
        }
      }

      if (filters.maxResponseTime !== undefined) {
        if ((item.tsPage || 0) > filters.maxResponseTime) {
          return false
        }
      }

      // 시간 범위 필터
      if (filters.timeRange) {
        const itemTime = new Date(item.tsServer)
        if (filters.timeRange.start && itemTime < new Date(filters.timeRange.start)) {
          return false
        }
        if (filters.timeRange.end && itemTime > new Date(filters.timeRange.end)) {
          return false
        }
      }

      return true
    })
  },

  // 통계 계산 (필터 적용)
  getStats: () => {
    const { realtimeData } = get()
    const filteredData = get().getFilteredRealtimeData()

    const totalCount = realtimeData.length
    const filteredCount = filteredData.length

    // 평균 응답 시간
    const avgResponseTime =
      filteredCount > 0
        ? filteredData.reduce((sum, item) => sum + (item.tsPage || 0), 0) / filteredCount
        : 0

    // 국가별 카운트
    const countryCount = {}
    filteredData.forEach((item) => {
      const country = item.countryNameReq || 'Unknown'
      countryCount[country] = (countryCount[country] || 0) + 1
    })

    // HTTP 메서드별 카운트
    const methodCount = {}
    filteredData.forEach((item) => {
      const method = item.httpMethod || 'Unknown'
      methodCount[method] = (methodCount[method] || 0) + 1
    })

    // 응답 코드별 카운트
    const statusCodeCount = {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0,
      Other: 0,
    }
    filteredData.forEach((item) => {
      const code = item.httpResCode
      if (!code) {
        statusCodeCount['Other']++
      } else if (code.startsWith('2')) {
        statusCodeCount['2xx']++
      } else if (code.startsWith('3')) {
        statusCodeCount['3xx']++
      } else if (code.startsWith('4')) {
        statusCodeCount['4xx']++
      } else if (code.startsWith('5')) {
        statusCodeCount['5xx']++
      } else {
        statusCodeCount['Other']++
      }
    })

    return {
      totalCount,
      filteredCount,
      avgResponseTime,
      countryCount,
      methodCount,
      statusCodeCount,
    }
  },
}))
