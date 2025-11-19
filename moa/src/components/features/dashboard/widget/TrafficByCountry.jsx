import * as echarts from 'echarts'
import world from 'echarts-countries-js/echarts-countries-js/world.js'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

// ✅ 세계 지도 GeoJSON 등록 (중복 등록 방지)
if (!echarts.getMap('world')) {
  echarts.registerMap('world', world)
}

const GeoTrafficDistribution = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.trafficByCountry ?? []

  // Unknown 제외 + 요청 수 기준으로 히트맵
  const mapped = list
    .filter((d) => d.country && d.country !== 'Unknown')
    .map((d) => ({
      name: d.country,
      value: d.requestCount ?? 0,
      avgResponseTime: d.avgResponseTime ?? 0,
    }))

  const maxValue = mapped.length > 0 ? Math.max(...mapped.map((d) => d.value || 0)) : 0

  let content

  if (isLoading && !mapped.length) {
    content = (
      <div className='flex h-72 items-center justify-center text-sm text-gray-400'>
        국가별 트래픽 데이터를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-72 items-center justify-center text-sm text-red-500'>
        국가별 트래픽 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!mapped.length) {
    content = (
      <div className='flex h-72 items-center justify-center text-sm text-gray-400'>
        표시할 국가별 트래픽 데이터가 없습니다.
      </div>
    )
  } else {
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const { name, value, data } = params
          const avg = data?.avgResponseTime ?? 0
          return [
            `<b>${name}</b>`,
            `요청 수: ${value.toLocaleString()}`,
            `평균 응답시간: ${avg.toFixed(2)} s`,
          ].join('<br/>')
        },
      },
      visualMap: {
        min: 0,
        max: maxValue || 1,
        left: 16,
        bottom: 16,
        text: ['트래픽 많음', '트래픽 적음'],
        calculable: true,
        inRange: {
          color: ['#E0E7FF', '#3877BE'],
        },
      },
      // geo 컴포넌트를 사용해서 세계 지도를 카드 전체에 명확하게 표시
      geo: {
        map: 'world',
        roam: false,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        itemStyle: {
          areaColor: '#F3F4F6',
          borderColor: '#E5E7EB',
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#BFDBFE',
          },
          label: {
            show: false,
          },
        },
      },
      series: [
        {
          name: '트래픽',
          type: 'map',
          geoIndex: 0,
          data: mapped,
        },
      ],
    }

    // 요청 수 기준 Top 5 국가 리스트
    const topCountries = [...mapped].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5)

    content = (
      <div className='grid h-80 grid-cols-3 gap-4'>
        {/* 왼쪽: 세계 지도 */}
        <div className='col-span-2 h-full'>
          <ReactECharts echarts={echarts} option={option} style={{ height: '100%' }} />
        </div>

        {/* 오른쪽: Top 국가 리스트 */}
        <div className='col-span-1 flex h-full flex-col text-xs'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='font-semibold text-gray-700'>Top 5 국가</span>
            <span className='text-[10px] text-gray-400'>요청 수 기준</span>
          </div>
          <div className='flex-1 space-y-1 overflow-y-auto pr-1'>
            {topCountries.map((c, index) => (
              <div
                key={c.name}
                className='flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5'
              >
                <div className='flex items-center gap-2'>
                  <span className='text-[10px] font-semibold text-gray-500'>{index + 1}</span>
                  <span className='text-[11px] font-medium text-gray-800'>{c.name}</span>
                </div>
                <div className='text-right'>
                  <div className='text-[11px] font-semibold text-gray-700'>
                    {(c.value ?? 0).toLocaleString()}건
                  </div>
                  <div className='text-[10px] text-gray-500'>
                    평균 {c.avgResponseTime?.toFixed?.(2) ?? c.avgResponseTime} s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Unknown은 따로 표시
  const unknown = list.find((d) => !d.country || d.country === 'Unknown')

  return (
    <WidgetCard
      title='국가별 트래픽 분포'
      description='요청 수 기준 국가별 트래픽 히트맵'
      icon='🗺️'
      onClose={onClose}
      showSettings={false}
    >
      {content}
      {unknown && (
        <div className='mt-2 text-xs text-gray-500 text-right'>
          기타 / Unknown: {unknown.requestCount ?? 0}건 ( 평균 응답{' '}
          {unknown.avgResponseTime?.toFixed?.(2) ?? unknown.avgResponseTime} s)
        </div>
      )}
    </WidgetCard>
  )
}

GeoTrafficDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default GeoTrafficDistribution
