/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState, useCallback } from 'react'

// 간단한 className join 유틸
const cx = (...parts) => parts.filter(Boolean).join(' ')

// 외부 UI 라이브러리/아이콘 없이, 이모지 아이콘만 사용
const DEFAULT_WIDGETS = [
  {
    id: 'trafficTrend',
    title: '실시간 트래픽',
    subtitle: '시계열 그래프',
    icon: '📊',
    tags: ['time', 'trend', 'traffic', 'timeseries'],
  },
  {
    id: 'geoHeatmap',
    title: '지리적 분포',
    subtitle: '국가별 히트맵',
    icon: '🌍',
    tags: ['map', 'geo', 'country', 'heatmap'],
  },
  {
    id: 'tcpErrorRate',
    title: 'TCP 에러율',
    subtitle: '게이지 차트',
    icon: '🔁',
    tags: ['tcp', 'error', 'rate', 'gauge'],
  },
  {
    id: 'httpStatus',
    title: 'HTTP 상태코드',
    subtitle: '도넛 차트',
    icon: '📈',
    tags: ['http', 'status', 'code', 'donut'],
  },
  {
    id: 'topDomains',
    title: 'Top 도메인',
    subtitle: '순위 리스트',
    icon: '🔝',
    tags: ['top', 'domain', 'rank', 'list'],
  },
  {
    id: 'responseTime',
    title: '응답시간',
    subtitle: '성능 지표',
    icon: '⏱️',
    tags: ['latency', 'p95', 'performance', 'ms'],
  },
]

/**
 * WidgetLibraryDialog (의존성 없는 순수 React + Tailwind 버전)
 * - 요구사항: 현재 사용 중인 위젯들을 삭제하고, 선택한 위젯으로 교체
 * - onConfirm(selectedIds)로 선택 결과 전달
 * - open=false면 렌더하지 않음
 */
const WidgetLibraryDialog = ({
  open,
  onClose,
  onConfirm,
  availableWidgets = DEFAULT_WIDGETS,
  initialSelectedIds = [],
}) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set(initialSelectedIds))

  // 다이얼로그 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setSelected(new Set(initialSelectedIds))
      setQuery('')
    }
  }, [open, initialSelectedIds])

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    if (!query.trim()) return availableWidgets
    const q = query.trim().toLowerCase()
    return availableWidgets.filter((w) => {
      const hay = `${w.title} ${w.subtitle ?? ''} ${(w.tags ?? []).join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [availableWidgets, query])

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const ns = new Set(prev)
      if (ns.has(id)) ns.delete(id)
      else ns.add(id)
      return ns
    })
  }, [])

  const clearAll = () => setSelected(new Set())
  const selectAll = () => setSelected(new Set(filtered.map((w) => w.id)))

  const handleConfirm = () => {
    // 교체 모드 고정: 현재 위젯들 전부 제거 후, 선택한 위젯으로 구성
    onConfirm(Array.from(selected))
    onClose?.()
  }

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50'
      role='dialog'
      aria-modal='true'
      aria-labelledby='widget-lib-title'
    >
      {/* 배경 오버레이 */}
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />

      {/* 다이얼로그 카드 */}
      <div
        className='absolute left-1/2 top-1/2 w-[min(100vw-32px,980px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className='px-6 pt-6 pb-3'>
          <h2 id='widget-lib-title' className='text-2xl font-semibold'>
            위젯 라이브러리
          </h2>
          <p className='mt-1 text-sm text-gray-500'>
            선택한 항목으로 대시보드 위젯을 <span className='font-medium text-gray-900'>교체</span>
            합니다.
          </p>
        </div>

        {/* 상단 툴바 */}
        <div className='flex flex-col gap-3 px-6 pb-4'>
          <div className='flex items-center gap-3'>
            <div className='relative w-full max-w-md'>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='위젯 이름/설명 검색'
                className='h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400'
                aria-label='위젯 검색'
              />
              <div className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400'>
                검색
              </div>
            </div>
            <div className='ml-auto flex items-center gap-2'>
              <button
                className='h-10 rounded-lg border border-gray-300 px-3 text-sm hover:bg-gray-50 disabled:opacity-40'
                onClick={clearAll}
                disabled={!selected.size}
              >
                선택 해제
              </button>
              <button
                className='h-10 rounded-lg border border-gray-300 px-3 text-sm hover:bg-gray-50'
                onClick={selectAll}
              >
                전체 선택
              </button>
            </div>
          </div>
        </div>

        {/* 그리드 */}
        <div className='max-h-[60vh] overflow-auto p-6'>
          {filtered.length === 0 ? (
            <div className='grid place-items-center py-20 text-sm text-gray-500'>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {filtered.map((w) => (
                <button
                  key={w.id}
                  type='button'
                  onClick={() => toggle(w.id)}
                  className={cx(
                    'relative w-full rounded-2xl text-left transition border',
                    selected.has(w.id)
                      ? 'bg-[#EAF1F9] border-transparent'
                      : 'bg-white border-gray-300',
                  )}
                  aria-pressed={selected.has(w.id)}
                >
                  <div className='absolute right-3 top-3'>
                    <div
                      className={cx(
                        'grid h-6 w-6 place-items-center rounded-full text-xs',
                        selected.has(w.id)
                          ? 'bg-[#3F72AF] text-white'
                          : 'bg-gray-200 text-gray-500',
                      )}
                    >
                      ✓
                    </div>
                  </div>

                  <div className='p-5'>
                    <div className='flex items-center gap-4'>
                      <div className='grid h-12 w-12 place-items-center rounded-xl text-xl'>
                        {w.icon}
                      </div>
                      <div className='min-w-0'>
                        <div className='truncate text-base font-semibold leading-none'>
                          {w.title}
                        </div>
                        {w.subtitle && (
                          <div className='mt-1 line-clamp-1 text-sm text-gray-500'>
                            {w.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        <div className='flex items-center justify-between gap-3 p-4'>
          <div className='text-sm text-gray-600'>
            선택된 위젯 <span className='font-medium text-gray-900'>{selected.size}</span>
          </div>
          <div className='flex items-center gap-2'>
            <button
              className='h-10 rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-50'
              onClick={onClose}
            >
              취소
            </button>
            <button
              className='h-10 rounded-lg bg-[#3F72AF] px-4 text-sm text-white disabled:opacity-40'
              onClick={handleConfirm}
              disabled={!selected.size}
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WidgetLibraryDialog
export { DEFAULT_WIDGETS }
// 사용 예시 (대시보드에서)
// <WidgetLibraryDialog
//   open={libraryOpen}
//   onClose={() => setLibraryOpen(false)}
//   onConfirm={(ids) => setWidgets(ids)}
//   initialSelectedIds={widgets}
// />
