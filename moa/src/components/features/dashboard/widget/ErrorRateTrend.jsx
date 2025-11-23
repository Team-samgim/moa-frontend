// src/components/features/dashboard/widget/ErrorRateTrend.jsx
import React, { useMemo, useRef, useEffect, useState } from 'react'
import { BarChart, LineChart } from 'echarts/charts'
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
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

const WINDOW_MS = 60 * 60 * 1000 // 최근 1시간 데이터만 보여줄 시간 창
const MAX_POINTS = 500 // 메모리 절약을 위한 최대 포인트 수

const formatTimeLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const ErrorRateTrend = ({ onClose }) => {
  const chartRef = useRef(null)
  const [chartPoints, setChartPoints] = useState([]) // ⭐ 차트에 표시할 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드
  useEffect(() => {
    if (!isLoading && dbData?.errorRateTrend && !isInitialized) {
      // ⭐ DB 데이터에서 최근 1시간 데이터만 필터링
      const now = Date.now()
      const cutoff = now - WINDOW_MS

      const points = dbData.errorRateTrend
        .map((p) => ({
          timestamp: p.timestamp,
          errorRate: p.errorRate ?? 0,
          clientErrorRate: p.clientErrorRate ?? 0,
          serverErrorRate: p.serverErrorRate ?? 0,
        }))
        .filter((p) => new Date(p.timestamp).getTime() >= cutoff) // ⭐ 1시간 이내만

      console.log(
        `📊 [ErrorRateTrend] DB 데이터 필터링: ${dbData.errorRateTrend.length}개 → ${points.length}개`,
      )
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
        const filtered = prev.filter((p) => new Date(p.timestamp).getTime() >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        // if (filtered.length !== prev.length) {
        //   console.log('🕐 [ErrorRateTrend] 슬라이딩 윈도우 적용:', {
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

    // ⚠️ SSE 데이터는 개별 이벤트만 포함하므로 시간 윈도우별로 집계 필요
    // 시간 윈도우: 5초 단위로 그룹화
    const WINDOW_SEC = 5
    const groupedData = new Map()

    realtimeData.forEach((item) => {
      const timestamp = item.tsServer || new Date().toISOString()
      const timeMs = new Date(timestamp).getTime()
      // 5초 단위로 그룹화 (예: 10:00:00~10:00:05 → 10:00:00)
      const windowKey = Math.floor(timeMs / (WINDOW_SEC * 1000)) * (WINDOW_SEC * 1000)

      if (!groupedData.has(windowKey)) {
        groupedData.set(windowKey, {
          timestamp: new Date(windowKey).toISOString(),
          total: 0,
          clientErrors: 0, // 4xx
          serverErrors: 0, // 5xx
        })
      }

      const group = groupedData.get(windowKey)
      group.total += 1

      // HTTP 응답 코드로 에러 분류
      const httpResCode = item.httpResCode
      if (httpResCode) {
        const code = parseInt(httpResCode)
        if (code >= 400 && code < 500) {
          group.clientErrors += 1
        } else if (code >= 500) {
          group.serverErrors += 1
        }
      }
    })

    // 각 시간 윈도우별로 에러율 계산
    const newPoints = Array.from(groupedData.values())
      .map((group) => {
        if (group.total === 0) return null

        const clientErrorRate = (group.clientErrors / group.total) * 100
        const serverErrorRate = (group.serverErrors / group.total) * 100
        const errorRate = clientErrorRate + serverErrorRate

        return {
          timestamp: group.timestamp,
          errorRate: errorRate || 0,
          clientErrorRate: clientErrorRate || 0,
          serverErrorRate: serverErrorRate || 0,
        }
      })
      .filter((p) => p !== null)

    // ⭐ 기존 차트 포인트와 병합 (중복 제거)
    setChartPoints((prev) => {
      const existingTimestamps = new Set(prev.map((p) => p.timestamp))
      const uniqueNewPoints = newPoints.filter((p) => !existingTimestamps.has(p.timestamp))

      // 병합 후 시간 순 정렬
      const combined = [...prev, ...uniqueNewPoints].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      )

      // ⭐ 1시간 이내 데이터만 유지 (시간 기반 슬라이딩 윈도우)
      const now = Date.now()
      const cutoff = now - WINDOW_MS
      const timeFiltered = combined.filter((p) => new Date(p.timestamp).getTime() >= cutoff)

      // ⭐ 추가로 MAX_POINTS 제한 (메모리 보호)
      const result = timeFiltered.slice(-MAX_POINTS)

      return result
    })
  }, [realtimeData, isConnected, isInitialized])

  // ⭐ 화면에 실제로 보여줄 슬라이딩 윈도우 데이터 (최근 WINDOW_MS 구간)
  const visiblePoints = useMemo(() => {
    if (chartPoints.length === 0) return []

    // ⭐ 현재 시간 기준으로 필터링 (집계 시점과 표시 시점 차이 대응)
    const now = Date.now()
    const cutoff = now - WINDOW_MS

    return chartPoints.filter((p) => new Date(p.timestamp).getTime() >= cutoff)
  }, [chartPoints])

  const option = useMemo(() => {
    const x = visiblePoints.map((p) => formatTimeLabel(p.timestamp))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          if (!params || !params.length) return ''
          const dataIndex = params[0].dataIndex
          const point = visiblePoints[dataIndex]
          if (!point) return ''

          const time = new Date(point.timestamp).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })

          const total = params.find((p) => p.seriesName === '전체 에러율')
          const client = params.find((p) => p.seriesName === '클라이언트 에러율')
          const server = params.find((p) => p.seriesName === '서버 에러율')

          const fmt = (v) => `${(v ?? 0).toFixed(2)} %`

          let html = `<div style="margin-bottom:4px;font-weight:600;font-size:12px;">${time}</div>`
          if (total) {
            html += `<div style="font-size:12px;margin-top:2px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${total.color};margin-right:6px;"></span>
              전체 에러율: <b>${fmt(total.data)}</b>
            </div>`
          }
          if (client) {
            html += `<div style="font-size:12px;margin-top:2px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${client.color};margin-right:6px;"></span>
              클라이언트 에러율: <b>${fmt(client.data)}</b>
            </div>`
          }
          if (server) {
            html += `<div style="font-size:12px;margin-top:2px;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${server.color};margin-right:6px;"></span>
              서버 에러율: <b>${fmt(server.data)}</b>
            </div>`
          }
          return html
        },
      },
      legend: {
        top: 0,
        data: ['전체 에러율', '클라이언트 에러율', '서버 에러율'],
      },
      grid: {
        left: 44,
        right: 16,
        top: 40,
        bottom: 26,
      },
      xAxis: {
        type: 'category',
        data: x,
        boundaryGap: true,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '%',
        axisLabel: {
          formatter: (v) => `${v.toFixed(0)}`,
        },
        splitLine: { show: true },
      },
      series: [
        {
          name: '전체 에러율',
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
          data: visiblePoints.map((p) => p.errorRate),
        },
        {
          name: '클라이언트 에러율',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          showSymbol: false,
          symbolSize: 4,
          yAxisIndex: 0,
          lineStyle: { width: 1.8 },
          data: visiblePoints.map((p) => p.clientErrorRate),
        },
        {
          name: '서버 에러율',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          showSymbol: false,
          symbolSize: 4,
          yAxisIndex: 0,
          lineStyle: { width: 1.8 },
          data: visiblePoints.map((p) => p.serverErrorRate),
        },
      ],
      animation: true,
      // 초기 렌더링 및 실시간 업데이트 모두 부드럽게
      animationDuration: 300,
      animationEasing: 'linear',
      animationDurationUpdate: 300,
      animationEasingUpdate: 'linear',
    }
  }, [visiblePoints])

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
  const dataCount = visiblePoints.length

  let content

  if (isLoading && chartPoints.length === 0) {
    // ✅ 처음에 DB에서 아직 아무 데이터도 안 들어온 상태일 때만 로딩 표시
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>에러율 추세 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        에러율 추세 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (chartPoints.length === 0) {
    // ✅ 요청은 끝났는데도 데이터가 없을 때
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 에러율 추세 데이터가 없습니다.
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
        style={{ height: 220 }}
      />
    )
  }

  return (
    <WidgetCard
      title='에러율 추이'
      description={`시간대별 전체 / 클라이언트 / 서버 에러율 (${dataSource} - ${dataCount}개)`}
      icon='⚠️'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

ErrorRateTrend.propTypes = {
  onClose: PropTypes.func,
}

export default ErrorRateTrend
