import React, { useMemo, useRef, useEffect, useState } from 'react'
import { LineChart, ScatterChart } from 'echarts/charts'
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
import { showTrafficAnomalyToast } from '@/components/features/dashboard/toast'
import TrafficTrendSetting from '@/components/features/dashboard/widgetsetting/TrafficTrendSetting'
import { useTrafficTrend } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

echarts.use([
  LineChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

const WINDOW_MS = 5 * 60 * 1000
const MAX_POINTS = 500

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
  const [chartPoints, setChartPoints] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState(null) // ⭐ 추가
  const notifiedAnomaliesRef = useRef(new Set())

  // ⭐ 임계값 설정 state
  const [thresholdSettings, setThresholdSettings] = useState({
    requestMin: 0,
    requestMax: 0.2, // Request 정상 범위
    responseMin: 0,
    responseMax: 0.4, // Response 정상 범위 (차트 기준)
    enabled: true,
  })

  const { data: dbData, isLoading } = useTrafficTrend()
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  useEffect(() => {
    if (!isLoading && dbData?.points && !isInitialized) {
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

  useEffect(() => {
    if (!isConnected || !isInitialized) {
      return
    }

    if (realtimeData.length === 0) {
      return
    }

    const grouped = {}

    realtimeData.forEach((item) => {
      const timestamp = item.tsServer || new Date().toISOString()
      const roundedTime = new Date(timestamp)
      roundedTime.setSeconds(0, 0)
      const key = roundedTime.toISOString()

      if (!grouped[key]) {
        grouped[key] = {
          t: key,
          req: 0,
          res: 0,
          requestCount: 0,
          responseCount: 0,
        }
      }

      grouped[key].req += Number(item.mbpsReq || 0)
      grouped[key].res += Number(item.mbpsRes || 0)
      grouped[key].requestCount += Number(item.pagePktCntReq || 0)
      grouped[key].responseCount += Number(item.pagePktCntRes || 0)
    })

    const newPoints = Object.values(grouped)

    setChartPoints((prev) => {
      const existingTimestamps = new Set(prev.map((p) => p.t))
      const uniqueNewPoints = newPoints.filter((p) => !existingTimestamps.has(p.t))
      const combined = [...prev, ...uniqueNewPoints].sort((a, b) => new Date(a.t) - new Date(b.t))
      return combined.slice(-MAX_POINTS)
    })
  }, [realtimeData, isConnected, isInitialized])

  const visiblePoints = useMemo(() => {
    if (chartPoints.length === 0) return []
    const latestTime = new Date(chartPoints[chartPoints.length - 1].t).getTime()
    const cutoff = latestTime - WINDOW_MS
    return chartPoints.filter((p) => new Date(p.t).getTime() >= cutoff)
  }, [chartPoints])

  const reqData = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.req]),
    [visiblePoints],
  )

  const resData = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.res]),
    [visiblePoints],
  )

  // ⭐ 디버깅 코드
  useEffect(() => {
    console.log('📊 Current threshold settings:', thresholdSettings)
    console.log('📈 Visible points count:', visiblePoints.length)

    if (visiblePoints.length > 0) {
      const latest = visiblePoints[visiblePoints.length - 1]
      console.log('📍 Latest point:', {
        time: latest.t,
        req: latest.req,
        res: latest.res,
        reqAnomaly:
          latest.req < thresholdSettings.requestMin || latest.req > thresholdSettings.requestMax,
        resAnomaly:
          latest.res < thresholdSettings.responseMin || latest.res > thresholdSettings.responseMax,
      })
    }
  }, [visiblePoints, thresholdSettings])

  // ⭐ 새로운 이상치만 감지하도록 수정
  useEffect(() => {
    if (!thresholdSettings.enabled || visiblePoints.length === 0) return

    // 마지막으로 체크한 시간 이후의 새로운 포인트만 확인
    const newPoints = lastCheckedTime
      ? visiblePoints.filter(
          (point) => new Date(point.t).getTime() > new Date(lastCheckedTime).getTime(),
        )
      : visiblePoints.slice(-1) // 처음에는 마지막 포인트만

    if (newPoints.length === 0) return

    newPoints.forEach((point) => {
      // ⭐ key를 타임스탬프만으로 생성 (더 안정적)
      const key = point.t

      if (notifiedAnomaliesRef.current.has(key)) return

      const reqAnomaly =
        point.req < thresholdSettings.requestMin || point.req > thresholdSettings.requestMax

      const resAnomaly =
        point.res < thresholdSettings.responseMin || point.res > thresholdSettings.responseMax

      if (reqAnomaly || resAnomaly) {
        notifiedAnomaliesRef.current.add(key)

        const time = new Date(point.t).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        const anomalies = []

        if (reqAnomaly) {
          const status = point.req > thresholdSettings.requestMax ? '초과' : '미달'
          anomalies.push(
            `🔵 Request: ${point.req.toFixed(2)} Mbps ${status} (정상: ${thresholdSettings.requestMin}~${thresholdSettings.requestMax})`,
          )
        }

        if (resAnomaly) {
          const status = point.res > thresholdSettings.responseMax ? '초과' : '미달'
          anomalies.push(
            `🟢 Response: ${point.res.toFixed(2)} Mbps ${status} (정상: ${thresholdSettings.responseMin}~${thresholdSettings.responseMax})`,
          )
        }

        console.log('🚨 이상치 감지:', { time, point, anomalies }) // ⭐ 디버깅용

        showTrafficAnomalyToast({ time, anomalies })
      }
    })

    // ⭐ 마지막 체크 시간 업데이트
    if (newPoints.length > 0) {
      setLastCheckedTime(newPoints[newPoints.length - 1].t)
    }

    // 오래된 알림 정리 (5분 이상 된 것)
    const now = Date.now()
    const cleanupThreshold = now - WINDOW_MS

    Array.from(notifiedAnomaliesRef.current).forEach((key) => {
      if (new Date(key).getTime() < cleanupThreshold) {
        notifiedAnomaliesRef.current.delete(key)
      }
    })
  }, [visiblePoints, thresholdSettings, lastCheckedTime])

  // ⭐ 임계값 설정 적용 핸들러
  const handleApplyThreshold = (newSettings) => {
    setThresholdSettings(newSettings)
    notifiedAnomaliesRef.current.clear() // ⭐ 새로운 임계값 적용 시 초기화
    setLastCheckedTime(null) // ⭐ 처음부터 다시 체크
    console.log('✅ 새로운 임계값 설정:', newSettings)
    setIsSettingsOpen(false)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  // ⭐ 이상치 감지 로직 개선 (스캐터 추가)
  const anomalyPoints = useMemo(() => {
    if (!thresholdSettings.enabled) return { reqAnomalies: [], resAnomalies: [] }

    const reqAnomalies = []
    const resAnomalies = []

    visiblePoints.forEach((point) => {
      const timestamp = new Date(point.t).getTime()

      // Request 이상치
      if (point.req < thresholdSettings.requestMin || point.req > thresholdSettings.requestMax) {
        reqAnomalies.push([timestamp, point.req])
      }

      // Response 이상치
      if (point.res < thresholdSettings.responseMin || point.res > thresholdSettings.responseMax) {
        resAnomalies.push([timestamp, point.res])
      }
    })

    return { reqAnomalies, resAnomalies }
  }, [visiblePoints, thresholdSettings])

  const option = useMemo(() => {
    // ⭐ 2. markArea 생성 로직 개선
    const createMarkArea = (min, max, color) => {
      if (!thresholdSettings.enabled) {
        return undefined // null 대신 undefined 반환
      }

      return {
        silent: true,
        itemStyle: {
          color: color,
          opacity: 0.15,
        },
        label: {
          show: true,
          position: 'insideTopLeft',
          formatter: `정상 범위\n${min} - ${max} Mbps`,
          fontSize: 10,
          color: '#666',
        },
        data: [[{ yAxis: min }, { yAxis: max }]],
      }
    }

    return {
      grid: { top: 56, left: 44, right: 16, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
        },
        formatter: (params) => {
          if (!params || params.length === 0) return ''

          const requestParam = params.find((p) => p.seriesName === 'Request')
          const responseParam = params.find((p) => p.seriesName === 'Response')

          if (!requestParam && !responseParam) return ''

          const dataIndex = (requestParam || responseParam).dataIndex
          const point = visiblePoints[dataIndex]
          if (!point) return ''

          const time = new Date(point.t).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })

          let result = `<div style="font-size: 12px; font-weight: 500; margin-bottom: 4px;">${time}</div>`

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
          ...(thresholdSettings.enabled && {
            markArea: createMarkArea(
              thresholdSettings.requestMin,
              thresholdSettings.requestMax,
              '#5470c6',
            ),
          }),
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
          ...(thresholdSettings.enabled && {
            markArea: createMarkArea(
              thresholdSettings.responseMin,
              thresholdSettings.responseMax,
              '#91cc75',
            ),
          }),
        },
        // Request 이상치 스캐터
        {
          name: 'Request 이상',
          type: 'scatter',
          symbol: 'circle',
          symbolSize: 12,
          itemStyle: {
            color: '#ff4d4f',
            borderColor: '#fff',
            borderWidth: 2,
          },
          data: anomalyPoints.reqAnomalies,
          z: 10, // 다른 시리즈 위에 표시
        },
        // Response 이상치 스캐터
        {
          name: 'Response 이상',
          type: 'scatter',
          symbol: 'circle',
          symbolSize: 12,
          itemStyle: {
            color: '#faad14',
            borderColor: '#fff',
            borderWidth: 2,
          },
          data: anomalyPoints.resAnomalies,
          z: 10,
        },
      ],
      animation: true,
      animationDuration: 300,
      animationEasing: 'linear',
      animationDurationUpdate: 300,
      animationEasingUpdate: 'linear',
    }
  }, [reqData, resData, visiblePoints, thresholdSettings, anomalyPoints])

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

  const dataSource = isConnected ? '실시간' : 'DB'
  const dataCount = visiblePoints.length

  return (
    <>
      <WidgetCard
        icon={<ChartLineIcon />}
        title='실시간 트래픽 추이'
        description={`Mbps 기준, Request/Response 구분 (${dataSource} - ${dataCount}개)`}
        showInfo={true}
        showSettings={true}
        showClose={true}
        widgetInfo={WIDGET_INFO}
        onClose={onClose}
        onSettings={() => setIsSettingsOpen(true)}
      >
        <div className='h-70'>
          {isLoading && chartPoints.length === 0 ? (
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

      {/* 설정 모달 */}
      {isSettingsOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
          {/* 배경 오버레이 */}
          <div
            className='absolute inset-0 bg-black/40'
            onClick={handleCloseSettings}
            aria-hidden='true'
          />

          {/* 모달 컨텐츠 */}
          <div
            className='relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
            {/* 바디 */}
            <div className='p-6'>
              <TrafficTrendSetting
                currentSettings={thresholdSettings}
                onSave={handleApplyThreshold}
                onClose={handleCloseSettings}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

TrafficTrend.propTypes = {
  onClose: PropTypes.func,
}

export default TrafficTrend
