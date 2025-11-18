// TopDomains.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const TopDomains = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.topDomains ?? []

  // 평균 응답시간 기준 내림차순 Top10
  const top10 = list
    .slice()
    .sort((a, b) => (b.avgResponseTime ?? 0) - (a.avgResponseTime ?? 0))
    .slice(0, 10)

  let content

  if (isLoading && !top10.length) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        느린 URI 정보를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-red-500'>
        느린 URI 정보를 불러오지 못했습니다.
      </div>
    )
  } else if (!top10.length) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        표시할 URI 데이터가 없습니다.
      </div>
    )
  } else {
    const uris = top10.map((d) => d.httpUri)
    const avgTimes = top10.map((d) => d.avgResponseTime ?? 0)
    const counts = top10.map((d) => d.requestCount ?? 0)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0]
          const idx = p.dataIndex
          const uri = uris[idx]
          const avg = avgTimes[idx]
          const cnt = counts[idx]
          return [
            uri.length > 80 ? `<b>${uri.slice(0, 80)}...</b>` : `<b>${uri}</b>`,
            `Avg 응답시간: ${avg.toFixed(2)} s`,
            `요청 수: ${cnt.toLocaleString()} 건`,
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
        name: 'Avg 응답시간 (s)',
        axisLabel: {
          formatter: (v) => v.toFixed(1),
        },
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
          name: 'Avg 응답시간',
          type: 'bar',
          data: avgTimes,
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
          },
        },
      ],
      color: ['#3877BE'],
    }

    content = <ReactECharts option={option} style={{ height: 280 }} />
  }

  return (
    <WidgetCard
      title='느린 URI Top 10'
      description='평균 응답시간이 긴 URI 목록'
      icon='🐢'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

TopDomains.propTypes = {
  onClose: PropTypes.func,
}

export default TopDomains
