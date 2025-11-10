import { useState } from 'react'
import Toolbar from '@/components/features/dashboard/Toolbar'
import WidgetLibraryDialog, {
  DEFAULT_WIDGETS,
} from '@/components/features/dashboard/WidgetLibraryDialog'
import AvgResponseTime from '@/components/features/dashboard/widget/AvgResponseTime'
import GeoTrafficDistribution from '@/components/features/dashboard/widget/GeoTrafficDistribution'
import HttpStatusDonut from '@/components/features/dashboard/widget/HttpStatusDonut'
import TcpErrorGauge from '@/components/features/dashboard/widget/TcpErrorGauge'
import TopDomains from '@/components/features/dashboard/widget/TopDomains'
import TrafficTrend from '@/components/features/dashboard/widget/TrafficTrend'

const DashboardPage = () => {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const DEFAULT_IDS = DEFAULT_WIDGETS.map((w) => w.id)
  const [widgets, setWidgets] = useState(DEFAULT_IDS)

  const WIDGET_RENDERERS = {
    trafficTrend: { comp: TrafficTrend, className: 'col-span-12 md:col-span-8' },
    tcpErrorRate: { comp: TcpErrorGauge, className: 'col-span-12 md:col-span-4' },
    geoHeatmap: { comp: GeoTrafficDistribution, className: 'col-span-12 md:col-span-12' },
    httpStatus: { comp: HttpStatusDonut, className: 'col-span-12 md:col-span-4' },
    topDomains: { comp: TopDomains, className: 'col-span-12 md:col-span-4' },
    responseTime: { comp: AvgResponseTime, className: 'col-span-12 md:col-span-4' },
  }

  // 위젯 제거 핸들러 추가
  const handleRemoveWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((id) => id !== widgetId))
  }

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
          onAddWidget={() => setLibraryOpen(true)}
          onSaveLayout={() => {
            // TODO: 현재 레이아웃 저장 처리
          }}
        />
      </div>

      <main className='grid grid-cols-12 grid-flow-row-dense gap-4 p-4 mx-30 bg-[#F7F9FC] rounded-2xl'>
        {widgets.map((id) => {
          const meta = WIDGET_RENDERERS[id]
          if (!meta) return null
          const Comp = meta.comp
          return (
            <section
              key={id}
              className={`${meta.className} rounded-lg border border-gray-200 bg-white shadow-sm`}
            >
              {/* onClose prop 전달 */}
              <Comp onClose={() => handleRemoveWidget(id)} />
            </section>
          )
        })}
      </main>
      <WidgetLibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onConfirm={(ids) => {
          setWidgets(ids)
          setLibraryOpen(false)
        }}
        initialSelectedIds={widgets}
      />
    </>
  )
}

export default DashboardPage
