/**
 * 작성자: 정소영
 */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { BarChart } from 'echarts/charts'
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
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

const WINDOW_MS = 60 * 60 * 1000 // 1시간 슬라이딩 윈도우

const AvgResponseTime = ({ onClose }) => {
  const chartRef = useRef(null)
  const [responseTimePoints, setResponseTimePoints] = useState([]) // ⭐ 시간별 응답시간 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드 (개선됨!)
  useEffect(() => {
    if (!isLoading && dbData?.responseTimeStats && !isInitialized) {
      const stats = dbData.responseTimeStats

      // 가장 최근 "유효한" 집계 포인트 찾기
      const lastNonEmpty =
        [...stats]
          .reverse()
          .find(
            (p) =>
              p?.avgResponseTime !== null ||
              p?.p95ResponseTime !== null ||
              p?.p99ResponseTime !== null,
          ) ?? null

      const last = lastNonEmpty ?? stats[stats.length - 1] ?? {}

      // ⭐ DB 데이터를 최근 1시간에 걸쳐 분산 배치
      // DB에서는 집계된 통계만 제공하므로, 가상의 포인트를 생성
      const now = Date.now()
      const avgTime = last.avgResponseTime ?? 0
      const p95Time = last.p95ResponseTime ?? 0
      const p99Time = last.p99ResponseTime ?? 0

      // 통계 기반으로 가상 포인트 생성 (약 100개)
      // 실제 분포를 모사: 대부분 평균 근처, 일부 P95/P99 근처
      const points = []

      if (avgTime > 0) {
        // 80%는 평균 근처
        for (let i = 0; i < 80; i++) {
          const variance = (Math.random() - 0.5) * avgTime * 0.3 // ±15% 변동
          points.push({
            timestamp: now - Math.random() * WINDOW_MS,
            responseTime: Math.max(0, avgTime + variance),
          })
        }

        // 15%는 P95 근처
        for (let i = 0; i < 15; i++) {
          const variance = (Math.random() - 0.5) * p95Time * 0.2
          points.push({
            timestamp: now - Math.random() * WINDOW_MS,
            responseTime: Math.max(0, p95Time + variance),
          })
        }

        // 5%는 P99 근처
        for (let i = 0; i < 5; i++) {
          const variance = (Math.random() - 0.5) * p99Time * 0.1
          points.push({
            timestamp: now - Math.random() * WINDOW_MS,
            responseTime: Math.max(0, p99Time + variance),
          })
        }
      }

      setResponseTimePoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. 주기적으로 슬라이딩 윈도우 적용 (1분마다 체크)
  useEffect(() => {
    if (!isInitialized) return

    const interval = setInterval(() => {
      setResponseTimePoints((prev) => {
        const now = Date.now()
        const cutoff = now - WINDOW_MS
        const filtered = prev.filter((p) => p.timestamp >= cutoff)

        // 데이터가 변경되었을 때만 업데이트
        // if (filtered.length !== prev.length) {
        //   console.log('🕐 [AvgResponseTime] 슬라이딩 윈도우 적용:', {
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

    setResponseTimePoints((prev) => {
      // 실시간 데이터를 포인트로 변환
      const newPoints = realtimeData
        .map((item) => {
          // 응답 시간 필드 확인: tsPage (페이지 로드 시간, 초 단위) 또는 responseTime
          const responseTime = item.tsPage || item.responseTime || item.avgResponseTime || 0

          if (responseTime <= 0) return null

          return {
            timestamp: new Date(item.tsServer || new Date()).getTime(),
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

      return filtered
    })
  }, [realtimeData, isConnected, isInitialized])

  // ✅ 6. 집계 데이터 계산 (슬라이딩 윈도우 적용된 데이터만 사용)
  const chartData = useMemo(() => {
    // ⭐ 현재 시간 기준으로 1시간 이내 데이터만 필터링
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const filteredPoints = responseTimePoints.filter((p) => p.timestamp >= cutoff)

    if (filteredPoints.length === 0) return null

    // 응답시간 값만 추출하여 정렬
    const values = filteredPoints.map((p) => p.responseTime).sort((a, b) => a - b)
    const count = values.length

    if (count === 0) return null

    const avgResponseTime = values.reduce((sum, v) => sum + v, 0) / count
    const p95Index = Math.max(0, Math.ceil(count * 0.95) - 1)
    const p99Index = Math.max(0, Math.ceil(count * 0.99) - 1)

    const result = {
      avgResponseTime: avgResponseTime || 0,
      p95ResponseTime: values[p95Index] || 0,
      p99ResponseTime: values[p99Index] || 0,
      sampleCount: count,
    }
    return result
  }, [responseTimePoints])

  // ✅ 7. 차트 옵션 생성
  const option = useMemo(() => {
    if (!chartData) return {}

    const categories = ['평균 응답시간', 'P95 응답시간', 'P99 응답시간']
    const values = [chartData.avgResponseTime, chartData.p95ResponseTime, chartData.p99ResponseTime]

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v) => `${v.toFixed(2)} s`,
      },
      grid: {
        left: 80,
        right: 24,
        top: 24,
        bottom: 24,
      },
      xAxis: {
        type: 'value',
        name: '초 (s)',
        axisLabel: {
          formatter: (v) => v.toFixed(2),
        },
        splitLine: { show: true },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisTick: { show: false },
      },
      series: [
        {
          name: '응답시간',
          type: 'bar',
          barWidth: 18,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: (p) => `${p.value.toFixed(2)}s`,
          },
          data: values,
        },
      ],
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 500,
      animationEasingUpdate: 'cubicOut',
    }
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
  const sampleCount = chartData?.sampleCount ?? 0

  let content

  if (isLoading && responseTimePoints.length === 0) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>응답시간 통계 로딩 중...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        응답시간 통계 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (responseTimePoints.length === 0) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 응답시간 통계가 없습니다.
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
      title='응답시간 통계'
      description={`평균·P95·P99 응답시간 요약 (${dataSource} - ${sampleCount}건, 최근 1시간)`}
      icon='⏱️'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

AvgResponseTime.propTypes = {
  onClose: PropTypes.func,
}

export default AvgResponseTime
