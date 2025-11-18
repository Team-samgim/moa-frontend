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
import { usePageLoadTimeTrend } from '@/hooks/queries/useDashboard'

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  TitleComponent,
  CanvasRenderer,
])

// 위젯 설명 데이터
const WIDGET_INFO = {
  title: '페이지 로드 시간 트렌드',
  description: '시간대별 페이지 로딩 성능 추이 (초 단위)',
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
  const { data, isError } = usePageLoadTimeTrend()
  const chartRef = useRef(null)

  const points = data?.points ?? []

  // 차트 데이터 준비
  const avgData = useMemo(() => points.map((p) => [new Date(p.t).getTime(), p.avg]), [points])
  const p95Data = useMemo(() => points.map((p) => [new Date(p.t).getTime(), p.p95]), [points])
  const p99Data = useMemo(() => points.map((p) => [new Date(p.t).getTime(), p.p99]), [points])

  const option = useMemo(() => {
    return {
      grid: { top: 50, left: 60, right: 20, bottom: 0 },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!params || params.length === 0) return ''

          const dataIndex = params[0].dataIndex
          const point = points[dataIndex]
          if (!point) return ''

          const time = new Date(point.t).toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
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
        axisLabel: { hideOverlap: true },
      },
      yAxis: {
        type: 'value',
        name: '로드 시간 (초)',
        alignTicks: true,
        splitLine: { show: true },
        axisLabel: {
          formatter: (value) => `${value.toFixed(2)}s`,
        },
      },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 14 }],
      series: [
        {
          name: '평균',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          sampling: 'lttb',
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 },
          data: avgData,
        },
        {
          name: 'P95',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          sampling: 'lttb',
          lineStyle: { width: 2, type: 'dashed' },
          data: p95Data,
        },
        {
          name: 'P99',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          sampling: 'lttb',
          lineStyle: { width: 2, type: 'dotted' },
          data: p99Data,
        },
      ],
      animation: points.length < 2000,
    }
  }, [avgData, p95Data, p99Data, points])

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
  }, [])

  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='페이지 로드 시간 트렌드'
      description='시간대별 페이지 로딩 성능 추이'
      showInfo={true}
      showSettings={true}
      showClose={true}
      widgetInfo={WIDGET_INFO}
      onSettings={() => console.log('페이지 로드 시간 설정')}
      onClose={onClose}
    >
      <div className='h-70'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>
            페이지 로드 시간 데이터를 불러오지 못했어요.
          </div>
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
PageLoadTimeTrend.propTypes = {
  onClose: PropTypes.func,
}

export default PageLoadTimeTrend
