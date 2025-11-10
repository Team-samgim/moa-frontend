import { useEffect, useMemo, useRef, useState } from 'react'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import { useInfiniteDistinctValues } from '@/hooks/queries/usePivot'

const FieldFilterModal = ({
  layer,
  time,
  filters,
  fieldName,
  selectedValues,
  order = 'asc',
  valueAliases = ['Values 값들'],
  initialTopN,
  onApply,
  onClose,
}) => {
  const effectiveFilters = useMemo(
    () => (filters ?? []).filter((f) => f.field !== fieldName),
    [filters, fieldName],
  )

  // ===== 인피니트 쿼리 사용 =====
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteDistinctValues({
      layer,
      field: fieldName,
      time,
      filters: effectiveFilters,
      order,
      enabled: !!fieldName,
      limit: 50,
    })

  // 서버에서 받은 raw values(flatten)
  const rawValues = useMemo(() => (data?.pages || []).flatMap((page) => page.items || []), [data])

  // 선택 상태는 label 기준 Set으로 관리
  const [selectedSet, setSelectedSet] = useState(() => {
    if (Array.isArray(selectedValues) && selectedValues.length > 0) {
      return new Set(selectedValues)
    }
    return new Set()
  })

  // selectedValues prop이 바뀌면 (기존 필터 불러오기 등) 초기화
  useEffect(() => {
    if (Array.isArray(selectedValues) && selectedValues.length > 0) {
      setSelectedSet(new Set(selectedValues))
    }
  }, [selectedValues])

  // 새 페이지가 로드될 때, 초기 상태(필터 없음)라면 새로 들어온 값들은 자동 선택
  useEffect(() => {
    if (!data) return

    const noInitialFilter = !Array.isArray(selectedValues) || selectedValues.length === 0

    if (!noInitialFilter) return

    setSelectedSet((prev) => {
      const next = new Set(prev)
      rawValues.forEach((v) => {
        if (!next.has(v)) {
          next.add(v) // 필터 없으면 디폴트는 모두 선택
        }
      })
      return next
    })
  }, [data, rawValues, selectedValues])

  // items: UI에서 쓸 label + checked
  const items = useMemo(
    () =>
      rawValues.map((v) => ({
        label: v,
        checked: selectedSet.has(v),
      })),
    [rawValues, selectedSet],
  )

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(order)

  const [topNOpen, setTopNOpen] = useState(false)
  const [topNEnabled, setTopNEnabled] = useState(false)
  const [topNValue, setTopNValue] = useState(5)
  const [topNMode, setTopNMode] = useState('top') // 'top' | 'bottom'
  const [topNMetric, setTopNMetric] = useState(valueAliases[0] ?? 'Values 값들')
  const [metricDdOpen, setMetricDdOpen] = useState(false)

  const allCount = items.length
  const selectedCount = items.filter((i) => i.checked).length
  const allChecked = allCount > 0 && selectedCount === allCount
  const someChecked = selectedCount > 0 && selectedCount < allCount
  const totalCount = data?.pages?.[0]?.totalCount ?? allCount

  const toggleAll = () => {
    const next = !allChecked
    setSelectedSet(() => {
      if (!next) {
        return new Set()
      }
      return new Set(items.map((i) => i.label))
    })
  }

  const toggleOne = (label) => {
    setSelectedSet((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const filtered = useMemo(() => {
    let list = items

    if (query) {
      const q = query.toLowerCase()
      list = list.filter((i) => i.label?.toLowerCase().includes(q))
    }

    list = [...list].sort((a, b) =>
      sort === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label),
    )

    return list
  }, [items, query, sort])

  const handleApply = () => {
    const selected = Array.from(selectedSet)

    onApply?.({
      field: fieldName,
      selected,
      order: sort,
      topN: topNEnabled
        ? {
            enabled: true,
            n: Number(topNValue) || 5,
            mode: topNMode,
            valueKey: topNMetric,
          }
        : null,
    })
  }

  useEffect(() => {
    if (!initialTopN || !initialTopN.enabled) {
      setTopNOpen(false)
      setTopNEnabled(false)
      setTopNValue(5)
      setTopNMode('top')
      setTopNMetric(valueAliases[0] ?? 'Values 값들')
      return
    }

    setTopNEnabled(true)
    setTopNOpen(true)

    if (typeof initialTopN.n === 'number' && initialTopN.n > 0) {
      setTopNValue(initialTopN.n)
    }

    if (initialTopN.mode === 'top' || initialTopN.mode === 'bottom') {
      setTopNMode(initialTopN.mode)
    }

    if (initialTopN.valueKey) {
      setTopNMetric(initialTopN.valueKey)
    } else if (valueAliases[0]) {
      setTopNMetric(valueAliases[0])
    }
  }, [initialTopN, valueAliases])

  const btn = 'rounded border px-3 py-2 text-sm'
  const btnMuted = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  const btnPrimary = 'bg-blue-light text-white hover:bg-blue-dark'

  // ===== 인피니트 스크롤 핸들러 =====
  const listRef = useRef(null)

  const handleScroll = (e) => {
    const target = e.currentTarget
    if (!target) return
    if (!hasNextPage || isFetchingNextPage) return

    const threshold = 40 // px
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
      fetchNextPage()
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='w-[680px] max-w-[95vw] rounded-xl bg-white shadow-lg'>
        {/* 헤더 */}
        <div className='flex items-center justify-between p-4'>
          <div className='text-xl font-semibold'>
            필드: <span>{fieldName}</span>
          </div>
          <div className='flex gap-2'>
            <button className={`${btn} ${btnPrimary}`} onClick={handleApply}>
              적용
            </button>
            <button className={`${btn} ${btnMuted}`} onClick={onClose}>
              취소
            </button>
          </div>
        </div>

        {/* 검색 + TOP N */}
        <div className='flex items-center gap-3 px-4'>
          <div className='flex-1'>
            <div className='flex items-center rounded-lg border border-gray-300 px-3'>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='필드 검색'
                className='h-10 w-full outline-none placeholder:text-gray-400'
              />
            </div>
          </div>
          <button
            className={`${btn} ${topNEnabled ? btnPrimary : btnMuted} px-8`}
            onClick={() => {
              setTopNOpen((prev) => {
                const next = !prev
                setTopNEnabled(next)
                return next
              })
            }}
          >
            TOP N
          </button>
        </div>

        {topNOpen && (
          <div className='mx-4 mt-3 rounded-lg border border-[#BBD2F1] bg-[#EAF1FF] p-3'>
            <div className='flex gap-3 items-center'>
              {/* N 값 입력 */}
              <div className='w-20'>
                <input
                  type='number'
                  min={1}
                  value={topNValue}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setTopNValue(Number.isNaN(v) || v <= 0 ? 1 : v)
                  }}
                  className='w-full rounded-md border border-[#BBD2F1] bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-light'
                />
              </div>

              {/* Top / Bottom 토글 */}
              <div className='inline-flex rounded-lg border border-[#BBD2F1] bg-white/80 overflow-hidden'>
                <button
                  type='button'
                  onClick={() => setTopNMode('top')}
                  className={`px-4 py-2 text-sm font-medium ${
                    topNMode === 'top'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Top
                </button>
                <button
                  type='button'
                  onClick={() => setTopNMode('bottom')}
                  className={`px-4 py-2 text-sm font-medium ${
                    topNMode === 'bottom'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Bottom
                </button>
              </div>

              {/* metric 드롭다운 */}
              <div className='relative flex-1'>
                <button
                  type='button'
                  onClick={() => setMetricDdOpen((o) => !o)}
                  className='flex w-full items-center justify-between rounded-md border border-[#BBD2F1] bg-white px-3 py-2 text-sm text-gray-800 hover:bg-gray-50'
                >
                  <span className='truncate'>
                    {topNMetric || (valueAliases[0] ?? 'Values 값들')}
                  </span>
                  <span className='ml-2 text-xs text-gray-500'>▾</span>
                </button>

                {metricDdOpen && (
                  <div className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-[#BBD2F1] bg-white shadow-lg'>
                    {valueAliases.map((alias) => (
                      <button
                        key={alias}
                        type='button'
                        onClick={() => {
                          setTopNMetric(alias)
                          setMetricDdOpen(false)
                        }}
                        className={`flex w-full items-center px-3 py-2 text-sm text-left hover:bg-[#EAF1FF] ${
                          topNMetric === alias ? 'font-medium text-blue-dark' : 'text-gray-800'
                        }`}
                      >
                        {alias}
                      </button>
                    ))}
                    {!valueAliases.length && (
                      <div className='px-3 py-2 text-sm text-gray-400'>
                        선택 가능한 Values 가 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 본문 */}
        <div className='p-4'>
          <div className='rounded-lg border border-gray-200 overflow-hidden'>
            {/* 상단 바 */}
            <div className='flex items-center justify-between border-b px-3 py-2 border-gray-200 bg-gray-50 text-gray-700'>
              <label className='flex cursor-pointer items-center gap-2' onClick={toggleAll}>
                <div
                  className={[
                    'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                    allChecked
                      ? 'border-blue-light bg-blue-light'
                      : someChecked
                        ? 'border-blue-light bg-white'
                        : 'border-gray-300 bg-white',
                  ].join(' ')}
                >
                  {allChecked && <CheckIcon className='h-3 w-3 text-white' />}
                  {!allChecked && someChecked && (
                    <span className='h-[2px] w-2 rounded bg-blue-light' />
                  )}
                </div>

                <span className='flex gap-2 text-[15px]'>
                  전체 선택{' '}
                  <span className='text-gray-500'>
                    {selectedCount}/{totalCount}
                  </span>
                </span>
              </label>

              <div className='inline-flex rounded-lg border border-gray-300 bg-white p-1'>
                <button
                  className={`px-3 py-1 text-sm rounded-md ${
                    sort === 'asc' ? 'bg-blue-light text-white' : 'text-gray-700'
                  }`}
                  onClick={() => setSort('asc')}
                >
                  오름차순
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded-md ${
                    sort === 'desc' ? 'bg-blue-light text-white' : 'text-gray-700'
                  }`}
                  onClick={() => setSort('desc')}
                >
                  내림차순
                </button>
              </div>
            </div>

            {/* 리스트 + 인피니트 스크롤 */}
            <div ref={listRef} className='h-[420px] overflow-auto' onScroll={handleScroll}>
              {isLoading && (
                <div className='py-10 text-center text-[15px] text-gray-400'>로딩 중…</div>
              )}

              {!isLoading &&
                filtered.map((i) => (
                  <label
                    key={i.label}
                    className='flex cursor-pointer items-center gap-3 border-t border-gray-200 px-3 py-3 text-[15px] first:border-t-0 hover:bg-gray-50'
                    onClick={() => toggleOne(i.label)}
                  >
                    <div
                      className={[
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        i.checked ? 'border-blue-light bg-blue-light' : 'border-gray-300 bg-white',
                      ].join(' ')}
                    >
                      {i.checked && <CheckIcon className='h-3 w-3 text-white' />}
                    </div>
                    <span>{i.label}</span>
                  </label>
                ))}

              {!isLoading && !filtered.length && (
                <div className='py-10 text-center text-[15px] text-gray-400'>값이 없습니다</div>
              )}

              {isFetchingNextPage && (
                <div className='py-3 text-center text-xs text-gray-400'>더 불러오는 중…</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FieldFilterModal
