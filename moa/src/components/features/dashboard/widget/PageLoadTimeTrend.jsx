import React, { useMemo, useRef, useEffect, useState } from 'react'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import ChartLineIcon from '@/assets/icons/chart-line.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { usePageLoadTimeTrend } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

const WINDOW_MS = 5 * 60 * 1000 // 최근 5분 데이터만 보여줄 시간 창
const MAX_POINTS = 500 // 메모리 절약을 위한 최대 포인트 수

// 위젯 설명 데이터
const WIDGET_INFO = {
  title: '페이지 로드 시간 트렌드',
  description: '시간대별 페이지 로딩 성능 추이 (초 단위, 실시간)',
  sections: [
    {
      icon: '📌',
      title: '파악 가능한 부분',
      items: [
        '시간대별 페이지 로딩 성능 추이 확인',
        '성능 저하 발생 시점 및 패턴 감지',
        'P95, P99 지표로 이상치 파악',
        '배포/변경 전후 성능 비교',
      ],
    },
    {
      icon: '💡',
      title: '활용 방법',
      items: [
        '성능 저하 구간 발견 시 해당 시간대 분석',
        '피크 타임 성능 모니터링 및 용량 계획',
        'SLA 기준 미달 시간대 파악 및 개선',
        '정기 배포 후 성능 영향 검증',
      ],
    },
  ],
}

