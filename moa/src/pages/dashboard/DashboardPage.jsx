import AvgResponseTime from '@/components/features/dashboard/AvgResponseTime'
import GeoTrafficDistribution from '@/components/features/dashboard/GeoTrafficDistribution'
import HttpStatusDonut from '@/components/features/dashboard/HttpStatusDonut'
import TcpErrorGauge from '@/components/features/dashboard/TcpErrorGauge'
import Toolbar from '@/components/features/dashboard/Toolbar'
import TopDomains from '@/components/features/dashboard/TopDomains'
import TrafficTrend from '@/components/features/dashboard/TrafficTrend'

// Arrow function 문법 + 마지막에 default export
const DashboardPage = () => {
  return (
    <>
      <div className='flex flex-col gap-4 p-4 mx-30'>
        <div className='space-y-1'>
          <h3 className='text-2xl font-semibold'>네트워크 모니터링 대시보드</h3>
          <p className='text-muted-foreground'>실시간 트래픽 및 성능 분석</p>
        </div>
      </div>
      <div className='flex flex-col gap-4 p-4 mx-30'>
        <Toolbar
          onAddWidget={() => {
            // TODO: 위젯 추가 모달/드로어 열기
          }}
          onSaveLayout={() => {
            // TODO: 현재 레이아웃 저장 처리
          }}
        />
      </div>

      <main className='grid grid-cols-12 grid-flow-row-dense gap-4 p-4 mx-30 bg-[#F7F9FC] rounded-2xl'>
        <section className='col-span-12 md:col-span-8 rounded-lg bg-white shadow-sm'>
          <TrafficTrend />
        </section>
        <section className='col-span-12 md:col-span-4 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <TcpErrorGauge />
        </section>
        <section className='col-span-12 md:col-span-12 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <GeoTrafficDistribution />
        </section>
        <section className='col-span-12 md:col-span-4 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <HttpStatusDonut />
        </section>
        <section className='col-span-12 md:col-span-4 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <TopDomains />
        </section>
        <section className='col-span-12 md:col-span-4 rounded-lg border border-gray-200 bg-white shadow-sm'>
          <AvgResponseTime />
        </section>
      </main>
    </>
  )
}

export default DashboardPage
