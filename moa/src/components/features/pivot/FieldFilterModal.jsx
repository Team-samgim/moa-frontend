import { useEffect, useMemo, useState } from 'react'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import { useDistinctValues } from '@/hooks/queries/usePivot'

const FieldFilterModal = ({
  layer,
  time,
  filters,
  fieldName,
  selectedValues,
  order = 'asc',
  valueAliases = ['Values 값들'],
  onApply,
  onClose,
}) => {
  const effectiveFilters = useMemo(
    () => (filters ?? []).filter((f) => f.field !== fieldName),
    [filters, fieldName],
  )

  const { data, isLoading } = useDistinctValues({
    layer,
    field: fieldName,
    time,
    filters: effectiveFilters,
    order,
    enabled: !!fieldName,
  })

  const [items, setItems] = useState([])

  useEffect(() => {
    const values = data?.items ?? []

    const baseSelected =
      Array.isArray(selectedValues) && selectedValues.length > 0
        ? new Set(selectedValues)
        : new Set(values)

    const opts = values.map((v) => ({
      label: v,
      checked: baseSelected.has(v),
    }))

    setItems(opts)
  }, [data, selectedValues])

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(order)

  const [topNOpen, setTopNOpen] = useState(false)
  const [topNEnabled, setTopNEnabled] = useState(false)
  const [topNValue, _setTopNValue] = useState(5)
  const [topNMode, _setTopNMode] = useState('top')
  const [topNMetric, _setTopNMetric] = useState(valueAliases[0] ?? 'Values 값들')
  const [_metricDdOpen, _setMetricDdOpen] = useState(false)

  const allCount = items.length
  const selectedCount = items.filter((i) => i.checked).length
  const allChecked = allCount > 0 && selectedCount === allCount
  const someChecked = selectedCount > 0 && selectedCount < allCount

  const toggleAll = () => {
    const next = !allChecked
    setItems((prev) => prev.map((i) => ({ ...i, checked: next })))
  }

  const toggleOne = (label) => {
    setItems((prev) => prev.map((i) => (i.label === label ? { ...i, checked: !i.checked } : i)))
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
    const selected = items.filter((i) => i.checked).map((i) => i.label)

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

  const btn = 'rounded border px-3 py-2 text-sm'
  const btnMuted = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
  const btnPrimary = 'bg-blue-light text-white hover:bg-blue-dark'

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='w-[720px] max-w-[95vw] rounded-xl bg-white shadow-lg'>
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
              setTopNOpen((o) => !o)
              if (!topNEnabled) setTopNEnabled(true)
            }}
          >
            TOP N
          </button>
        </div>

        {topNOpen && (
          <div className='mx-4 mt-3 rounded-lg border border-[#BBD2F1] bg-[#EAF1FF] p-3'></div>
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
                    {selectedCount}/{allCount}
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

            {/* 리스트 */}
            <div className='max-h-[420px] overflow-auto'>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FieldFilterModal