const PageLoadTimeTrend = ({ onClose }) => {
  const chartRef = useRef(null)
  const [chartPoints, setChartPoints] = useState([]) // ⭐ 차트에 표시할 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading } = usePageLoadTimeTrend()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드 (개선됨!)
  useEffect(() => {
    if (!isLoading && dbData?.points && !isInitialized) {
      // ⭐ DB 데이터에서 최근 5분 데이터만 필터링
      const now = Date.now()
      const cutoff = now - WINDOW_MS

      const points = dbData.points
        .map((p) => ({
          t: p.t,
          avg: p.avg || 0,
          p95: p.p95 || 0,
          p99: p.p99 || 0,
          min: p.min || 0,
          max: p.max || 0,
        }))
        .filter((p) => new Date(p.t).getTime() >= cutoff) // ⭐ 5분 이내만
      setChartPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setChartPoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => new Date(p.t).getTime() >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        // if (filtered.length !== prev.length) {
        //   console.log('🕐 [PageLoadTimeTrend] 슬라이딩 윈도우 적용:', {
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
      return // 👈 SSE 연결 안 됐거나 초기화 안 됐으면 리턴
    }

    if (realtimeData.length === 0) {
      return // 👈 실시간 데이터 없으면 리턴
    }

    // ⚠️ SSE 데이터는 개별 페이지 로드 시간(tsPage)만 포함하므로 시간 윈도우별로 집계 필요
    // 시간 윈도우: 5초 단위로 그룹화
    const WINDOW_SEC = 5
    const groupedData = new Map()

    realtimeData.forEach((item) => {
      if (!item.tsPage || item.tsPage <= 0) return // 유효한 tsPage 값만 사용

      const timestamp = item.tsServer || new Date().toISOString()
      const timeMs = new Date(timestamp).getTime()
      // 5초 단위로 그룹화 (예: 10:00:00~10:00:05 → 10:00:00)
      const windowKey = Math.floor(timeMs / (WINDOW_SEC * 1000)) * (WINDOW_SEC * 1000)

      if (!groupedData.has(windowKey)) {
        groupedData.set(windowKey, {
          t: new Date(windowKey).toISOString(),
          values: [],
        })
      }

      groupedData.get(windowKey).values.push(item.tsPage)
    })

    // 각 시간 윈도우별로 집계 계산 (avg, min, max, p95, p99)
    const newPoints = Array.from(groupedData.values())
      .map((group) => {
        const values = group.values.sort((a, b) => a - b)
        const count = values.length

        if (count === 0) return null

        const avg = values.reduce((sum, v) => sum + v, 0) / count
        const min = values[0]
        const max = values[count - 1]
        const p95Index = Math.ceil(count * 0.95) - 1
        const p99Index = Math.ceil(count * 0.99) - 1

        return {
          t: group.t,
          avg: avg || 0,
          min: min || 0,
          max: max || 0,
          p95: values[Math.max(0, p95Index)] || 0,
          p99: values[Math.max(0, p99Index)] || 0,
        }
      })
      .filter((p) => p !== null)

    // ⭐ 기존 차트 포인트와 병합 (중복 제거)
    setChartPoints((prev) => {
      const existingTimestamps = new Set(prev.map((p) => p.t))
      const uniqueNewPoints = newPoints.filter((p) => !existingTimestamps.has(p.t))

      // 병합 후 시간 순 정렬
      const combined = [...prev, ...uniqueNewPoints].sort((a, b) => new Date(a.t) - new Date(b.t))

      // ⭐ 1단계: 시간 기반 슬라이딩 윈도우 (5분)
      const now = Date.now()
      const cutoff = now - WINDOW_MS
      const timeFiltered = combined.filter((p) => new Date(p.t).getTime() >= cutoff)

      // ⭐ 2단계: MAX_POINTS 제한 (메모리 보호)
      const result = timeFiltered.slice(-MAX_POINTS)

      return result
    })
  }, [realtimeData, isConnected, isInitialized])

  // ⭐ 화면에 실제로 보여줄 슬라이딩 윈도우 데이터 (현재 시간 기준)
  const visiblePoints = useMemo(() => {
    if (chartPoints.length === 0) return []

    // ⭐ 현재 시간 기준으로 필터링 (마지막 데이터 기준 → 현재 시간 기준으로 변경)
    const now = Date.now()
    const cutoff = now - WINDOW_MS

    return chartPoints.filter((p) => new Date(p.t).getTime() >= cutoff)
  }, [chartPoints])

  // 차트 데이터 준비 (최근 구간만 사용)
  const avgData = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.avg]),
    [visiblePoints],
  )
  const p95Data = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.p95]),
    [visiblePoints],
  )
  const p99Data = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.p99]),
    [visiblePoints],
  )

  const option = useMemo(() => {
    return {
      grid: { top: 56, left: 60, right: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!params || params.length === 0) return ''

          const dataIndex = params[0].dataIndex
          const point = visiblePoints[dataIndex]
          if (!point) return ''

          const time = new Date(point.t).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })

          let result = `<div style="font-size: 12px; font-weight: 500; margin-bottom: 8px;">${time}</div>`

          // Min/Max 범위 표시
          result += `
            <div style="margin-bottom: 4px; padding: 4px 0; border-bottom: 1px solid #eee;">
              <span style="color: #888; font-size: 11px;">범위:</span>
              <span style="font-weight: 500; margin-left: 4px;">${point.min?.toFixed(2)}s ~ ${point.max?.toFixed(2)}s</span>
            </div>
          `

          params.forEach((param) => {
            const value = param.value[1]?.toFixed(3) || '0.000'
            result += `
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color};"></span>
                <span style="flex: 1;">${param.seriesName}:</span>
                <span style="font-weight: 600;">${value}s</span>
              </div>
            `
          })

          return result
        },
      },
      legend: { top: 8, icon: 'roundRect' },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          hideOverlap: true,
          formatter: (value) => {
            const d = new Date(value)
            return d.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          },
        },
      },
      yAxis: {
        type: 'value',
        name: '로드 시간 (초)',
        alignTicks: true,
        axisLine: { show: false },
        splitLine: { show: true },
        axisLabel: {
          formatter: (value) => `${value.toFixed(2)}s`,
        },
      },
      dataZoom: [
        { type: 'inside' },
        {
          type: 'slider',
          height: 18,
          borderRadius: 6,
          handleSize: 12,
        },
      ],
      series: [
        {
          name: '평균',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbolSize: 5,
          sampling: 'lttb',
          lineStyle: { width: 2.4 },
          areaStyle: { opacity: 0.25 },
          data: avgData,
        },
        {
          name: 'P95',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbolSize: 4,
          sampling: 'lttb',
          lineStyle: { width: 1.6, type: 'dashed' },
          data: p95Data,
        },
        {
          name: 'P99',
          type: 'line',
          smooth: true,
          showSymbol: false,
          symbolSize: 4,
          sampling: 'lttb',
          lineStyle: { width: 1.4, type: 'dotted' },
          data: p99Data,
        },
      ],
      animation: true,
      animationDuration: 300,
      animationEasing: 'linear',
      animationDurationUpdate: 300,
      animationEasingUpdate: 'linear',
    }
  }, [avgData, p95Data, p99Data, visiblePoints])

  // 컨테이너 크기 변화 대응 + cleanup
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
  const dataCount = visiblePoints.length

  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='페이지 로드 시간 트렌드'
      description={`시간대별 페이지 로딩 성능 추이 (${dataSource} - ${dataCount}개)`}
      showInfo={true}
      showSettings={true}
      showClose={true}
      widgetInfo={WIDGET_INFO}
      onSettings={() => console.log('페이지 로드 시간 설정')}
      onClose={onClose}
    >
      <div className='h-70'>
        {isLoading && chartPoints.length === 0 ? (
          // ✅ 처음에 DB에서 아직 아무 데이터도 안 들어온 상태일 때만 로딩 표시
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-500'>
              <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
              <p className='text-sm'>데이터 로딩 중...</p>
            </div>
          </div>
        ) : chartPoints.length === 0 ? (
          // ✅ 요청은 끝났는데도 데이터가 없을 때
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-500'>
              <p className='text-sm'>데이터가 없습니다</p>
            </div>
          </div>
        ) : (
          // ✅ 데이터가 한 번이라도 들어오면, 이후 refetch로 isLoading이 true가 돼도 차트는 그대로 유지
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={option}
            notMerge={false}
            lazyUpdate={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </WidgetCard>
  )
}

// PropTypes 추가
PageLoadTimeTrend.propTypes = {
  onClose: PropTypes.func,
}

export default PageLoadTimeTrend
