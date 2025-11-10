import React, { useMemo, useRef, useEffect } from 'react'
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

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

const TrafficTrend = ({ onClose }) => {
  const { data, isError } = useTrafficTrend()
  const chartRef = useRef(null)

  const points = data?.points ?? []

  const reqData = useMemo(() => points.map((p) => [new Date(p.t).getTime(), p.req]), [points])
  const resData = useMemo(() => points.map((p) => [new Date(p.t).getTime(), p.res]), [points])

  const option = useMemo(() => {
    return {
      grid: { top: 50, left: 44, right: 20, bottom: 0 },
      tooltip: { trigger: 'axis' },
      legend: { top: 8, icon: 'roundRect' },
      xAxis: { type: 'time', boundaryGap: false, axisLabel: { hideOverlap: true } },
      yAxis: { type: 'value', name: 'Mbps', alignTicks: true, splitLine: { show: true } },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14 }],
      series: [
        {
          name: 'Request',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          sampling: 'lttb',
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 },
          data: reqData,
        },
        {
          name: 'Response',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          sampling: 'lttb',
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.15 },
          data: resData,
        },
      ],
      animation: points.length < 2000,
    }
  }, [reqData, resData, points.length])

  // 컨테이너 크기 변화 대응 + cleanup
  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return

    const el = inst.getDom()
    const ro = new ResizeObserver(() => {
      // dispose 체크 추가
      if (!inst.isDisposed()) {
        inst.resize()
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
    }
  }, []) // points 의존성 제거 - 불필요한 재생성 방지

  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='실시간 트래픽 추이'
      description='Mbps 기준, Request/Response 구분'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('트래픽 추이 설정')}
      onClose={onClose}
    >
      <div className='h-70'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>트래픽 데이터를 불러오지 못했어요.</div>
        ) : (
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={option}
            notMerge={true}
            lazyUpdate={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
    </WidgetCard>
  )
}

// PropTypes 추가
TrafficTrend.propTypes = {
  onClose: PropTypes.func,
}

export default TrafficTrend
