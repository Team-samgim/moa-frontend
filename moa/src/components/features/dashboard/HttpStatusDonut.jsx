import ChartLineIcon from '@/assets/icons/chart-line.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'

const HttpStatusDonut = () => {
  return (
    <WidgetCard
      icon={<ChartLineIcon />}
      title='HTTP 상태코드'
      description='응답 분포'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('HTTP 상태코드 설정')}
      onClose={() => console.log('HTTP 상태코드 닫기')}
    >
      {/* 여기에 차트 등 본문 */}
      <div className='h-56'>도넛 차트 자리</div>
    </WidgetCard>
  )
}

export default HttpStatusDonut
