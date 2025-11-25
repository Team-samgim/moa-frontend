import { useState, useEffect } from 'react'
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
import DashboardFilters from '@/components/features/dashboard/DashboardFilters'
import SortableWidget from '@/components/features/dashboard/SortableWidget'
import Toolbar from '@/components/features/dashboard/Toolbar'
import WidgetLibraryDialog from '@/components/features/dashboard/WidgetLibraryDialog'
import BrowserPerformance from '@/components/features/dashboard/widget/BrowserPerformance'
import DevicePerformanceDistribution from '@/components/features/dashboard/widget/DevicePerformanceDistribution'
import ErrorPagesTop10 from '@/components/features/dashboard/widget/ErrorPagesTop10'
import ErrorRateTrend from '@/components/features/dashboard/widget/ErrorRateTrend'
import httpStatusCodeDistribution from '@/components/features/dashboard/widget/HttpStatusCodeDistribution'
import PageLoadTimeTrend from '@/components/features/dashboard/widget/PageLoadTimeTrend'
import ResponseTimeStats from '@/components/features/dashboard/widget/ResponseTimeStats'
import TopDomains from '@/components/features/dashboard/widget/TopDomains'
import TrafficByCountry from '@/components/features/dashboard/widget/TrafficByCountry'
import TrafficTrend from '@/components/features/dashboard/widget/TrafficTrend'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'
import { useDashboardSSE } from '@/hooks/useDashboardSSE'
import { useDashboardStore } from '@/stores/dashboardStore'

// ✅ Mock 데이터 (API 없을 때 필터 표시용)
const MOCK_AVAILABLE_FILTERS = {
  countries: ['Korea', 'USA', 'Japan', 'China', 'Germany'],
  browsers: ['Chrome', 'Safari', 'Firefox', 'Edge'],
  devices: ['Desktop', 'Mobile', 'Tablet'],
  httpHosts: ['example.com', 'api.example.com', 'cdn.example.com'],
  httpMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}

