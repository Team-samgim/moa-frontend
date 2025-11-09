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
import ChartLineIcon from '@/assets/icons/chart-line.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useTrafficTrend } from '@/hooks/queries/useDashboard'

// ECharts (tree-shakable imports)

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

const TrafficTrend = () => {
  const { data, isError } = useTrafficTrend()
  const chartRef = useRef(null)

  const points = data?.points ?? []

  // x축: time, y축: Mbps. [timestamp,value] 형태가 성능/정확도에 좋음
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

  // 컨테이너 크기 변화 대응 (사이드바 토글 등)
  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return
    const el = inst.getDom()
    const ro = new ResizeObserver(() => inst.resize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [points])

  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='실시간 트래픽 추이'
      description='Mbps 기준, Request/Response 구분'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('트래픽 추이 설정')}
      onClose={() => console.log('트래픽 추이 닫기')}
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

export default TrafficTrend
