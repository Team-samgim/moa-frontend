import RefreshIcon from '@/assets/icons/refresh.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'

const TcpErrorGauge = () => {
  return (
    <WidgetCard
      icon={<RefreshIcon />}
      title='TCP 에러율'
      description='전체 TCP 요청 대비 에러 비율'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('TCP 에러율 설정')}
      onClose={() => console.log('TCP 에러율 닫기')}
    >
      {/* 여기에 차트 등 본문 */}
      <div className='h-56'>반 도넛 차트 자리</div>
    </WidgetCard>
  )
}

export default TcpErrorGauge
