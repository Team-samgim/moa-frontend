// src/components/features/dashboard/widget/AvgResponseTime.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const formatTimeLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  // HH:mm 형식
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const AvgResponseTime = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const points = data?.responseTimeStats ?? []

  let content

  if (isLoading && !points.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        응답시간 통계 로딩 중...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        응답시간 통계 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!points.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 응답시간 통계가 없습니다.
      </div>
    )
  } else {
    const x = points.map((p) => formatTimeLabel(p.timestamp))

    const option = {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v) => `${v.toFixed(2)} s`,
      },
      legend: {
        top: 0,
        data: ['Avg', 'P95', 'P99'],
      },
      grid: {
        left: 40,
        right: 16,
        top: 32,
        bottom: 24,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: x,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '초 (s)',
        axisLabel: {
          formatter: (v) => v.toFixed(2),
        },
      },
      series: [
        {
          name: 'Avg',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.avgResponseTime ?? 0),
        },
        {
          name: 'P95',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.p95ResponseTime ?? 0),
        },
        {
          name: 'P99',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: points.map((p) => p.p99ResponseTime ?? 0),
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 220 }} />
  }

  return (
    <WidgetCard
      title='응답시간 통계'
      description='평균·P95·P99 응답시간 추이'
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
