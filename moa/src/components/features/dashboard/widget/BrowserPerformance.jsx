// src/components/features/dashboard/widget/BrowserPerformance.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { GraphChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

echarts.use([
  GraphChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

const WINDOW_MS = 60 * 60 * 1000 // 1시간 슬라이딩 윈도우

// 브라우저별 색상 매핑
const browserColors = {
  Chrome: '#4285F4',
  Firefox: '#FF7139',
  Safari: '#006CFF',
  Edge: '#0078D7',
  Opera: '#FF1B2D',
  Brave: '#FB542B',
  Samsung: '#1428A0',
  'Http Client': '#95A5A6',
  Default: '#95A5A6',
}

const BrowserPerformance = ({ onClose }) => {
  const chartRef = useRef(null)
  const [browserDataPoints, setBrowserDataPoints] = useState([]) // ⭐ 시간별 브라우저 데이터 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드 - 실제 timestamp 사용
  useEffect(() => {
    if (!isLoading && dbData?.browserPerformance && !isInitialized) {
      console.log('📊 [BrowserPerformance] DB 초기 데이터 로드:', dbData.browserPerformance.length)

      // ⭐ 실제 timestamp 사용 (백엔드에서 제공)
      const now = Date.now()
      const points = dbData.browserPerformance.flatMap((item) => {
        const count = Math.min(item.requestCount ?? item.sessionCount ?? item.totalCount ?? 1, 100)

        // ✅ 백엔드에서 timestamp가 오면 사용, 없으면 현재 시간
        const baseTimestamp = item.timestamp ? new Date(item.timestamp).getTime() : now

        return Array(count)
          .fill(null)
          .map((_, idx) => ({
            // ✅ 실제 timestamp 사용 (같은 시간대 데이터는 약간의 오프셋만 추가)
            timestamp: baseTimestamp + idx,
            browser: item.browser || 'Unknown',
            avgPageLoadTime: item.avgPageLoadTime ?? 0,
            avgResponseTime: item.avgResponseTime ?? 0,
            requestCount: 1,
          }))
      })

      console.log(
        `📊 [BrowserPerformance] DB 데이터 ${points.length}개 포인트 로드 완료 (실제 timestamp 사용)`,
      )
      setBrowserDataPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setBrowserDataPoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => p.timestamp >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        if (filtered.length !== prev.length) {
          console.log('🕐 [BrowserPerformance] 슬라이딩 윈도우 적용:', {
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
      return // 👈 실시간 연결 안 됐으면 처리 안 함
    }

    if (realtimeData.length === 0) {
      return // 👈 실시간 데이터 없으면 처리 안 함
    }

    console.log('📡 [BrowserPerformance] 실시간 데이터 추가:', realtimeData.length)

    // ⚠️ 실제 SSE 데이터 구조 확인용 로그 (필드명 확인 후 제거 가능)
    if (realtimeData.length > 0) {
      const sample = realtimeData[0]
      console.log('📦 [BrowserPerformance] 첫 번째 실시간 데이터 샘플:', {
        userAgentSoftwareName: sample.userAgentSoftwareName,
        browser: sample.browser,
        userAgent: sample.userAgent,
        tsPage: sample.tsPage,
        pageLoadTime: sample.pageLoadTime,
        avgPageLoadTime: sample.avgPageLoadTime,
        responseTime: sample.responseTime,
        avgResponseTime: sample.avgResponseTime,
      })
    }

    setBrowserDataPoints((prev) => {
      // 실시간 데이터를 포인트로 변환
      // ⚠️ 실제 SSE 데이터 필드명: userAgentSoftwareName (브라우저), tsPage (페이지 로드 시간, 초 단위)
      const newPoints = realtimeData
        .filter((item) => {
          // 브라우저 정보가 있는 것만 필터링
          const browser =
            item.userAgentSoftwareName ||
            item.browser ||
            (item.userAgent ? parseBrowser(item.userAgent) : null)
          return browser
        })
        .map((item) => {
          // 브라우저 필드 확인: userAgentSoftwareName (우선), browser, userAgent 파싱
          const browser =
            item.userAgentSoftwareName ||
            item.browser ||
            (item.userAgent ? parseBrowser(item.userAgent) : null) ||
            'Unknown'

          // 페이지 로드 시간 필드 확인: tsPage (페이지 로드 시간, 초 단위) 또는 pageLoadTime
          const pageLoadTime = item.tsPage || item.pageLoadTime || item.avgPageLoadTime || 0

          // 응답 시간 필드 확인: tsPage (페이지 로드 시간과 동일) 또는 responseTime
          const responseTime = item.tsPage || item.responseTime || item.avgResponseTime || 0

          return {
            // ✅ 실제 timestamp 사용
            timestamp: new Date(item.tsServer || new Date()).getTime(),
            browser,
            avgPageLoadTime: pageLoadTime,
            avgResponseTime: responseTime,
            requestCount: 1,
          }
        })

      // 기존 데이터와 병합
      const combined = [...prev, ...newPoints]

      // ⭐ 1시간 이내 데이터만 유지 (슬라이딩 윈도우)
      const cutoff = Date.now() - WINDOW_MS
      const filtered = combined.filter((p) => p.timestamp >= cutoff)

      console.log(
        `🔄 [BrowserPerformance] 슬라이딩 윈도우 적용: ${combined.length}개 → ${filtered.length}개 (${combined.length - filtered.length}개 제거)`,
      )

      return filtered
    })
  }, [realtimeData, isConnected, isInitialized])

  // ✅ 6. 브라우저별로 집계된 데이터 계산 (슬라이딩 윈도우 적용된 데이터만 사용)
  const aggregatedData = useMemo(() => {
    // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 필터링
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const filteredPoints = browserDataPoints.filter((p) => p.timestamp >= cutoff)

    if (filteredPoints.length === 0) return []

    // 브라우저별로 그룹화
    const browserMap = new Map()

    filteredPoints.forEach((point) => {
      const browser = point.browser
      const existing = browserMap.get(browser)

      if (existing) {
        // 누적 계산
        existing.totalPageLoadTime += point.avgPageLoadTime * point.requestCount
        existing.totalResponseTime += point.avgResponseTime * point.requestCount
        existing.totalCount += point.requestCount
      } else {
        // 새 브라우저 추가
        browserMap.set(browser, {
          browser,
          totalPageLoadTime: point.avgPageLoadTime * point.requestCount,
          totalResponseTime: point.avgResponseTime * point.requestCount,
          totalCount: point.requestCount,
        })
      }
    })

    // 평균 계산 및 배열 변환
    const result = Array.from(browserMap.values()).map((item) => ({
      browser: item.browser,
      avgPageLoadTime: item.totalCount > 0 ? item.totalPageLoadTime / item.totalCount : 0,
      avgResponseTime: item.totalCount > 0 ? item.totalResponseTime / item.totalCount : 0,
      requestCount: item.totalCount,
    }))

    console.log('📊 [BrowserPerformance] 집계 완료:', result)
    return result
  }, [browserDataPoints])

  // ✅ 6. 차트 옵션 생성
  const option = useMemo(() => {
    if (aggregatedData.length === 0) return {}

    const volumes = aggregatedData.map((b) => b.requestCount)
    const totalVolume = volumes.reduce((sum, v) => sum + v, 0) || 1

    const nodes = aggregatedData.map((b, idx) => {
      const load = b.avgPageLoadTime
      const resp = b.avgResponseTime
      const volume = volumes[idx]
      const share = (volume / totalVolume) * 100

      const browserName = b.browser
      const color = browserColors[browserName] || browserColors.Default

      // ⭐ 이름 축약 (최대 12자)
      let displayName = browserName
      if (browserName.length > 12) {
        displayName = browserName.substring(0, 10) + '..'
      }

      return {
        id: `browser-${idx}`,
        name: displayName,
        value: share,
        symbolSize: Math.max(45, Math.min(90, 45 + (share / 100) * 45)), // 크기 범위 축소
        itemStyle: {
          color: color,
          opacity: 0.9,
        },
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 700,
          formatter: '{b}', // 이름만 표시
        },
        // tooltip에서 사용할 추가 데이터
        tooltipData: {
          name: browserName, // 원본 이름
          load,
          resp,
          volume,
          share,
        },
      }
    })

    return {
      tooltip: {
        trigger: 'item',
        formatter: (param) => {
          if (!param || !param.data) return ''
          const { tooltipData } = param.data
          if (!tooltipData) return ''

          const { name: rawName, load, resp, volume, share } = tooltipData
          const name = rawName || param.data.name || 'Unknown'

          const safeShare = Number.isFinite(share) ? share : 0

          return [
            `<div style="font-size:12px;font-weight:600;margin-bottom:4px;">${name}</div>`,
            `<div style="font-size:12px;">사용 비중: <b>${safeShare.toFixed(1)}%</b></div>`,
            `<div style="font-size:12px;margin-top:4px;">페이지 로드: <b>${(load ?? 0).toFixed(2)} s</b></div>`,
            `<div style="font-size:12px;">응답 시간: <b>${(resp ?? 0).toFixed(2)} s</b></div>`,
            volume
              ? `<div style="font-size:11px;color:#666;margin-top:4px;">트래픽 규모: ${volume.toLocaleString()}건 (최근 1시간)</div>`
              : '',
          ].join('')
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'circular', // ⭐ 원형 레이아웃 (깔끔함)
          circular: {
            rotateLabel: false,
          },
          data: nodes,
          roam: false,
          emphasis: {
            focus: 'self',
            scale: 1.2,
            itemStyle: {
              opacity: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
            label: {
              show: true,
              fontSize: 12,
            },
          },
        },
      ],
      animation: true,
      animationDuration: 800,
      animationEasing: 'elasticOut',
      animationDurationUpdate: 800,
      animationEasingUpdate: 'elasticOut',
    }
  }, [aggregatedData])

  // 컨테이너 크기 변화 대응
  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return

    const el = inst.getDom()
    const ro = new ResizeObserver(() => {
      if (!inst.isDisposed()) {
        inst.resize()
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
    }
  }, [])

  // ✅ 데이터 소스 표시
  const dataSource = isConnected ? '실시간' : 'DB'
  const dataPointsCount = browserDataPoints.length

  let content

  if (isLoading && browserDataPoints.length === 0) {
    // ✅ 처음에 DB에서 아직 아무 데이터도 안 들어온 상태일 때만 로딩 표시
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>브라우저 성능 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        브라우저 성능 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (browserDataPoints.length === 0) {
    // ✅ 요청은 끝났는데도 데이터가 없을 때
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 브라우저 성능 데이터가 없습니다.
      </div>
    )
  } else {
    // ✅ 데이터가 한 번이라도 들어오면, 이후 refetch로 isLoading이 true가 돼도 차트는 그대로 유지
    content = (
      <ReactECharts
        ref={chartRef}
        echarts={echarts}
        option={option}
        notMerge={false}
        lazyUpdate={true}
        style={{ height: 280 }}
      />
    )
  }

  return (
    <WidgetCard
      title='브라우저별 성능'
      description={`브라우저별 평균 로드/응답 시간 (${dataSource} - ${dataPointsCount}건, 최근 1시간)`}
      icon='🌐'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

BrowserPerformance.propTypes = {
  onClose: PropTypes.func,
}

export default BrowserPerformance

// ✅ User-Agent에서 브라우저 파싱 (간단한 버전)
function parseBrowser(userAgent) {
  if (!userAgent) return 'Unknown'

  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  if (userAgent.includes('Brave')) return 'Brave'
  if (userAgent.includes('Samsung')) return 'Samsung'

  return 'Unknown'
}
