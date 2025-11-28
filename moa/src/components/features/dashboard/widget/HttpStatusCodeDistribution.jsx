/**
 * 작성자: 정소영
 */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { PieChart } from 'echarts/charts'
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
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

const WINDOW_MS = 60 * 60 * 1000 // 1시간 슬라이딩 윈도우

const STATUS_ORDER = ['2xx', '3xx', '4xx', '5xx']

const colorMap = {
  '2xx': '#22C55E', // 성공
  '3xx': '#3B82F6', // 리다이렉트
  '4xx': '#F97316', // 클라이언트 오류
  '5xx': '#EF4444', // 서버 오류
}

const HttpStatusDonut = ({ onClose }) => {
  const chartRef = useRef(null)
  const [statusDataPoints, setStatusDataPoints] = useState([]) // ⭐ 시간별 상태코드 데이터 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // 3. 초기 DB 데이터 로드 - 실제 timestamp 사용
  useEffect(() => {
    if (!isLoading && dbData?.httpStatusCodeDistribution && !isInitialized) {
      const list = dbData.httpStatusCodeDistribution

      // 실제 timestamp 사용 (백엔드에서 제공)
      const now = Date.now()
      const points = list.flatMap((item) => {
        const count = Math.min(item.count ?? 1, 100) // 최대 100개로 제한
        const statusGroup = item.statusGroup

        // 백엔드에서 timestamp가 오면 사용, 없으면 현재 시간
        const baseTimestamp = item.timestamp ? new Date(item.timestamp).getTime() : now

        return Array(count)
          .fill(null)
          .map((_, idx) => ({
            // 실제 timestamp 사용 (같은 시간대 데이터는 약간의 오프셋만 추가)
            timestamp: baseTimestamp + idx,
            statusGroup: statusGroup,
          }))
      })
      setStatusDataPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setStatusDataPoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => p.timestamp >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        // if (filtered.length !== prev.length) {
        //   console.log('🕐 [HttpStatusDonut] 슬라이딩 윈도우 적용:', {
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

  // 5. SSE 연결되면 실시간 데이터 추가
  useEffect(() => {
    if (!isConnected || !isInitialized) {
      return // 👈 SSE 연결 안 됐거나 초기화 안 됐으면 리턴
    }

    if (realtimeData.length === 0) {
      return // 👈 실시간 데이터 없으면 리턴
    }

    setStatusDataPoints((prev) => {
      // 실시간 데이터를 포인트로 변환
      const newPoints = realtimeData
        .filter((item) => item.httpResCode) // httpResCode가 있는 것만
        .map((item) => {
          const statusCode = parseInt(item.httpResCode)
          let statusGroup = 'Unknown'

          if (statusCode >= 200 && statusCode < 300) {
            statusGroup = '2xx'
          } else if (statusCode >= 300 && statusCode < 400) {
            statusGroup = '3xx'
          } else if (statusCode >= 400 && statusCode < 500) {
            statusGroup = '4xx'
          } else if (statusCode >= 500 && statusCode < 600) {
            statusGroup = '5xx'
          }

          return {
            // 실제 timestamp 사용
            timestamp: new Date(item.tsServer || new Date()).getTime(),
            statusGroup: statusGroup,
          }
        })
        .filter((p) => STATUS_ORDER.includes(p.statusGroup)) // 유효한 상태그룹만

      // 기존 데이터와 병합
      const combined = [...prev, ...newPoints]

      // 1시간 이내 데이터만 유지 (슬라이딩 윈도우)
      const now = Date.now()
      const cutoff = now - WINDOW_MS
      const filtered = combined.filter((p) => p.timestamp >= cutoff)

      return filtered
    })
  }, [realtimeData, isConnected, isInitialized])

  // ✅ 6. 상태코드별로 집계된 데이터 계산 (슬라이딩 윈도우 적용된 데이터만 사용)
  const chartData = useMemo(() => {
    // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 필터링
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const filteredPoints = statusDataPoints.filter((p) => p.timestamp >= cutoff)

    if (filteredPoints.length === 0) return null

    // 상태그룹별로 카운트
    const counts = STATUS_ORDER.reduce((acc, group) => {
      acc[group] = 0
      return acc
    }, {})

    filteredPoints.forEach((point) => {
      if (counts[point.statusGroup] !== undefined) {
        counts[point.statusGroup] += 1
      }
    })

    // 전체 합계 계산
    const total = STATUS_ORDER.reduce((sum, group) => sum + counts[group], 0)

    // 퍼센티지 계산
    const result = STATUS_ORDER.reduce((acc, group) => {
      acc[group] = {
        count: counts[group],
        percentage: total > 0 ? (counts[group] / total) * 100 : 0,
      }
      return acc
    }, {})
    return result
  }, [statusDataPoints])

  // 7. 차트 옵션 생성
  const { option, total } = useMemo(() => {
    if (!chartData) {
      return { option: {}, total: 0, successRate: 0 }
    }

    const ordered = STATUS_ORDER.map((group) => ({
      statusGroup: group,
      count: chartData[group].count,
      percentage: chartData[group].percentage,
    }))

    const totalCount = ordered.reduce((sum, it) => sum + it.count, 0)
    const success = ordered[0] // 2xx
    const rate = success ? success.percentage : 0

    const seriesData = ordered.map((it) => ({
      name: it.statusGroup,
      value: it.count,
    }))

    const chartOption = {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const target = ordered.find((it) => it.statusGroup === p.name)
          const pct = target?.percentage ?? 0

          const labelMap = {
            '2xx': '2xx (성공)',
            '3xx': '3xx (리다이렉트)',
            '4xx': '4xx (클라이언트 오류)',
            '5xx': '5xx (서버 오류)',
          }

          const label = labelMap[p.name] ?? p.name

          return `${label}<br/>건수: ${p.value.toLocaleString()}<br/>비율: ${pct.toFixed(1)}%`
        },
      },
      legend: {
        bottom: 0,
        orient: 'horizontal',
      },
      color: STATUS_ORDER.map((g) => colorMap[g]),
      series: [
        {
          type: 'pie',
          radius: ['60%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          data: seriesData,
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '42%',
          style: {
            text: `${rate.toFixed(1)}%`,
            textAlign: 'center',
            fill: '#1f2933',
            fontSize: 20,
            fontWeight: 600,
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '58%',
          style: {
            text: '성공률 (2xx)',
            textAlign: 'center',
            fill: '#9CA3AF',
            fontSize: 12,
          },
        },
      ],
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 500,
      animationEasingUpdate: 'cubicOut',
    }

    return { option: chartOption, total: totalCount, successRate: rate }
  }, [chartData])

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

  if (isLoading && statusDataPoints.length === 0) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>HTTP 상태코드 분포를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-red-500'>
        HTTP 상태코드 분포를 불러오지 못했습니다.
      </div>
    )
  } else if (statusDataPoints.length === 0) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        표시할 상태코드 데이터가 없습니다.
      </div>
    )
  } else {
    // 데이터가 한 번이라도 들어오면, 이후 refetch로 isLoading이 true가 돼도 차트는 그대로 유지
    content = (
      <ReactECharts
        ref={chartRef}
        echarts={echarts}
        option={option}
        notMerge={false}
        lazyUpdate={true}
        style={{ height: 260 }}
      />
    )
  }

  return (
    <WidgetCard
      title='HTTP 상태코드 분포'
      description={`2xx / 3xx / 4xx / 5xx 응답 비율 (${dataSource}, 최근 1시간)`}
      icon='🟢'
      onClose={onClose}
      showSettings={false}
    >
      <div className='mb-2 text-xs text-gray-500 text-right'>
        총 응답: {total.toLocaleString()} 건 (최근 1시간)
      </div>
      {content}
    </WidgetCard>
  )
}

HttpStatusDonut.propTypes = {
  onClose: PropTypes.func,
}

export default HttpStatusDonut
