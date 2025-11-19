// src/components/features/dashboard/widget/ErrorPagesTop10.jsx
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
    content = (
      <div className='space-y-3 overflow-y-auto' style={{ maxHeight: '400px' }}>
        {top10.map((item, idx) => {
          const uri = item.httpUri || 'Unknown'
          const errorCode = item.httpResCode || '???'
          const errorCount = item.errorCount ?? 0
          const avgTime = item.avgResponseTime ?? 0
          const severity = item.severity || 'MEDIUM'

          // 에러 코드에 따른 색상
          const isClientError = String(errorCode).startsWith('4')
          const isServerError = String(errorCode).startsWith('5')

          let codeBg = 'bg-gray-100'
          let codeText = 'text-gray-700'
          let borderColor = 'border-gray-300'

          if (isServerError) {
            codeBg = 'bg-red-100'
            codeText = 'text-red-700'
            borderColor = 'border-red-300'
          } else if (isClientError) {
            codeBg = 'bg-orange-100'
            codeText = 'text-orange-700'
            borderColor = 'border-orange-300'
          }

          // 심각도 배지
          let severityBg = 'bg-yellow-100'
          let severityText = 'text-yellow-700'
          let severityLabel = '보통'

          if (severity === 'HIGH' || severity === 'CRITICAL') {
            severityBg = 'bg-red-100'
            severityText = 'text-red-700'
            severityLabel = '높음'
          } else if (severity === 'LOW') {
            severityBg = 'bg-blue-100'
            severityText = 'text-blue-700'
            severityLabel = '낮음'
          }

          return (
            <div
              key={idx}
              className={`rounded-lg border-l-4 ${borderColor} bg-white p-3 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className='flex items-start gap-3'>
                {/* 왼쪽: 에러 코드 */}
                <div className='flex flex-col items-center gap-1'>
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-lg font-bold ${codeBg} ${codeText}`}
                  >
                    {errorCode}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityBg} ${severityText}`}
                  >
                    {severityLabel}
                  </span>
                </div>

                {/* 오른쪽: URI + 정보 */}
                <div className='flex-1'>
                  {/* URI */}
                  <div className='mb-1 text-xs font-medium text-gray-700' title={uri}>
                    {uri.length > 60 ? uri.slice(0, 60) + '...' : uri}
                  </div>

                  {/* 통계 */}
                  <div className='flex items-center gap-4 text-xs text-gray-600'>
                    <div className='flex items-center gap-1'>
                      <span className='text-gray-500'>에러:</span>
                      <span className='font-semibold text-red-600'>
                        {errorCount.toLocaleString()}건
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='text-gray-500'>응답:</span>
                      <span className='font-semibold'>{avgTime.toFixed(2)}s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
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
