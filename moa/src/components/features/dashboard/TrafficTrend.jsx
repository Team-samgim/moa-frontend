import ChartLineIcon from '@/assets/icons/chart-line.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'

const TrafficTrend = () => {
  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='실시간 트래픽 추이'
      description='Mbps 기준, Request/Response 구분'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('트래픽 추이 설정')}
      onClose={() => console.log('트래픽 추이 닫기')}
    >
      {/* 여기에 차트 등 본문 */}
      <div className='h-56'>라인 차트 자리</div>
    </WidgetCard>
  )
}

export default TrafficTrend
