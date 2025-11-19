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
import { useTrafficTrend } from '@/hooks/queries/useDashboard'
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

const WIDGET_INFO = {
  title: '실시간 트래픽 추이',
  description: 'Mbps 기준, Request/Response 구분 (실시간)',
  sections: [
    {
      icon: '📌',
      title: '파악 가능한 부분',
      items: [
        '실시간 트래픽 변화 추이 모니터링',
        '시간대별 Request/Response 패턴 분석',
        '트래픽 급증/급감 시점 감지',
        '필터 적용 시 특정 조건의 트래픽만 분석',
      ],
    },
    {
      icon: '💡',
      title: '활용 방법',
      items: [
        '트래픽 이상 패턴 발견 시 즉시 대응',
        '특정 국가/브라우저의 트래픽 추이 분석',
        '피크 타임 실시간 모니터링',
        '필터링을 통한 세밀한 트래픽 분석',
      ],
    },
  ],
}

const TrafficTrend = ({ onClose }) => {
  const chartRef = useRef(null)
  const [chartPoints, setChartPoints] = useState([]) // ⭐ 차트에 표시할 포인트
  const [isInitialized, setIsInitialized] = useState(false) // ⭐ DB 데이터 로드 완료

  // ✅ 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading } = useTrafficTrend()

  // ✅ 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // ✅ 3. 초기 DB 데이터 로드
  useEffect(() => {
    if (!isLoading && dbData?.points && !isInitialized) {
      console.log('📊 [TrafficTrend] DB 초기 데이터 로드:', dbData.points.length)

      const points = dbData.points.map((p) => ({
        t: p.t,
        req: p.req || 0,
        res: p.res || 0,
        requestCount: p.requestCount || 0,
        responseCount: p.responseCount || 0,
      }))

      setChartPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // ✅ 4. SSE 연결되면 실시간 데이터 추가
  useEffect(() => {
    if (!isConnected || !isInitialized) {
      return // SSE 연결 안 됐거나 초기화 안 됐으면 리턴
    }

    if (realtimeData.length === 0) {
      return // 실시간 데이터 없으면 리턴
    }

    console.log('📡 [TrafficTrend] 실시간 데이터 추가:', realtimeData.length)

    // 실시간 데이터를 차트 포인트로 변환
    const newPoints = realtimeData.map((item) => ({
      t: item.tsServer || new Date().toISOString(),
      req: item.mbpsReq || 0,
      res: item.mbpsRes || 0,
      requestCount: item.pagePktCntReq || 0,
      responseCount: item.pagePktCntRes || 0,
    }))

    // ⭐ 기존 차트 포인트와 병합 (중복 제거)
    setChartPoints((prev) => {
      const existingTimestamps = new Set(prev.map((p) => p.t))
      const uniqueNewPoints = newPoints.filter((p) => !existingTimestamps.has(p.t))

      // 병합 후 시간 순 정렬
      const combined = [...prev, ...uniqueNewPoints].sort((a, b) => new Date(a.t) - new Date(b.t))

      // 최근 1000개만 유지
      return combined.slice(-1000)
    })
  }, [realtimeData, isConnected, isInitialized])

  // Request/Response 데이터 생성
  const reqData = useMemo(
    () => chartPoints.map((p) => [new Date(p.t).getTime(), p.req]),
    [chartPoints],
  )

  const resData = useMemo(
    () => chartPoints.map((p) => [new Date(p.t).getTime(), p.res]),
    [chartPoints],
  )

  const option = useMemo(() => {
    return {
      grid: { top: 56, left: 44, right: 16, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
        formatter: (params) => {
          if (!params || params.length === 0) return ''

          // ⭐ Request와 Response 각 1개씩만
          const requestParam = params.find((p) => p.seriesName === 'Request')
          const responseParam = params.find((p) => p.seriesName === 'Response')

          if (!requestParam && !responseParam) return ''

          const dataIndex = (requestParam || responseParam).dataIndex
          const point = chartPoints[dataIndex]
          if (!point) return ''

          const time = new Date(point.t).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })

          let result = `<div style="font-size: 12px; font-weight: 500; margin-bottom: 4px;">${time}</div>`

          // Request 정보
          if (requestParam) {
            const mbps = requestParam.value[1]?.toFixed(2) || '0.00'
            result += `
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${requestParam.color};"></span>
                <span style="flex: 1;">Request:</span>
                <span style="font-weight: 600;">${mbps} Mbps</span>
                <span style="color: #666; font-size: 11px;">(${point.requestCount?.toLocaleString() || 0}개)</span>
              </div>
            `
          }

          // Response 정보
          if (responseParam) {
            const mbps = responseParam.value[1]?.toFixed(2) || '0.00'
            result += `
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${responseParam.color};"></span>
                <span style="flex: 1;">Response:</span>
                <span style="font-weight: 600;">${mbps} Mbps</span>
                <span style="color: #666; font-size: 11px;">(${point.responseCount?.toLocaleString() || 0}개)</span>
              </div>
            `
          }

          return result
        },
      },
      legend: {
        top: 8,
        icon: 'roundRect',
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLabel: {
          hideOverlap: true,
          formatter: (value) => {
            const date = new Date(value)
            return date.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Mbps',
        alignTicks: true,
        axisLine: { show: false },
        splitLine: { show: true },
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
          name: 'Request',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          showSymbol: false,
          symbolSize: 4,
          sampling: 'lttb',
          lineStyle: { width: 2.4 },
          areaStyle: { opacity: 0.3 },
          data: reqData,
        },
        {
          name: 'Response',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          showSymbol: false,
          symbolSize: 3,
          sampling: 'lttb',
          lineStyle: { width: 1.6 },
          areaStyle: { opacity: 0.18 },
          data: resData,
        },
      ],
      animation: true,
      animationDuration: 300,
      animationEasing: 'linear',
    }
  }, [reqData, resData, chartPoints])

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
  const dataCount = chartPoints.length

  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='실시간 트래픽 추이'
      description={`Mbps 기준, Request/Response 구분 (${dataSource} - ${dataCount}개)`}
      showInfo={true}
      showSettings={true}
      showClose={true}
      widgetInfo={WIDGET_INFO}
      onSettings={() => console.log('트래픽 추이 설정')}
      onClose={onClose}
    >
      <div className='h-70'>
        {isLoading ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-500'>
              <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
              <p className='text-sm'>데이터 로딩 중...</p>
            </div>
          </div>
        ) : chartPoints.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <div className='text-center text-gray-500'>
              <p className='text-sm'>데이터가 없습니다</p>
            </div>
          </div>
        ) : (
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

TrafficTrend.propTypes = {
  onClose: PropTypes.func,
}

export default TrafficTrend
