import { useQuery } from '@tanstack/react-query'
import { fetchDashboardApi } from '@/api/dashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

/**
 * 프리셋 → 밀리초
 */
const presetToMs = (p) => {
  if (p === '1H') return 60 * 60 * 1000
  if (p === '24H') return 24 * 60 * 60 * 1000
  if (p === '7D') return 7 * 24 * 60 * 60 * 1000
  return 60 * 60 * 1000
}

/**
 * 프리셋 → step(초)
 */
const presetToStepSec = (p) => {
  if (p === '24H') return 900
  if (p === '7D') return 3600
  return 300
}

/**
 * 대시보드 공통 파라미터 (store → API payload)
 * ✅ filters 포함
 */
export const useDashboardParams = () => {
  const { timePreset, customRange, live, filters } = useDashboardStore()
  const now = Date.now()
  const toEpoch = Math.floor(now / 1000)
  const fromEpoch = customRange
    ? customRange.fromEpoch
    : Math.floor((now - presetToMs(timePreset ?? '1H')) / 1000)

  const step = presetToStepSec(timePreset ?? '1H')

  // ✅ 백엔드 형식에 맞게 필터 변환
  const formattedFilters = {
    countries: filters.countries || [],
    browsers: filters.browsers || [],
    devices: filters.devices || [],
    httpMethods: filters.httpMethods || [],
    httpHost: filters.httpHost || null,
    httpUri: filters.httpUri || null,
    httpResCode: filters.httpResCode
      ? {
          operator: filters.httpResCodeOperator || '>=',
          value: parseFloat(filters.httpResCode),
        }
      : null,
  }

  return { fromEpoch, toEpoch, step, live, filters: formattedFilters }
}

/**
 * 공통 queryKey (필터 포함)
 */
const dashboardKey = ({ fromEpoch, toEpoch, step, filters }) => [
  'dashboard',
  fromEpoch,
  toEpoch,
  step,
  filters ?? null,
]

/**
 * 원본 응답(통합)을 그대로 가져오는 기본 훅
 */
export const useDashboardAggregated = () => {
  const { fromEpoch, toEpoch, step, live, filters } = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey({ fromEpoch, toEpoch, step, filters }),
    queryFn: () => fetchDashboardApi({ range: { fromEpoch, toEpoch }, step, filters }),
    refetchInterval: live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * 위젯별 셀렉터 훅
 */

// 1) 트래픽 추이
export const useTrafficTrend = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const list = d?.trafficTrend ?? []
      const points = list.map((it) => ({
        t: it.timestamp,
        req: Number(it.mbpsReq || 0),
        res: Number(it.mbpsRes || 0),
        requestCount: Number(it.requestCount || 0),
        responseCount: Number(it.responseCount || 0),
      }))
      return { points, stepSec: p.step }
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 2) 페이지 로드 시간 트렌드 ⭐ 신규 추가
export const usePageLoadTimeTrend = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const list = d?.pageLoadTimeTrend ?? []
      const points = list.map((it) => ({
        t: it.timestamp,
        avg: Number(it.avgPageLoadTime || 0),
        min: Number(it.minPageLoadTime || 0),
        max: Number(it.maxPageLoadTime || 0),
        p95: Number(it.p95PageLoadTime || 0),
        p99: Number(it.p99PageLoadTime || 0),
      }))
      return { points, stepSec: p.step }
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 3) TCP 에러율
export const useTcpErrorRate = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const e = d?.tcpErrorRate ?? {}
      const safeNum = (v) => Number(v || 0)
      return {
        totalErrorRate: safeNum(e.totalErrorRate),
        retransmissionRate: safeNum(e.retransmissionRate),
        outOfOrderRate: safeNum(e.outOfOrderRate),
        lostSegmentRate: safeNum(e.lostSegmentRate),
        totalErrors: safeNum(e.totalErrors),
        totalPackets: safeNum(e.totalPackets),
      }
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 4) 국가별 트래픽
export const useTrafficByCountry = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const rows = (d?.trafficByCountry ?? []).map((it) => ({
        countryName: it.countryName,
        trafficVolume: Number(it.trafficVolume || 0),
        requestCount: Number(it.requestCount || 0),
        percentage: Number(it.percentage || 0),
      }))
      rows.sort((a, b) => b.trafficVolume - a.trafficVolume)
      return rows
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 5) HTTP 상태 코드 묶음
export const useHttpStatusCodes = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const s = d?.httpStatusCodes ?? {}
      const safe = (k) => Number(s[k] || 0)
      const total = safe('totalCount')
      const success = safe('successCount')
      const redirect = safe('redirectCount')
      const client = safe('clientErrorCount')
      const server = safe('serverErrorCount')
      const pct = (n) => (total > 0 ? +((n / total) * 100).toFixed(2) : 0)
      return {
        total,
        buckets: {
          success: { count: success, pct: pct(success) },
          redirect: { count: redirect, pct: pct(redirect) },
          client: { count: client, pct: pct(client) },
          server: { count: server, pct: pct(server) },
        },
      }
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 6) 상위 도메인
export const useTopDomains = (limit = 10) => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const rows = (d?.topDomains ?? []).map((it) => ({
        domain: it.domain,
        requests: Number(it.requestCount || 0),
        volume: Number(it.trafficVolume || 0),
        pct: Number(it.percentage || 0),
      }))
      rows.sort((a, b) => b.requests - a.requests)
      return rows.slice(0, limit)
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 7) 응답 시간 통계
export const useResponseTime = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const r = d?.responseTime ?? {}
      const safe = (k) => Number(r[k] || 0)
      return {
        min: safe('minResponseTime'),
        avg: safe('avgResponseTime'),
        max: safe('maxResponseTime'),
        p50: safe('p50ResponseTime'),
        p95: safe('p95ResponseTime'),
        p99: safe('p99ResponseTime'),
        totalRequests: safe('totalRequests'),
        stepSec: p.step,
      }
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