const DashboardPage = () => {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [forceShowDashboard, setForceShowDashboard] = useState(false) // ⭐ 추가

  // 기본으로 보여줄 위젯
  const [widgets, setWidgets] = useState([
    'pageLoadTimeTrend',
    'errorRateTrend',
    'httpStatus',
    'trafficTrend',
    'slowPages',
    'errorPages',
    'geoHeatmap',
    'browserPerf',
    'devicePerf',
    'responseTimeSummary',
  ])

  const WIDGET_RENDERERS = {
    pageLoadTimeTrend: { comp: PageLoadTimeTrend, className: 'col-span-12 md:col-span-8' },
    errorRateTrend: { comp: ErrorRateTrend, className: 'col-span-12 md:col-span-4' },
    httpStatus: { comp: httpStatusCodeDistribution, className: 'col-span-12 md:col-span-4' },
    trafficTrend: { comp: TrafficTrend, className: 'col-span-12 md:col-span-12' },
    slowPages: { comp: TopDomains, className: 'col-span-12 md:col-span-8' },
    errorPages: { comp: ErrorPagesTop10, className: 'col-span-12 md:col-span-8' },
    geoHeatmap: { comp: TrafficByCountry, className: 'col-span-12 md:col-span-8' },
    browserPerf: { comp: BrowserPerformance, className: 'col-span-12 md:col-span-4' },
    devicePerf: { comp: DevicePerformanceDistribution, className: 'col-span-12 md:col-span-4' },
    responseTimeSummary: { comp: ResponseTimeStats, className: 'col-span-12 md:col-span-4' },
  }

  // ============================================
  // React Query로 대시보드 데이터 조회
  // ============================================
  const { data: dashboardData, isLoading, isError, error } = useDashboardAggregated()

  // ⭐ 초기 로딩 완료 체크
  useEffect(() => {
    if (!isLoading && !initialLoadDone) {
      console.log('✅ [DashboardPage] 초기 로딩 완료')
      setInitialLoadDone(true)
    }
  }, [isLoading, initialLoadDone])

  // ⭐ 5초 후 강제로 대시보드 표시
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialLoadDone) {
        console.warn('⚠️ [DashboardPage] 로딩 타임아웃 - 강제로 대시보드 표시')
        setForceShowDashboard(true)
        setInitialLoadDone(true)
      }
    }, 5000) // 5초

    return () => clearTimeout(timer)
  }, [initialLoadDone])

  // ⭐ 에러 발생 시 처리
  useEffect(() => {
    if (isError) {
      console.error('❌ [DashboardPage] 대시보드 데이터 로드 실패:', error)
      setInitialLoadDone(true) // 에러여도 화면 표시
    }
  }, [isError, error])

  // ✅ 디버깅: 실시간 데이터 확인
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  useEffect(() => {
    console.log('📊 [DashboardPage] 실시간 데이터 길이:', realtimeData.length)
    console.log('🔌 [DashboardPage] SSE 연결 상태:', isConnected)
    console.log('⏳ [DashboardPage] isLoading:', isLoading)
    console.log('✅ [DashboardPage] initialLoadDone:', initialLoadDone)
    console.log('🚀 [DashboardPage] forceShowDashboard:', forceShowDashboard)
  }, [realtimeData, isConnected, isLoading, initialLoadDone, forceShowDashboard])

  // ✅ SSE 연결 (페이지 로드 시 즉시 연결)
  useDashboardSSE({
    enabled: true,
    moaDataUrl: 'http://localhost:9090',
  })

  // ✅ availableFilters 처리 (API 실패 시 Mock 데이터 사용)
  const availableFilters = dashboardData?.availableFilters || MOCK_AVAILABLE_FILTERS

  // ============================================
  // 필터 관련 핸들러
  // ============================================
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleApplyFilters = () => {
    const { setFilters: setStoreFilters } = useDashboardStore.getState()
    setStoreFilters(filters)
    setIsFilterOpen(false)
  }

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...filters }
    delete newFilters[filterKey]
    setFilters(newFilters)

    const { setFilters: setStoreFilters } = useDashboardStore.getState()
    setStoreFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({})
    const { setFilters: setStoreFilters } = useDashboardStore.getState()
    setStoreFilters({})
  }

  // ============================================
  // 위젯 관련 핸들러
  // ============================================
  const handleRemoveWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((id) => id !== widgetId))
  }

  // ============================================
  // 드래그앤드롭 센서 설정
  // ============================================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

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

  // ============================================
  // ✅ 로딩 상태 표시 - 초기 로딩 시에만!
  // ============================================
  if (isLoading && !initialLoadDone && !forceShowDashboard) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-600'>대시보드 로딩 중...</p>
          <p className='text-xs text-gray-400 mt-2'>5초 후 자동으로 표시됩니다</p>
        </div>
      </div>
    )
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
          onFilterSettings={() => setIsFilterOpen(true)}
          onSaveLayout={() => {}}
        />

        {/* ✅ 필터 컴포넌트 */}
        {isFilterOpen && (
          <DashboardFilters
            availableFilters={availableFilters}
            currentFilters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            onClose={() => setIsFilterOpen(false)}
          />
        )}

        {/* 적용된 필터 뱃지 표시 */}
        {Object.keys(filters).length > 0 && (
          <div className='flex items-center gap-2 flex-wrap bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <span className='text-sm font-semibold text-gray-700'>적용된 필터:</span>

            {/* 국가 필터 태그 */}
            {filters.countries?.map((country) => (
              <span
                key={`country-${country}`}
                className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'
              >
                🌍 {country}
                <button
                  onClick={() => {
                    const newCountries = filters.countries.filter((c) => c !== country)
                    const newFilters = {
                      ...filters,
                      countries: newCountries.length > 0 ? newCountries : undefined,
                    }
                    setFilters(newFilters)

                    const { setFilters: setStoreFilters } = useDashboardStore.getState()
                    setStoreFilters(newFilters)
                  }}
                  className='hover:text-blue-900 ml-1'
                >
                  ×
                </button>
              </span>
            ))}

            {/* 브라우저 필터 태그 */}
            {filters.browsers?.map((browser) => (
              <span
                key={`browser-${browser}`}
                className='inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'
              >
                🌐 {browser}
                <button
                  onClick={() => {
                    const newBrowsers = filters.browsers.filter((b) => b !== browser)
                    const newFilters = {
                      ...filters,
                      browsers: newBrowsers.length > 0 ? newBrowsers : undefined,
                    }
                    setFilters(newFilters)

                    const { setFilters: setStoreFilters } = useDashboardStore.getState()
                    setStoreFilters(newFilters)
                  }}
                  className='hover:text-green-900 ml-1'
                >
                  ×
                </button>
              </span>
            ))}

            {/* 디바이스 필터 태그 */}
            {filters.devices?.map((device) => (
              <span
                key={`device-${device}`}
                className='inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium'
              >
                📱 {device}
                <button
                  onClick={() => {
                    const newDevices = filters.devices.filter((d) => d !== device)
                    const newFilters = {
                      ...filters,
                      devices: newDevices.length > 0 ? newDevices : undefined,
                    }
                    setFilters(newFilters)

                    const { setFilters: setStoreFilters } = useDashboardStore.getState()
                    setStoreFilters(newFilters)
                  }}
                  className='hover:text-purple-900 ml-1'
                >
                  ×
                </button>
              </span>
            ))}

            {/* HTTP Method 태그 */}
            {filters.httpMethods?.map((method) => (
              <span
                key={`method-${method}`}
                className='inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium'
              >
                📊 {method}
                <button
                  onClick={() => {
                    const newMethods = filters.httpMethods.filter((m) => m !== method)
                    const newFilters = {
                      ...filters,
                      httpMethods: newMethods.length > 0 ? newMethods : undefined,
                    }
                    setFilters(newFilters)

                    const { setFilters: setStoreFilters } = useDashboardStore.getState()
                    setStoreFilters(newFilters)
                  }}
                  className='hover:text-yellow-900 ml-1'
                >
                  ×
                </button>
              </span>
            ))}

            {/* HTTP Host 태그 */}
            {filters.httpHost && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium'>
                🏠 Host: {filters.httpHost}
                <button
                  onClick={() => handleRemoveFilter('httpHost')}
                  className='hover:text-pink-900 ml-1'
                >
                  ×
                </button>
              </span>
            )}

            {/* HTTP URI 태그 */}
            {filters.httpUri && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium'>
                🔗 URI: {filters.httpUri}
                <button
                  onClick={() => handleRemoveFilter('httpUri')}
                  className='hover:text-indigo-900 ml-1'
                >
                  ×
                </button>
              </span>
            )}

            {/* HTTP 응답 코드 태그 */}
            {filters.httpResCode && (
              <span className='inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium'>
                🚦 Status {filters.httpResCodeOperator || '>='} {filters.httpResCode}
                <button
                  onClick={() => {
                    const newFilters = { ...filters }
                    delete newFilters.httpResCode
                    delete newFilters.httpResCodeOperator
                    setFilters(newFilters)

                    const { setFilters: setStoreFilters } = useDashboardStore.getState()
                    setStoreFilters(newFilters)
                  }}
                  className='hover:text-red-900 ml-1'
                >
                  ×
                </button>
              </span>
            )}

            {/* 모두 제거 버튼 */}
            <button
              onClick={handleResetFilters}
              className='text-sm text-gray-500 hover:text-gray-700 underline font-medium'
            >
              모두 제거
            </button>
          </div>
        )}
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

      {/* 위젯 라이브러리 다이얼로그 */}
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
