import React from 'react'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const DevicePerformanceDistribution = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.devicePerformanceDistribution ?? []

  const mapped = list.map((d) => ({
    deviceType: d.deviceType || 'Unknown',
    requestCount: d.requestCount ?? 0,
    trafficPercentage: d.trafficPercentage ?? 0,
    avgPageLoadTime: d.avgPageLoadTime ?? 0,
    avgResponseTime: d.avgResponseTime ?? 0,
  }))

  const totalReq = mapped.reduce((sum, d) => sum + d.requestCount, 0)

  let content

  if (isLoading && !mapped.length) {
    content = (
      <div className='flex h-40 items-center justify-center text-sm text-gray-400'>
        디바이스별 성능 데이터를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-40 items-center justify-center text-sm text-red-500'>
        디바이스별 성능 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!mapped.length) {
    content = (
      <div className='flex h-40 items-center justify-center text-sm text-gray-400'>
        표시할 디바이스별 성능 데이터가 없습니다.
      </div>
    )
  } else {
    const option = {
      grid: {
        top: 30,
        left: 10,
        right: 10,
        bottom: 40,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const p = params[0]
          const d = mapped[p.dataIndex]
          return [
            `<b>${d.deviceType || 'Unknown'}</b>`,
            `요청 수: ${d.requestCount.toLocaleString()}`,
            `트래픽 비율: ${d.trafficPercentage.toFixed(1)}%`,
            `평균 페이지 로드: ${d.avgPageLoadTime.toFixed(2)} s`,
            `평균 응답시간: ${d.avgResponseTime.toFixed(2)} s`,
          ].join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        data: mapped.map((d) => d.deviceType),
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          fontSize: 11,
          formatter: (v) => (v.length > 8 ? v.slice(0, 7) + '…' : v),
        },
      },
      yAxis: {
        type: 'value',
        name: '요청 수',
        nameTextStyle: { fontSize: 11, color: '#64748B' },
        axisLine: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: '#E2E8F0', type: 'dashed' },
        },
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: mapped.map((d) => d.requestCount),
          barWidth: 22,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: '#3877BE',
          },
        },
      ],
    }

    content = (
      <div className='flex flex-col gap-2'>
        {/* 상단 요약 KPI (작게) */}
        <div className='flex items-center justify-between text-xs text-gray-600'>
          <span>총 요청 수</span>
          <span className='font-semibold text-gray-800'>{totalReq.toLocaleString()} 건</span>
        </div>

        {/* 컴팩트 차트: 높이 줄임 */}
        <div className='h-44'>
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>

        {/* 하단 리스트: 상위 2~3개만 보여주기 */}
        <div className='mt-1 space-y-1'>
          {mapped.slice(0, 3).map((d) => (
            <div
              key={d.deviceType}
              className='flex items-center justify-between text-[11px] text-gray-600'
            >
              <div className='flex items-center gap-1'>
                <span className='inline-block h-2 w-2 rounded-full bg-[#3877BE]' />
                <span className='font-medium'>{d.deviceType || 'Unknown'}</span>
              </div>
              <div className='flex items-center gap-3'>
                <span>{d.requestCount.toLocaleString()}건</span>
                <span className='text-gray-400'>
                  {d.avgPageLoadTime.toFixed(2)}s / {d.avgResponseTime.toFixed(2)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <WidgetCard
      title='디바이스별 트래픽 성능'
      description='디바이스 유형에 따른 요청 수 및 지연 시간'
      icon='💻'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

DevicePerformanceDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default DevicePerformanceDistribution
