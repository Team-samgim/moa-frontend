// httpStatusCodeDistribution.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const HttpStatusDonut = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.httpStatusCodeDistribution ?? []

  const total = list.reduce((sum, it) => sum + (it.count ?? 0), 0)
  const success = list.find((it) => it.statusGroup === '2xx')
  const successRate = success ? (success.percentage ?? 0) : 0

  const seriesData = list.map((it) => ({
    name: it.statusGroup,
    value: it.count ?? 0,
  }))

  let content

  if (isLoading && !seriesData.length) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        HTTP 상태코드 분포를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-red-500'>
        HTTP 상태코드 분포를 불러오지 못했습니다.
      </div>
    )
  } else if (!seriesData.length) {
    content = (
      <div className='flex h-60 items-center justify-center text-sm text-gray-400'>
        표시할 상태코드 데이터가 없습니다.
      </div>
    )
  } else {
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const target = list.find((it) => it.statusGroup === p.name)
          const pct = target?.percentage ?? 0
          return `${p.name}<br/>건수: ${p.value.toLocaleString()}<br/>비율: ${pct.toFixed(1)}%`
        },
      },
      legend: {
        bottom: 0,
        orient: 'horizontal',
      },
      color: ['#3877BE', '#4CAF50', '#FF9800', '#E53935'],
      series: [
        {
          type: 'pie',
          radius: ['60%', '80%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          data: seriesData,
        },
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '42%',
          style: {
            text: `${successRate.toFixed(1)}%`,
            textAlign: 'center',
            fill: '#1f2933',
            fontSize: 20,
            fontWeight: 600,
          },
        },
        {
          type: 'text',
          left: 'center',
          top: '58%',
          style: {
            text: '2xx 비율',
            textAlign: 'center',
            fill: '#9CA3AF',
            fontSize: 12,
          },
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 260 }} />
  }

  return (
    <WidgetCard
      title='HTTP 상태코드 분포'
      description='2xx / 3xx / 4xx / 5xx 응답 비율'
      icon='🟢'
      onClose={onClose}
      showSettings={false}
    >
      <div className='mb-2 text-xs text-gray-500 text-right'>
        총 응답: {total.toLocaleString()} 건
      </div>
      {content}
    </WidgetCard>
  )
}

HttpStatusDonut.propTypes = {
  onClose: PropTypes.func,
}

export default HttpStatusDonut
