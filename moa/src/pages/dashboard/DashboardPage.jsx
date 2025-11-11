import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import SortableWidget from '@/components/features/dashboard/SortableWidget'
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

  const handleRemoveWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((id) => id !== widgetId))
  }

  // 드래그앤드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // 드래그 끝났을 때 순서 변경
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
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
            console.log('현재 위젯 순서:', widgets)
            // TODO: localStorage나 API로 저장
          }}
        />
      </div>

      {/* DndContext로 감싸기 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets} strategy={rectSortingStrategy}>
          <main className='grid grid-cols-12 grid-flow-row-dense gap-4 p-4 mx-30 bg-[#F7F9FC] rounded-2xl'>
            {widgets.map((id) => {
              const meta = WIDGET_RENDERERS[id]
              if (!meta) return null
              const Comp = meta.comp
              return (
                <SortableWidget key={id} id={id} className={meta.className}>
                  <Comp onClose={() => handleRemoveWidget(id)} />
                </SortableWidget>
              )
            })}
          </main>
        </SortableContext>
      </DndContext>

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
