// TopDomains.jsx
import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

const WINDOW_MS = 60 * 60 * 1000 // 1시간 슬라이딩 윈도우

const TopDomains = ({ onClose }) => {
  const [uriDataPoints, setUriDataPoints] = useState([]) // ⭐ 시간별 URI 데이터 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드 - 실제 timestamp 사용
  useEffect(() => {
    if (!isLoading && dbData?.topDomains && !isInitialized) {
      console.log('📊 [TopDomains] DB 초기 데이터 로드:', dbData.topDomains.length)

      // ⭐ 실제 timestamp 사용 (백엔드에서 제공)
      const now = Date.now()
      const points = dbData.topDomains.flatMap((item) => {
        const count = Math.min(item.requestCount ?? 1, 100) // 최대 100개로 제한
        const uri = item.httpUri || 'Unknown'
        const avgTime = item.avgResponseTime ?? 0

        // ✅ 백엔드에서 timestamp가 오면 사용, 없으면 현재 시간
        const baseTimestamp = item.timestamp ? new Date(item.timestamp).getTime() : now

        return Array(count)
          .fill(null)
          .map((_, idx) => ({
            // ✅ 실제 timestamp 사용 (같은 시간대 데이터는 약간의 오프셋만 추가)
            timestamp: baseTimestamp + idx,
            httpUri: uri,
            responseTime: avgTime, // DB는 평균값만 있으므로 그대로 사용
          }))
      })

      console.log(
        `📊 [TopDomains] DB 데이터 ${points.length}개 포인트 로드 완료 (실제 timestamp 사용)`,
      )
      setUriDataPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setUriDataPoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => p.timestamp >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        if (filtered.length !== prev.length) {
          console.log('🕐 [TopDomains] 슬라이딩 윈도우 적용:', {
            이전: prev.length,
            이후: filtered.length,
            제거된: prev.length - filtered.length,
          })
        }

        return filtered
      })
    }, 60 * 1000) // 1분마다 체크

    return () => clearInterval(interval)
  }, [isInitialized])

  // ✅ 5. SSE 연결되면 실시간 데이터 추가
  useEffect(() => {
    if (!isConnected || !isInitialized) {
      return // 👈 SSE 연결 안 됐거나 초기화 안 됐으면 리턴
    }

    if (realtimeData.length === 0) {
      return // 👈 실시간 데이터 없으면 리턴
    }

    console.log('📡 [TopDomains] 실시간 데이터 추가:', realtimeData.length)

    setUriDataPoints((prev) => {
      // 실시간 데이터를 포인트로 변환
      const newPoints = realtimeData
        .map((item) => {
          // URI 필드 확인: httpUri 또는 uri
          const uri = item.httpUri || item.uri || item.httpUriSplit
          if (!uri) return null

          // 응답 시간 필드 확인: tsPage 또는 responseTime
          const responseTime = item.tsPage || item.responseTime || item.avgResponseTime || 0
          if (responseTime <= 0) return null

          return {
            // ✅ 실제 timestamp 사용
            timestamp: new Date(item.tsServer || new Date()).getTime(),
            httpUri: uri,
            responseTime: responseTime,
          }
        })
        .filter((p) => p !== null)

      // 기존 데이터와 병합
      const combined = [...prev, ...newPoints]

      // ⭐ 1시간 이내 데이터만 유지 (시간 기반 슬라이딩 윈도우)
      const now = Date.now()
      const cutoff = now - WINDOW_MS
      const filtered = combined.filter((p) => p.timestamp >= cutoff)

      console.log(
        `🔄 [TopDomains] 슬라이딩 윈도우: ${combined.length}개 → ${filtered.length}개 (${combined.length - filtered.length}개 제거)`,
      )

      return filtered
    })
  }, [realtimeData, isConnected, isInitialized])

  // ✅ 6. URI별로 집계된 데이터 계산 및 Top 10 추출 (슬라이딩 윈도우 적용된 데이터만 사용)
  const { top10, maxTime } = useMemo(() => {
    // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 필터링
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const filteredPoints = uriDataPoints.filter((p) => p.timestamp >= cutoff)

    if (filteredPoints.length === 0) {
      return { top10: [], maxTime: 1 }
    }

    // URI별로 그룹화
    const uriMap = new Map()

    filteredPoints.forEach((point) => {
      const uri = point.httpUri
      const existing = uriMap.get(uri)

      if (existing) {
        existing.requestCount += 1
        existing.totalResponseTime += point.responseTime
      } else {
        uriMap.set(uri, {
          httpUri: uri,
          requestCount: 1,
          totalResponseTime: point.responseTime,
        })
      }
    })

    // 평균 계산 및 배열 변환
    const aggregated = Array.from(uriMap.values()).map((item) => ({
      httpUri: item.httpUri,
      requestCount: item.requestCount,
      avgResponseTime: item.requestCount > 0 ? item.totalResponseTime / item.requestCount : 0,
    }))

    // 평균 응답시간 기준 내림차순 정렬 후 Top 10
    const sorted = aggregated.sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10)

    const max = Math.max(...sorted.map((d) => d.avgResponseTime), 1)

    console.log('📊 [TopDomains] Top 10 집계 완료:', sorted)
    return { top10: sorted, maxTime: max }
  }, [uriDataPoints])

  // ✅ 데이터 소스 표시
  const dataSource = isConnected ? '실시간' : 'DB'
  const totalCount = uriDataPoints.length

  let content

  if (isLoading && uriDataPoints.length === 0) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>느린 URI 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-red-500'>
        느린 URI 정보를 불러오지 못했습니다.
      </div>
    )
  } else if (uriDataPoints.length === 0) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        표시할 URI 데이터가 없습니다.
      </div>
    )
  } else {
    content = (
      <div className='space-y-2 overflow-y-auto' style={{ maxHeight: '400px' }}>
        {top10.map((item, idx) => {
          const avgTime = item.avgResponseTime
          const count = item.requestCount
          const uri = item.httpUri
          const percentage = (avgTime / maxTime) * 100

          // 상위 3개는 경고색
          let barColor = 'bg-blue-500'
          let badgeBg = 'bg-blue-100'
          let badgeText = 'text-blue-700'

          if (idx === 0) {
            barColor = 'bg-red-500'
            badgeBg = 'bg-red-100'
            badgeText = 'text-red-700'
          } else if (idx === 1) {
            barColor = 'bg-orange-500'
            badgeBg = 'bg-orange-100'
            badgeText = 'text-orange-700'
          } else if (idx === 2) {
            barColor = 'bg-yellow-500'
            badgeBg = 'bg-yellow-100'
            badgeText = 'text-yellow-700'
          }

          return (
            <div
              key={uri}
              className='rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md'
            >
              {/* 상단: 순위 + URI */}
              <div className='mb-2 flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${badgeBg} ${badgeText}`}
                  >
                    {idx + 1}
                  </span>
                  <span className='text-xs font-medium text-gray-700' title={uri}>
                    {uri.length > 50 ? uri.slice(0, 50) + '...' : uri}
                  </span>
                </div>
              </div>

              {/* 중단: 프로그레스 바 */}
              <div className='mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100'>
                <div
                  className={`h-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* 하단: 응답시간 + 요청수 */}
              <div className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-3'>
                  <span className='font-semibold text-gray-800 transition-all duration-300'>
                    {avgTime.toFixed(2)}s
                  </span>
                  <span className='text-gray-500'>평균 응답시간</span>
                </div>
                <span className='text-gray-600 transition-all duration-300'>
                  {count.toLocaleString()}건
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <WidgetCard
      title='느린 URI Top 10'
      description={`평균 응답시간이 긴 URI 목록 (${dataSource} - ${totalCount}건, 최근 1시간)`}
      icon='🐢'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

TopDomains.propTypes = {
  onClose: PropTypes.func,
}

export default TopDomains
