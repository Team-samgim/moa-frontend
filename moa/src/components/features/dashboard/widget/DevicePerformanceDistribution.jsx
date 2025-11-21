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

// 디바이스 타입별 색상
const deviceColors = {
  Mobile: '#10B981', // 초록
  Desktop: '#3B82F6', // 파랑
  Tablet: '#F59E0B', // 주황
  PC: '#6366F1', // 인디고
  Smartphone: '#14B8A6', // 청록
  Unknown: '#94A3B8', // 회색
}

const DevicePerformanceDistribution = ({ onClose }) => {
  const chartRef = useRef(null)
  const [deviceDataPoints, setDeviceDataPoints] = useState([]) // ⭐ 시간별 디바이스 데이터 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드
  useEffect(() => {
    if (!isLoading && dbData?.devicePerformanceDistribution && !isInitialized) {
      console.log(
        '📊 [DevicePerformanceDistribution] DB 초기 데이터 로드:',
        dbData.devicePerformanceDistribution.length,
      )

      // DB 데이터를 시간별 포인트로 변환
      // ⚠️ DB 데이터는 최근 1시간 이내 데이터만 사용 (현재 시간 기준)
      const now = Date.now()
      const cutoff = now - WINDOW_MS

      const points = dbData.devicePerformanceDistribution
        .filter((item) => {
          // DB 데이터에 타임스탬프가 있으면 사용, 없으면 현재 시간으로 간주
          const itemTime = item.timestamp ? new Date(item.timestamp).getTime() : now
          return itemTime >= cutoff
        })
        .flatMap((item) => {
          // 요청 건수만큼 포인트 생성
          const count = item.requestCount ?? 1
          const itemTime = item.timestamp ? new Date(item.timestamp).getTime() : now

          return Array(count)
            .fill(null)
            .map(() => ({
              timestamp: itemTime,
              deviceType: item.deviceType || 'Unknown',
              pageLoadTime: item.avgPageLoadTime ?? 0,
              responseTime: item.avgResponseTime ?? 0,
            }))
        })

      setDeviceDataPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setDeviceDataPoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => p.timestamp >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        if (filtered.length !== prev.length) {
          console.log('🕐 [DevicePerformanceDistribution] 슬라이딩 윈도우 적용:', {
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
      return
    }

    if (realtimeData.length === 0) {
      return
    }

    console.log('📡 [DevicePerformanceDistribution] 실시간 데이터 추가:', realtimeData.length)

    // ⚠️ 실제 SSE 데이터 구조 확인용 로그 (필드명 확인 후 제거 가능)
    if (realtimeData.length > 0) {
      const sample = realtimeData[0]
      console.log('📦 [DevicePerformanceDistribution] 첫 번째 실시간 데이터 샘플:', {
        userAgentHardwareType: sample.userAgentHardwareType,
        deviceType: sample.deviceType,
        userAgent: sample.userAgent,
        tsPage: sample.tsPage,
        pageLoadTime: sample.pageLoadTime,
        avgPageLoadTime: sample.avgPageLoadTime,
        responseTime: sample.responseTime,
        avgResponseTime: sample.avgResponseTime,
      })
    }

    setDeviceDataPoints((prev) => {
      // 실시간 데이터를 포인트로 변환
      // ⚠️ 실제 SSE 데이터 필드명: userAgentHardwareType (디바이스 타입), tsPage (페이지 로드 시간, 초 단위)
      const newPoints = realtimeData.map((item) => {
        // 디바이스 타입 필드 확인: userAgentHardwareType (우선), deviceType, userAgent 파싱 (fallback)
        const deviceType =
          item.userAgentHardwareType ||
          item.deviceType ||
          (item.userAgent ? parseDeviceType(item.userAgent) : null) ||
          'Unknown'

        // 페이지 로드 시간 필드 확인: tsPage (페이지 로드 시간, 초 단위) 또는 pageLoadTime
        const pageLoadTime = item.tsPage || item.pageLoadTime || item.avgPageLoadTime || 0

        // 응답 시간 필드 확인: tsPage (페이지 로드 시간과 동일) 또는 responseTime
        const responseTime = item.tsPage || item.responseTime || item.avgResponseTime || 0

        return {
          timestamp: new Date(item.tsServer || new Date()).getTime(),
          deviceType,
          pageLoadTime,
          responseTime,
        }
      })

      // 기존 데이터와 병합
      const combined = [...prev, ...newPoints]

      // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 유지 (슬라이딩 윈도우)
      const now = Date.now()
      const cutoff = now - WINDOW_MS
      return combined.filter((p) => p.timestamp >= cutoff)
    })
  }, [realtimeData, isConnected, isInitialized])

  // ✅ 6. 디바이스별로 집계된 데이터 계산 (슬라이딩 윈도우 적용된 데이터만 사용)
  const { mapped, totalReq } = useMemo(() => {
    // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 필터링
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const filteredPoints = deviceDataPoints.filter((p) => p.timestamp >= cutoff)

    if (filteredPoints.length === 0) {
      return { mapped: [], totalReq: 0 }
    }

    // 디바이스별로 그룹화
    const deviceMap = new Map()

    filteredPoints.forEach((point) => {
      const deviceType = point.deviceType
      const existing = deviceMap.get(deviceType)

      if (existing) {
        existing.requestCount += 1
        existing.totalPageLoadTime += point.pageLoadTime
        existing.totalResponseTime += point.responseTime
      } else {
        deviceMap.set(deviceType, {
          deviceType,
          requestCount: 1,
          totalPageLoadTime: point.pageLoadTime,
          totalResponseTime: point.responseTime,
        })
      }
    })

    // 전체 요청 수
    const total = filteredPoints.length

    // 평균 계산 및 비율 계산
    const aggregated = Array.from(deviceMap.values()).map((item) => ({
      deviceType: item.deviceType,
      requestCount: item.requestCount,
      trafficPercentage: total > 0 ? (item.requestCount / total) * 100 : 0,
      avgPageLoadTime: item.requestCount > 0 ? item.totalPageLoadTime / item.requestCount : 0,
      avgResponseTime: item.requestCount > 0 ? item.totalResponseTime / item.requestCount : 0,
    }))

    return {
      mapped: aggregated,
      totalReq: total,
    }
  }, [deviceDataPoints])

  // ✅ 7. 차트 옵션 생성
  const option = useMemo(() => {
    if (mapped.length === 0) return {}

    const nodes = mapped.map((d, idx) => {
      const color = deviceColors[d.deviceType] || deviceColors.Unknown
      const size = Math.max(50, Math.min(140, 50 + (d.trafficPercentage / 100) * 90))

      return {
        id: `device-${idx}`,
        name: d.deviceType,
        value: d.trafficPercentage,
        symbolSize: size,
        itemStyle: {
          color: color,
          opacity: 0.85,
        },
        label: {
          show: true,
          formatter: (param) => {
            const name = param.data.name
            const percentage = param.data.value.toFixed(1)
            return `{name|${name}}\n{percent|${percentage}%}`
          },
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 600,
          rich: {
            name: {
              fontSize: 12,
              fontWeight: 700,
            },
            percent: {
              fontSize: 10,
              fontWeight: 500,
            },
          },
        },
        tooltipData: {
          requestCount: d.requestCount,
          trafficPercentage: d.trafficPercentage,
          avgPageLoadTime: d.avgPageLoadTime,
          avgResponseTime: d.avgResponseTime,
        },
      }
    })

    return {
      tooltip: {
        trigger: 'item',
        formatter: (param) => {
          if (!param || !param.data || !param.data.tooltipData) return ''
          const { tooltipData } = param.data
          const name = param.data.name || 'Unknown'

          return [
            `<div style="font-size:13px;font-weight:700;margin-bottom:6px;">${name}</div>`,
            `<div style="font-size:12px;">트래픽 비중: <b>${tooltipData.trafficPercentage.toFixed(1)}%</b></div>`,
            `<div style="font-size:12px;">요청 수: <b>${tooltipData.requestCount.toLocaleString()}건</b></div>`,
            `<div style="font-size:11px;margin-top:4px;color:#666;">페이지 로드: ${tooltipData.avgPageLoadTime.toFixed(2)}s</div>`,
            `<div style="font-size:11px;color:#666;">응답 시간: ${tooltipData.avgResponseTime.toFixed(2)}s</div>`,
          ].join('')
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          roam: false,
          force: {
            repulsion: 180,
            gravity: 0.12,
            edgeLength: 60,
            layoutAnimation: true,
          },
          emphasis: {
            focus: 'self',
            scale: 1.15,
            itemStyle: {
              opacity: 1,
              shadowBlur: 15,
              shadowColor: 'rgba(0, 0, 0, 0.4)',
            },
            label: {
              show: true,
              fontSize: 13,
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
  }, [mapped])

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

  let content

  if (isLoading && deviceDataPoints.length === 0) {
    // ✅ 처음에 DB에서 아직 아무 데이터도 안 들어온 상태일 때만 로딩 표시
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>디바이스별 성능 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        디바이스별 성능 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (deviceDataPoints.length === 0) {
    // ✅ 요청은 끝났는데도 데이터가 없을 때
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 디바이스별 성능 데이터가 없습니다.
      </div>
    )
  } else {
    // ✅ 데이터가 한 번이라도 들어오면, 이후 refetch로 isLoading이 true가 돼도 차트는 그대로 유지
    content = (
      <div className='flex flex-col gap-3'>
        {/* 상단 요약 KPI */}
        <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
          <span className='text-xs text-gray-600'>총 요청 수 (최근 1시간)</span>
          <span className='text-sm font-bold text-gray-800 transition-all duration-300'>
            {totalReq.toLocaleString()}건
          </span>
        </div>

        {/* 버블 차트 */}
        <div className='h-64'>
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={option}
            notMerge={false}
            lazyUpdate={true}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    )
  }

  return (
    <WidgetCard
      title='디바이스별 트래픽 성능'
      description={`디바이스 유형별 트래픽 비중 및 성능 (${dataSource}, 최근 1시간)`}
      icon='💻'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

DevicePerformanceDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default DevicePerformanceDistribution

// ✅ User-Agent에서 디바이스 타입 파싱
function parseDeviceType(userAgent) {
  if (!userAgent) return 'Unknown'

  const ua = userAgent.toLowerCase()

  // Mobile 판별
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('windows phone')
  ) {
    return 'Mobile'
  }

  // Tablet 판별
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet'
  }

  // Desktop 판별
  if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return 'Desktop'
  }

  return 'Unknown'
}
