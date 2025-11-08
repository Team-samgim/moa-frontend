import MapIcon from '@/assets/icons/map.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'

const GeoTrafficDistribution = () => {
  return (
    <WidgetCard
      icon={<MapIcon />}
      title='지리적 트래픽 분포'
      description='국가별 인터렉티브 히트맵'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('지리적 트래픽 분포 설정')}
      onClose={() => console.log('지리적 트래픽 분포 닫기')}
    >
      {/* 여기에 차트 등 본문 */}
      <div className='h-56'>퍼센트 차트 자리</div>
    </WidgetCard>
  )
}

export default GeoTrafficDistribution
