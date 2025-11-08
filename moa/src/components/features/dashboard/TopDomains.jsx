import TrendingUpIcon from '@/assets/icons/trending-up.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'

const TopDomains = () => {
  return (
    <WidgetCard
      icon={<TrendingUpIcon />}
      title='Top 10 도메인'
      description='도메인 분포'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('Top 10 도메인 설정')}
      onClose={() => console.log('Top 10 도메인 닫기')}
    >
      {/* 여기에 차트 등 본문 */}
      <div className='h-56'>리스트 자리</div>
    </WidgetCard>
  )
}

export default TopDomains
