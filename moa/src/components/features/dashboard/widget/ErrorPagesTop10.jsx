// src/components/features/dashboard/widget/ErrorPagesTop10.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const ErrorPagesTop10 = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.errorPages ?? []

  // errorCount 기준 내림차순 Top10
  const top10 = list
    .slice()
    .sort((a, b) => (b.errorCount ?? 0) - (a.errorCount ?? 0))
    .slice(0, 10)

  let content

  if (isLoading && !top10.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        에러 페이지 정보를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        에러 페이지 정보를 불러오지 못했습니다.
      </div>
    )
  } else if (!top10.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 에러 페이지가 없습니다.
      </div>
    )
  } else {
    const uris = top10.map((p) => p.httpUri)
    const counts = top10.map((p) => p.errorCount ?? 0)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0]
          const item = top10[p.dataIndex]
          return [
            item.httpUri,
            `에러 코드: ${item.httpResCode}`,
            `에러 건수: ${item.errorCount}`,
            `Avg 응답시간: ${item.avgResponseTime?.toFixed?.(2) ?? item.avgResponseTime} s`,
            `심각도: ${item.severity}`,
          ].join('<br/>')
        },
      },
      grid: {
        left: 120,
        right: 16,
        top: 16,
        bottom: 24,
      },
      xAxis: {
        type: 'value',
        name: '에러 건수',
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: uris,
        axisLabel: {
          fontSize: 10,
          formatter: (value) => (value.length > 40 ? value.slice(0, 37) + '...' : value),
        },
      },
      series: [
        {
          name: '에러 건수',
          type: 'bar',
          data: counts,
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 260 }} />
  }

  return (
    <WidgetCard
      title='에러 페이지 Top 10'
      description='에러 건수가 많은 URI'
      icon='🧯'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

ErrorPagesTop10.propTypes = {
  onClose: PropTypes.func,
}

export default ErrorPagesTop10
