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
 * - 예: 1H → 5분(300s), 24H → 15분(900s), 7D → 1시간(3600s)
 */
const presetToStepSec = (p) => {
  if (p === '24H') return 900
  if (p === '7D') return 3600
  return 300
}

/**
 * 대시보드 공통 파라미터 (store → API payload 기본값)
 */
export const useDashboardParams = () => {
  const { layer, timePreset, customRange, live, filters } = useDashboardStore()
  const now = Date.now()
  const toEpoch = Math.floor(now / 1000)
  const fromEpoch = customRange
    ? customRange.fromEpoch
    : Math.floor((now - presetToMs(timePreset ?? '1H')) / 1000)

  const step = presetToStepSec(timePreset ?? '1H')

  return { layer, fromEpoch, toEpoch, step, live, filters }
}

/**
 * 공통 queryKey (동일 key면 캐시 공유)
 */
const dashboardKey = ({ layer, fromEpoch, toEpoch, step, filters }) => [
  'dashboard',
  layer,
  fromEpoch,
  toEpoch,
  step,
  filters ?? null,
]

/**
 * 원본 응답(통합)을 그대로 가져오는 기본 훅
 * - 필요 시 컴포넌트에서 data.trafficTrend 처럼 직접 사용
 */
export const useDashboardAggregated = () => {
  const { layer, fromEpoch, toEpoch, step, live, filters } = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey({ layer, fromEpoch, toEpoch, step, filters }),
    queryFn: () => fetchDashboardApi({ layer, range: { fromEpoch, toEpoch }, step, filters }),
    refetchInterval: live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

/**
 * 위젯별 셀렉터 훅
 * - 같은 queryKey를 사용하므로 네트워크 호출은 1회, 각 훅은 select로 필요한 조각만 반환
 */

// 1) 트래픽 추이
export const useTrafficTrend = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        layer: p.layer,
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const list = d?.trafficTrend ?? []
      // 차트용 shape으로 정규화
      const points = list.map((it) => ({
        t: it.timestamp, // ISO string
        req: Number(it.requestCount || 0),
        res: Number(it.responseCount || 0),
      }))
      return { points, stepSec: p.step }
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 2) TCP 에러율
export const useTcpErrorRate = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        layer: p.layer,
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

// 3) 국가별 트래픽
export const useTrafficByCountry = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        layer: p.layer,
        range: { fromEpoch: p.fromEpoch, toEpoch: p.toEpoch },
        step: p.step,
        filters: p.filters,
      }),
    select: (d) => {
      const rows = (d?.trafficByCountry ?? []).map((it) => ({
        country: it.countryName,
        volume: Number(it.trafficVolume || 0),
        requests: Number(it.requestCount || 0),
        pct: Number(it.percentage || 0),
      }))
      // 기본: 트래픽량 내림차순
      rows.sort((a, b) => b.volume - a.volume)
      return rows
    },
    refetchInterval: p.live ? 5000 : false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

// 4) HTTP 상태 코드 묶음
export const useHttpStatusCodes = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        layer: p.layer,
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

// 5) 상위 도메인
export const useTopDomains = (limit = 10) => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        layer: p.layer,
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

// 6) 응답 시간 통계
export const useResponseTime = () => {
  const p = useDashboardParams()
  return useQuery({
    queryKey: dashboardKey(p),
    queryFn: () =>
      fetchDashboardApi({
        layer: p.layer,
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
