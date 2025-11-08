import ClockIcon from '@/assets/icons/clock.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'

const AvgResponseTime = () => {
  return (
    <WidgetCard
      icon={<ClockIcon />}
      title='평균 응답 시간'
      description='성능 지표'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('평균 응답 시간 설정')}
      onClose={() => console.log('평균 응답 시간 닫기')}
    >
      {/* 여기에 차트 등 본문 */}
      <div className='h-56'>리스트 자리</div>
    </WidgetCard>
  )
}

export default AvgResponseTime
