// src/components/features/dashboard/widget/BrowserPerformance.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const BrowserPerformance = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.browserPerformance ?? []

  let content

  if (isLoading && !list.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        브라우저 성능 데이터를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        브라우저 성능 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!list.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 브라우저 성능 데이터가 없습니다.
      </div>
    )
  } else {
    const browsers = list.map((b) => b.browser || 'Unknown')
    const pageLoad = list.map((b) => b.avgPageLoadTime ?? 0)
    const response = list.map((b) => b.avgResponseTime ?? 0)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v) => `${v.toFixed(2)} s`,
      },
      legend: {
        top: 0,
      },
      grid: {
        left: 40,
        right: 16,
        top: 32,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: browsers,
        axisLabel: {
          rotate: 20,
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        name: '초 (s)',
        axisLabel: {
          formatter: (v) => v.toFixed(1),
        },
      },
      series: [
        {
          name: '페이지 로드',
          type: 'bar',
          data: pageLoad,
        },
        {
          name: '응답 시간',
          type: 'bar',
          data: response,
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 240 }} />
  }

  return (
    <WidgetCard
      title='브라우저별 성능'
      description='브라우저별 평균 로드/응답 시간'
      icon='🌐'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

BrowserPerformance.propTypes = {
  onClose: PropTypes.func,
}

export default BrowserPerformance
