/**
 * 작성자: 정소영
 */
import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

const WINDOW_MS = 60 * 60 * 1000 // 1시간 슬라이딩 윈도우

const ErrorPagesTop10 = ({ onClose }) => {
  const [errorDataPoints, setErrorDataPoints] = useState([]) // ⭐ 시간별 에러 데이터 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드 - 실제 timestamp 사용
  useEffect(() => {
    if (!isLoading && dbData?.errorPages && !isInitialized) {
      // ⭐ 실제 timestamp 사용 (백엔드에서 제공)
      const now = Date.now()
      const points = dbData.errorPages.flatMap((item) => {
        // 에러 건수만큼 포인트 생성 (너무 많으면 100개로 제한)
        const count = Math.min(item.errorCount ?? 1, 100)

        // ✅ 백엔드에서 timestamp가 오면 사용, 없으면 현재 시간
        const baseTimestamp = item.timestamp ? new Date(item.timestamp).getTime() : now

        return Array(count)
          .fill(null)
          .map((_, idx) => ({
            // ✅ 실제 timestamp 사용 (같은 시간대 데이터는 약간의 오프셋만 추가)
            timestamp: baseTimestamp + idx,
            httpUri: item.httpUri || 'Unknown',
            httpResCode: item.httpResCode || '???',
            responseTime: item.avgResponseTime ?? 0,
            severity: item.severity || 'MEDIUM',
          }))
      })

      setErrorDataPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setErrorDataPoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => p.timestamp >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        // if (filtered.length !== prev.length) {
        //   console.log('🕐 [ErrorPagesTop10] 슬라이딩 윈도우 적용:', {
        //     이전: prev.length,
        //     이후: filtered.length,
        //     제거된: prev.length - filtered.length,
        //   })
        // }

        return filtered
      })
    }, 60 * 1000) // 1분마다 체크

    return () => clearInterval(interval)
  }, [isInitialized])

  // ✅ 5. SSE 연결되면 실시간 데이터 추가
  useEffect(() => {
    if (!isConnected || !isInitialized) {
      return // 👈 실시간 연결 안 됐으면 처리 안 함
    }

    if (realtimeData.length === 0) {
      return // 👈 실시간 데이터 없으면 처리 안 함
    }

    // ⚠️ 실제 SSE 데이터 구조 확인용 로그 (필드명 확인 후 제거 가능)
    // if (realtimeData.length > 0) {
    //   const sample = realtimeData[0]
    //   console.log('📦 [ErrorPagesTop10] 첫 번째 실시간 데이터 샘플:', {
    //     httpResCode: sample.httpResCode,
    //     httpUri: sample.httpUri,
    //     uri: sample.uri,
    //     tsPage: sample.tsPage,
    //     responseTime: sample.responseTime,
    //     avgResponseTime: sample.avgResponseTime,
    //   })
    // }

    setErrorDataPoints((prev) => {
      // 실시간 데이터에서 에러만 필터링
      // ⚠️ 실제 SSE 데이터 필드명: httpResCode (HTTP 응답 코드), httpUri (URI), tsPage (페이지 로드 시간, 초 단위)
      const newPoints = realtimeData
        .filter((item) => {
          // HTTP 응답 코드 필드 확인: httpResCode
          const statusCode = item.httpResCode
          if (!statusCode) return false

          // 숫자로 변환 시도
          const code = parseInt(statusCode)
          // 4xx, 5xx 에러만 필터링
          return code >= 400 && code < 600
        })
        .map((item) => {
          // URI 필드 확인: httpUri (우선), uri, httpUriSplit (fallback)
          const uri = item.httpUri || item.uri || item.httpUriSplit || 'Unknown'

          // HTTP 응답 코드 필드 확인: httpResCode
          const httpResCode = item.httpResCode || '???'

          // 응답 시간 필드 확인: tsPage (페이지 로드 시간, 초 단위) 또는 responseTime
          const responseTime = item.tsPage || item.responseTime || item.avgResponseTime || 0

          return {
            // ✅ 실제 timestamp 사용
            timestamp: new Date(item.tsServer || new Date()).getTime(),
            httpUri: uri,
            httpResCode: httpResCode,
            responseTime: responseTime,
            severity: item.severity || determineSeverity(httpResCode),
          }
        })

      // 기존 데이터와 병합
      const combined = [...prev, ...newPoints]

      // ⭐ 1시간 이내 데이터만 유지 (슬라이딩 윈도우)
      const cutoff = Date.now() - WINDOW_MS
      const filtered = combined.filter((p) => p.timestamp >= cutoff)

      return filtered
    })
  }, [realtimeData, isConnected, isInitialized])

  // ✅ 6. URI별로 집계된 데이터 계산 및 Top 10 추출 (슬라이딩 윈도우 적용된 데이터만 사용)
  const top10 = useMemo(() => {
    // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 필터링
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const filteredPoints = errorDataPoints.filter((p) => p.timestamp >= cutoff)

    if (filteredPoints.length === 0) return []

    // URI별로 그룹화
    const uriMap = new Map()

    filteredPoints.forEach((point) => {
      const key = `${point.httpUri}-${point.httpResCode}` // URI + 에러코드 조합
      const existing = uriMap.get(key)

      if (existing) {
        existing.errorCount += 1
        existing.totalResponseTime += point.responseTime
      } else {
        uriMap.set(key, {
          httpUri: point.httpUri,
          httpResCode: point.httpResCode,
          errorCount: 1,
          totalResponseTime: point.responseTime,
          severity: point.severity,
        })
      }
    })

    // 평균 계산 및 배열 변환
    const aggregated = Array.from(uriMap.values()).map((item) => ({
      httpUri: item.httpUri,
      httpResCode: item.httpResCode,
      errorCount: item.errorCount,
      avgResponseTime: item.errorCount > 0 ? item.totalResponseTime / item.errorCount : 0,
      severity: item.severity,
    }))

    // errorCount 기준 내림차순 정렬 후 Top 10
    const result = aggregated.sort((a, b) => b.errorCount - a.errorCount).slice(0, 10)

    return result
  }, [errorDataPoints])

  // ✅ 데이터 소스 표시
  const dataSource = isConnected ? '실시간' : 'DB'
  const totalErrors = errorDataPoints.length

  let content

  if (isLoading && errorDataPoints.length === 0) {
    // ✅ 처음에 DB에서 아직 아무 데이터도 안 들어온 상태일 때만 로딩 표시
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>에러 페이지 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        에러 페이지 정보를 불러오지 못했습니다.
      </div>
    )
  } else if (errorDataPoints.length === 0) {
    // ✅ 요청은 끝났는데도 데이터가 없을 때
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 에러 페이지가 없습니다.
      </div>
    )
  } else {
    // ✅ 데이터가 한 번이라도 들어오면, 이후 refetch로 isLoading이 true가 돼도 리스트는 그대로 유지
    content = (
      <div className='space-y-3 overflow-y-auto' style={{ maxHeight: '400px' }}>
        {top10.map((item) => {
          const uri = item.httpUri
          const errorCode = item.httpResCode
          const errorCount = item.errorCount
          const avgTime = item.avgResponseTime
          const severity = item.severity

          // 에러 코드에 따른 색상
          const isClientError = String(errorCode).startsWith('4')
          const isServerError = String(errorCode).startsWith('5')

          let codeBg = 'bg-gray-100'
          let codeText = 'text-gray-700'
          let borderColor = 'border-gray-300'

          if (isServerError) {
            codeBg = 'bg-red-100'
            codeText = 'text-red-700'
            borderColor = 'border-red-300'
          } else if (isClientError) {
            codeBg = 'bg-orange-100'
            codeText = 'text-orange-700'
            borderColor = 'border-orange-300'
          }

          // 심각도 배지
          let severityBg = 'bg-yellow-100'
          let severityText = 'text-yellow-700'
          let severityLabel = '보통'

          if (severity === 'HIGH' || severity === 'CRITICAL') {
            severityBg = 'bg-red-100'
            severityText = 'text-red-700'
            severityLabel = '높음'
          } else if (severity === 'LOW') {
            severityBg = 'bg-blue-100'
            severityText = 'text-blue-700'
            severityLabel = '낮음'
          }

          return (
            <div
              key={`${uri}-${errorCode}`} // ⭐ key를 URI+에러코드 조합으로 설정
              className={`rounded-lg border-l-4 ${borderColor} bg-white p-3 shadow-sm transition-all duration-300 hover:shadow-md`}
            >
              <div className='flex items-start gap-3'>
                {/* 왼쪽: 에러 코드 */}
                <div className='flex flex-col items-center gap-1'>
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-lg font-bold transition-all duration-300 ${codeBg} ${codeText}`}
                  >
                    {errorCode}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-300 ${severityBg} ${severityText}`}
                  >
                    {severityLabel}
                  </span>
                </div>

                {/* 오른쪽: URI + 정보 */}
                <div className='flex-1'>
                  {/* URI */}
                  <div className='mb-1 text-xs font-medium text-gray-700' title={uri}>
                    {uri.length > 60 ? uri.slice(0, 60) + '...' : uri}
                  </div>

                  {/* 통계 */}
                  <div className='flex items-center gap-4 text-xs text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <span className='text-gray-500'>에러:</span>
                      <span className='font-semibold text-red-600 transition-all duration-300'>
                        {errorCount.toLocaleString()}건
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='text-gray-500'>응답:</span>
                      <span className='font-semibold transition-all duration-300'>
                        {avgTime.toFixed(2)}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <WidgetCard
      title='에러 페이지 Top 10'
      description={`에러 건수가 많은 URI (${dataSource} - ${totalErrors}건, 최근 1시간)`}
      icon='🧯'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

ErrorPagesTop10.propTypes = {
  onClose: PropTypes.func,
}

export default ErrorPagesTop10

// ✅ 에러 코드로 심각도 자동 판단
function determineSeverity(statusCode) {
  if (!statusCode) return 'MEDIUM'

  const code = parseInt(statusCode)

  // 5xx 서버 에러
  if (code >= 500 && code < 600) {
    if (code === 500 || code === 502 || code === 503) {
      return 'HIGH' // 서비스 장애 관련
    }
    return 'MEDIUM'
  }

  // 4xx 클라이언트 에러
  if (code >= 400 && code < 500) {
    if (code === 401 || code === 403) {
      return 'MEDIUM' // 인증/권한 문제
    }
    if (code === 404) {
      return 'LOW' // Not Found는 상대적으로 낮음
    }
    return 'LOW'
  }

  return 'LOW'
}
