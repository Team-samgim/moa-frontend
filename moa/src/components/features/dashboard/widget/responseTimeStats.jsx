// src/components/features/dashboard/widget/AvgResponseTime.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

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
    // 가장 최근 "유효한" 집계 포인트(값이 있는 버킷)를 기준으로 요약 통계 시각화
    const lastNonEmpty =
      [...points]
        .reverse()
        .find(
          (p) =>
            p?.avgResponseTime !== null ||
            p?.p95ResponseTime !== null ||
            p?.p99ResponseTime !== null,
        ) ?? null

    const last = lastNonEmpty ?? points[points.length - 1] ?? {}

    const categories = ['평균 응답시간', 'P95 응답시간', 'P99 응답시간']
    const values = [last.avgResponseTime ?? 0, last.p95ResponseTime ?? 0, last.p99ResponseTime ?? 0]

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v) => `${v.toFixed(2)} s`,
      },
      grid: {
        left: 80,
        right: 24,
        top: 24,
        bottom: 24,
      },
      xAxis: {
        type: 'value',
        name: '초 (s)',
        axisLabel: {
          formatter: (v) => v.toFixed(2),
        },
        splitLine: { show: true },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisTick: { show: false },
      },
      series: [
        {
          name: '응답시간',
          type: 'bar',
          barWidth: 18,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: (p) => `${p.value.toFixed(2)}s`,
          },
          data: values,
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 220 }} />
  }

  return (
    <WidgetCard
      title='응답시간 통계'
      description='선택 구간의 평균·P95·P99 응답시간 요약'
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
