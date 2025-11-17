// src/components/features/dashboard/widget/ErrorRateTrend.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const formatTimeLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const ErrorRateTrend = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.errorRateTrend ?? []

  let content

  if (isLoading && !list.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        에러율 추세 데이터를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        에러율 추세 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!list.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 에러율 추세 데이터가 없습니다.
      </div>
    )
  } else {
    const x = list.map((p) => formatTimeLabel(p.timestamp))

    const option = {
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v) => `${v.toFixed(1)} %`,
      },
      legend: {
        top: 0,
        data: ['전체 에러율', '클라이언트 에러율', '서버 에러율'],
      },
      grid: {
        left: 40,
        right: 16,
        top: 32,
        bottom: 24,
      },
      xAxis: {
        type: 'category',
        data: x,
        boundaryGap: false,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: '%',
        axisLabel: {
          formatter: (v) => v.toFixed(0),
        },
      },
      series: [
        {
          name: '전체 에러율',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: list.map((p) => p.errorRate ?? 0),
        },
        {
          name: '클라이언트 에러율',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: list.map((p) => p.clientErrorRate ?? 0),
        },
        {
          name: '서버 에러율',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: list.map((p) => p.serverErrorRate ?? 0),
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 220 }} />
  }

  return (
    <WidgetCard
      title='에러율 추이'
      description='시간대별 전체 / 클라이언트 / 서버 에러율'
      icon='⚠️'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

ErrorRateTrend.propTypes = {
  onClose: PropTypes.func,
}

export default ErrorRateTrend
