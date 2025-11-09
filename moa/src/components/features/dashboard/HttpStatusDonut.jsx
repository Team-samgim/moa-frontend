import React, { useMemo, useRef, useEffect } from 'react'
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactECharts from 'echarts-for-react'
import ChartLineIcon from '@/assets/icons/chart-line.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useHttpStatusCodes } from '@/hooks/queries/useDashboard'

// ECharts

echarts.use([PieChart, LegendComponent, TooltipComponent, TitleComponent, CanvasRenderer])

const HttpStatusDonut = () => {
  const { data, isError } = useHttpStatusCodes()
  const chartRef = useRef(null)

  const items = useMemo(() => {
    const b = data?.buckets || {}
    return [
      { name: '2xx Success', value: b?.success?.count ?? 0 },
      { name: '3xx Redirect', value: b?.redirect?.count ?? 0 },
      { name: '4xx Client Error', value: b?.client?.count ?? 0 },
      { name: '5xx Server Error', value: b?.server?.count ?? 0 },
    ]
  }, [data])

  const option = useMemo(() => {
    return {
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'], // success/redirect/client/server
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, type: 'plain', icon: 'roundRect' },
      series: [
        {
          name: 'HTTP Status',
          type: 'pie',
          radius: ['40%', '80%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          data: items,
        },
      ],
      animation: true,
    }
  }, [items])

  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return
    const el = inst.getDom()
    const ro = new ResizeObserver(() => inst.resize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [items])

  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='HTTP 상태코드'
      description='응답 분포'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('HTTP 상태코드 설정')}
      onClose={() => console.log('HTTP 상태코드 닫기')}
    >
      <div className='h-80'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>데이터를 불러오지 못했어요.</div>
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

export default HttpStatusDonut
