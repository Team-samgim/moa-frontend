/**
 * 작성자: 정소영
 */
import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'

// 간단한 className join 유틸
const cx = (...parts) => parts.filter(Boolean).join(' ')

// PageLoadTimeTrend 포함 기본 위젯 목록
const DEFAULT_WIDGETS = [
  {
    id: 'pageLoadTimeTrend',
    name: '페이지 로드 시간 트렌드',
    description: '시간대별 페이지 로딩 성능 추이 (평균, P95, P99)',
    icon: '⏱️',
    category: 'performance',
  },
  {
    id: 'trafficTrend',
    name: '실시간 트래픽 추이',
    description: 'Mbps 기준 Request/Response 트래픽',
    icon: '📊',
    category: 'traffic',
  },
  {
    id: 'tcpErrorRate',
    name: 'TCP 에러율',
    description: '네트워크 품질 게이지',
    icon: '🔁',
    category: 'network',
  },
  {
    id: 'httpStatus',
    name: 'HTTP 상태 코드',
    description: '2xx, 3xx, 4xx, 5xx 분포',
    icon: '📈',
    category: 'http',
  },
  {
    id: 'topDomains',
    name: '느린 페이지 Top 10',
    description: '평균 응답 시간 기준',
    icon: '🔝',
    category: 'performance',
  },
  {
    id: 'responseTime',
    name: '평균 응답 시간',
    description: '서버 응답 시간 통계',
    icon: '⏱️',
    category: 'performance',
  },
  {
    id: 'geoHeatmap',
    name: '지역별 트래픽',
    description: '국가별 트래픽 분포',
    icon: '🌍',
    category: 'traffic',
  },
]

const CATEGORIES = {
  performance: { label: '성능', color: 'bg-blue-100 text-blue-800' },
  traffic: { label: '트래픽', color: 'bg-green-100 text-green-800' },
  network: { label: '네트워크', color: 'bg-purple-100 text-purple-800' },
  http: { label: 'HTTP', color: 'bg-orange-100 text-orange-800' },
}

/**
 * WidgetLibraryDialog
 * - props는 기존 구조 유지: open, onClose, onConfirm, initialSelectedIds
 * - 외부 UI 라이브러리(Button/Checkbox/Dialog) 의존성 제거
 * - 순수 div / button / input으로만 구현
 */
const WidgetLibraryDialog = ({ open, onClose, onConfirm, initialSelectedIds = [] }) => {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds)
  const [query, setQuery] = useState('')

  const filteredWidgets = useMemo(() => {
    if (!query.trim()) return DEFAULT_WIDGETS
    const q = query.trim().toLowerCase()
    return DEFAULT_WIDGETS.filter((w) => {
      const hay = `${w.name} ${w.description ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  const handleToggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleConfirm = () => {
    onConfirm(selectedIds)
    onClose?.()
  }

  const handleSelectAll = () => {
    setSelectedIds(filteredWidgets.map((w) => w.id))
  }

  const handleDeselectAll = () => {
    setSelectedIds([])
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
        className='absolute left-1/2 top-1/2 max-h-[80vh] w-[min(100vw-32px,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className='mb-4'>
          <h2 id='widget-lib-title' className='text-xl font-semibold'>
            위젯 추가하기
          </h2>
          <p className='mt-1 text-sm text-gray-500'>
            대시보드에 표시할 위젯을 선택하세요. 선택한 위젯은 레이아웃 설정에 따라 배치됩니다.
          </p>
        </div>

        <div className='space-y-4'>
          {/* 검색 + 전체 선택/해제 */}
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <div className='flex-1'>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='위젯 이름 또는 설명 검색'
                className='h-9 w-full rounded-md border border-gray-300 px-3 text-sm outline-none placeholder:text-gray-400 focus:border-gray-400'
                aria-label='위젯 검색'
              />
            </div>
            <div className='flex items-center gap-2 sm:justify-end'>
              <button
                type='button'
                className='h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50'
                onClick={handleSelectAll}
              >
                전체 선택
              </button>
              <button
                type='button'
                className='h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50 disabled:opacity-40'
                onClick={handleDeselectAll}
                disabled={selectedIds.length === 0}
              >
                전체 해제
              </button>
            </div>
          </div>
          <div className='text-right text-sm text-gray-500'>{selectedIds.length}개 선택됨</div>

          {/* 카테고리별 위젯 목록 */}
          {Object.entries(CATEGORIES).map(([category, { label, color }]) => {
            const widgets = filteredWidgets.filter((w) => w.category === category)
            if (widgets.length === 0) return null

            return (
              <div key={category} className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <span className={cx('rounded px-2 py-1 text-xs font-semibold', color)}>
                    {label}
                  </span>
                  <div className='h-px flex-1 bg-gray-200' />
                </div>

                <div className='space-y-2'>
                  {widgets.map((widget) => {
                    const isSelected = selectedIds.includes(widget.id)
                    return (
                      <div
                        key={widget.id}
                        className={cx(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors',
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                        )}
                        onClick={() => handleToggle(widget.id)}
                      >
                        {/* 체크박스 */}
                        <input
                          type='checkbox'
                          className='mt-1'
                          checked={isSelected}
                          readOnly={true}
                        />
                        {/* 아이콘 + 텍스트 */}
                        <div className='flex flex-1 gap-3'>
                          {widget.icon && (
                            <div className='mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-lg'>
                              {widget.icon}
                            </div>
                          )}
                          <div>
                            <div className='text-sm font-medium'>{widget.name}</div>
                            <div className='mt-1 text-xs text-gray-500'>{widget.description}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* 액션 버튼 */}
        <div className='mt-6 flex justify-end gap-2'>
          <button
            type='button'
            className='h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-100'
            onClick={onClose}
          >
            취소
          </button>
          <button
            type='button'
            className='h-9 rounded-md bg-blue-600 px-4 text-sm text-white hover:bg-blue-700 disabled:opacity-40'
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}

WidgetLibraryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  initialSelectedIds: PropTypes.arrayOf(PropTypes.string),
}

export default WidgetLibraryDialog
