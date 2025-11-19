// httpStatusCodeDistribution.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const HttpStatusDonut = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.httpStatusCodeDistribution ?? []

  // 상태코드 그룹을 항상 고정 순서로 정렬하고, 누락된 그룹은 0으로 채움
  const STATUS_ORDER = ['2xx', '3xx', '4xx', '5xx']

  const ordered = STATUS_ORDER.map((group) => {
    const found = list.find((it) => it.statusGroup === group) || {}
    return {
      statusGroup: group,
      count: found.count ?? 0,
      percentage: found.percentage ?? 0,
    }
  })

  const total = ordered.reduce((sum, it) => sum + (it.count ?? 0), 0)
  const success = ordered[0] // 2xx
  const successRate = success ? (success.percentage ?? 0) : 0

  const seriesData = ordered.map((it) => ({
    name: it.statusGroup,
    value: it.count ?? 0,
  }))

  const colorMap = {
    '2xx': '#22C55E', // 성공
    '3xx': '#3B82F6', // 리다이렉트
    '4xx': '#F97316', // 클라이언트 오류
    '5xx': '#EF4444', // 서버 오류
  }

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
          const target = ordered.find((it) => it.statusGroup === p.name)
          const pct = target?.percentage ?? 0

          const labelMap = {
            '2xx': '2xx (성공)',
            '3xx': '3xx (리다이렉트)',
            '4xx': '4xx (클라이언트 오류)',
            '5xx': '5xx (서버 오류)',
          }

          const label = labelMap[p.name] ?? p.name

          return `${label}<br/>건수: ${p.value.toLocaleString()}<br/>비율: ${pct.toFixed(1)}%`
        },
      },
      legend: {
        bottom: 0,
        orient: 'horizontal',
      },
      color: STATUS_ORDER.map((g) => colorMap[g]),
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
            text: '성공률 (2xx)',
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
