// TopDomains.jsx
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

  const maxTime = Math.max(...top10.map((d) => d.avgResponseTime ?? 0), 1)

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
    content = (
      <div className='space-y-2 overflow-y-auto' style={{ maxHeight: '400px' }}>
        {top10.map((item, idx) => {
          const avgTime = item.avgResponseTime ?? 0
          const count = item.requestCount ?? 0
          const uri = item.httpUri || 'Unknown'
          const percentage = (avgTime / maxTime) * 100

          // 상위 3개는 경고색
          let barColor = 'bg-blue-500'
          let badgeBg = 'bg-blue-100'
          let badgeText = 'text-blue-700'

          if (idx === 0) {
            barColor = 'bg-red-500'
            badgeBg = 'bg-red-100'
            badgeText = 'text-red-700'
          } else if (idx === 1) {
            barColor = 'bg-orange-500'
            badgeBg = 'bg-orange-100'
            badgeText = 'text-orange-700'
          } else if (idx === 2) {
            barColor = 'bg-yellow-500'
            badgeBg = 'bg-yellow-100'
            badgeText = 'text-yellow-700'
          }

          return (
            <div
              key={idx}
              className='rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md'
            >
              {/* 상단: 순위 + URI */}
              <div className='mb-2 flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeBg} ${badgeText}`}
                  >
                    {idx + 1}
                  </span>
                  <span className='text-xs font-medium text-gray-700' title={uri}>
                    {uri.length > 50 ? uri.slice(0, 50) + '...' : uri}
                  </span>
                </div>
              </div>

              {/* 중단: 프로그레스 바 */}
              <div className='mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100'>
                <div
                  className={`h-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* 하단: 응답시간 + 요청수 */}
              <div className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-3'>
                  <span className='font-semibold text-gray-800'>{avgTime.toFixed(2)}s</span>
                  <span className='text-gray-500'>평균 응답시간</span>
                </div>
                <span className='text-gray-600'>{count.toLocaleString()}건</span>
              </div>
            </div>
          )
        })}
      </div>
    )
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
