/**
 * 작성자: 정소영
 */
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { createNotification } from '@/api/notification'
import ChartLineIcon from '@/assets/icons/chart-line.svg?react'
import { showTrafficAnomalyToast } from '@/components/features/dashboard/Toast'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
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
  const navigate = useNavigate()
  const chartRef = useRef(null)
  const [chartPoints, setChartPoints] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState(null)
  const notifiedAnomaliesRef = useRef(new Set())

  const [thresholdSettings, setThresholdSettings] = useState({
    requestMin: 0,
    requestMax: 0.2,
    responseMin: 0,
    responseMax: 0.4,
    enabled: true,
  })

  const { data: dbData, isLoading } = useTrafficTrend()
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)
  const filters = useDashboardStore((state) => state.filters)

  // visiblePoints는 여기서 먼저 계산 (useCallback에서 사용하기 위해)
  const visiblePoints = useMemo(() => {
    if (chartPoints.length === 0) return []
    const latestTime = new Date(chartPoints[chartPoints.length - 1].t).getTime()
    const cutoff = latestTime - WINDOW_MS
    return chartPoints.filter((p) => new Date(p.t).getTime() >= cutoff)
  }, [chartPoints])

  // ⭐ 이상치 클릭 시 검색 페이지로 이동
  const handleAnomalyClick = useCallback(
    (point) => {
      const clickedTime = new Date(point.t).getTime() / 1000

      const reqAnomaly =
        point.req < thresholdSettings.requestMin || point.req > thresholdSettings.requestMax
      const resAnomaly =
        point.res < thresholdSettings.responseMin || point.res > thresholdSettings.responseMax

      let anomalyType = ''
      if (reqAnomaly && resAnomaly) {
        anomalyType = 'Request & Response 이상'
      } else if (reqAnomaly) {
        anomalyType = point.req > thresholdSettings.requestMax ? 'Request 초과' : 'Request 미달'
      } else if (resAnomaly) {
        anomalyType = point.res > thresholdSettings.responseMax ? 'Response 초과' : 'Response 미달'
      }

      navigate('/search', {
        state: {
          autoFill: true,
          layer: 'HTTP_PAGE',
          timeRange: {
            fromEpoch: clickedTime - 1800,
            toEpoch: clickedTime + 1800,
          },
          viewKeys: [
            'ts_server_nsec',
            'ts_server',
            'http_host',
            'http_uri',
            'http_method',
            'http_res_code',
            'country_name_req',
            'src_ip',
          ],
          dashboardFilters: filters,
          anomalyContext: {
            timestamp: point.t,
            requestMbps: point.req,
            responseMbps: point.res,
            requestCount: point.requestCount,
            responseCount: point.responseCount,
            type: anomalyType,
          },
        },
      })
    },
    [navigate, filters, thresholdSettings],
  )

  // ⭐ 차트 클릭 핸들러
  const handleChartClick = useCallback(
    (params) => {
      console.log('🖱️ 차트 클릭 감지:', params)

      if (params.seriesName === 'Request 이상' || params.seriesName === 'Response 이상') {
        console.log('🎯 이상치 포인트 클릭!')

        const timestamp = params.value[0]
        const point = visiblePoints.find((p) => new Date(p.t).getTime() === timestamp)

        if (point) {
          console.log('매칭된 포인트 찾음:', point)
          handleAnomalyClick(point)
        } else {
          console.log('❌ 매칭된 포인트 못 찾음')
        }
      }
    },
    [visiblePoints, handleAnomalyClick],
  )

  // ⭐ 차트 준비 완료 핸들러
  const handleChartReady = useCallback(
    (chartInstance) => {
      console.log('차트 준비 완료! 클릭 이벤트 등록')
      chartInstance.on('click', handleChartClick)
    },
    [handleChartClick],
  )

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

  const reqData = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.req]),
    [visiblePoints],
  )

  const resData = useMemo(
    () => visiblePoints.map((p) => [new Date(p.t).getTime(), p.res]),
    [visiblePoints],
  )

  // 이상치 감지 및 알림
  useEffect(() => {
    if (!thresholdSettings.enabled || visiblePoints.length === 0) return

    const newPoints = lastCheckedTime
      ? visiblePoints.filter(
          (point) => new Date(point.t).getTime() > new Date(lastCheckedTime).getTime(),
        )
      : visiblePoints.slice(-1)

    if (newPoints.length === 0) return

    newPoints.forEach(async (point) => {
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

        console.log('🚨 이상치 감지:', { time, point, anomalies })

        showTrafficAnomalyToast({ time, anomalies })

        try {
          await createNotification({
            type: 'DASHBOARD',
            title: '⚠️ 트래픽 이상 감지',
            content: `${time}\n${anomalies.join('\n')}`,
            config: {
              timestamp: point.t,
              requestMbps: point.req,
              responseMbps: point.res,
              requestCount: point.requestCount,
              responseCount: point.responseCount,
              thresholds: thresholdSettings,
            },
          })
          console.log('알림이 DB에 저장되었습니다')
        } catch (error) {
          console.error('❌ 알림 저장 실패:', error)
        }
      }
    })

    if (newPoints.length > 0) {
      setLastCheckedTime(newPoints[newPoints.length - 1].t)
    }

    const now = Date.now()
    const cleanupThreshold = now - WINDOW_MS

    Array.from(notifiedAnomaliesRef.current).forEach((key) => {
      if (new Date(key).getTime() < cleanupThreshold) {
        notifiedAnomaliesRef.current.delete(key)
      }
    })
  }, [visiblePoints, thresholdSettings, lastCheckedTime])

  const handleApplyThreshold = (newSettings) => {
    setThresholdSettings(newSettings)
    notifiedAnomaliesRef.current.clear()
    setLastCheckedTime(null)
    console.log('새로운 임계값 설정:', newSettings)
    setIsSettingsOpen(false)
  }

  const handleCloseSettings = () => {
    setIsSettingsOpen(false)
  }

  const anomalyPoints = useMemo(() => {
    if (!thresholdSettings.enabled) return { reqAnomalies: [], resAnomalies: [] }

    const reqAnomalies = []
    const resAnomalies = []

    visiblePoints.forEach((point) => {
      const timestamp = new Date(point.t).getTime()

      if (point.req < thresholdSettings.requestMin || point.req > thresholdSettings.requestMax) {
        reqAnomalies.push([timestamp, point.req])
      }

      if (point.res < thresholdSettings.responseMin || point.res > thresholdSettings.responseMax) {
        resAnomalies.push([timestamp, point.res])
      }
    })

    return { reqAnomalies, resAnomalies }
  }, [visiblePoints, thresholdSettings])

  const option = useMemo(() => {
    const createMarkArea = (min, max, color) => {
      if (!thresholdSettings.enabled) {
        return undefined
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
          z: 10,
          silent: false,
          emphasis: {
            scale: 1.3,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(255, 77, 79, 0.5)',
            },
          },
        },
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
          silent: false,
          emphasis: {
            scale: 1.3,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(250, 173, 20, 0.5)',
            },
          },
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
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              onChartReady={handleChartReady}
            />
          )}
        </div>
      </WidgetCard>

      {isSettingsOpen && (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={handleCloseSettings}
            aria-hidden='true'
          />

          <div
            className='relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto'
            onClick={(e) => e.stopPropagation()}
          >
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
