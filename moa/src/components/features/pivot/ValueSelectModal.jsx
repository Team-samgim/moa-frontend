import { useState, useMemo } from 'react'
import PivotFieldModalShell from './PivotFieldModalShell'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import CloseIcon from '@/assets/icons/delete.svg?react'
import { usePivotFields } from '@/hooks/queries/usePivot'

const AGG_OPTIONS = [
  { value: 'sum', label: '합계' },
  { value: 'count', label: '개수' },
  { value: 'avg', label: '평균' },
  { value: 'max', label: '최대' },
]

const ValueSelectModal = ({ initialSelected = [], onApplyValues, onClose }) => {
  const { data, isLoading } = usePivotFields()
  const fieldNames = (data?.fields || []).map((f) => f.name)

  const [valuesState, setValuesState] = useState(initialSelected)
  const [openAggForField, setOpenAggForField] = useState(null)
  const [sortOrder, setSortOrder] = useState(null)
  const [searchValue, setSearchValue] = useState('')

  const filteredList = useMemo(() => {
    let base = fieldNames

    if (searchValue) {
      base = base.filter((n) => n.toLowerCase().includes(searchValue.toLowerCase()))
    }

    if (sortOrder === 'asc') {
      base = [...base].sort((a, b) => a.localeCompare(b))
    } else if (sortOrder === 'desc') {
      base = [...base].sort((a, b) => b.localeCompare(a))
    }

    return base
  }, [fieldNames, sortOrder, searchValue])

  const isSelected = (fieldName) => valuesState.some((v) => v.field === fieldName)

  const getAggFor = (fieldName) => {
    const found = valuesState.find((v) => v.field === fieldName)
    return found ? found.agg : null
  }

  const setAggFor = (fieldName, agg) => {
    setValuesState((prev) => prev.map((v) => (v.field === fieldName ? { ...v, agg } : v)))
  }

  const toggleField = (fieldName) => {
    setValuesState((prev) => {
      if (prev.some((v) => v.field === fieldName)) {
        return prev.filter((v) => v.field !== fieldName)
      }
      return [...prev, { field: fieldName, agg: 'sum' }]
    })
  }

  const removeToken = (fieldName) => {
    setValuesState((prev) => prev.filter((v) => v.field !== fieldName))
  }

  const handleApply = () => {
    const finalValues = valuesState.map((v) => {
      const aggMeta = AGG_OPTIONS.find((o) => o.value === v.agg)
      const aggLabel = aggMeta ? aggMeta.label : v.agg
      return {
        field: v.field,
        agg: v.agg,
        alias: `${aggLabel}: ${v.field}`,
      }
    })

    onApplyValues(finalValues)
  }

  return (
    <PivotFieldModalShell
      title='값 선택'
      headerRight={null}
      tokensArea={
        <div className='mb-3 flex flex-wrap gap-2'>
          {valuesState.map((v) => {
            const aggMeta = AGG_OPTIONS.find((o) => o.value === v.agg)
            const aggLabel = aggMeta ? aggMeta.label : v.agg
            return (
              <span
                key={v.field}
                className='flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800'
              >
                <span className='text-gray-500'>⋮⋮⋮</span>
                <span>
                  {aggLabel}: {v.field}
                </span>
                <button
                  onClick={() => removeToken(v.field)}
                  className='text-gray-400 hover:text-red-500'
                >
                  <CloseIcon className='h-3 w-3' />
                </button>
              </span>
            )
          })}
        </div>
      }
      onApply={handleApply}
      onClose={onClose}
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      {/* 리스트 헤더 */}
      <div className='flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700'>
        <span>전체 {fieldNames.length}개</span>
      </div>

      {/* 리스트 */}
      <div className='border border-t-0 border-gray-200'>
        {isLoading ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>로딩중...</div>
        ) : filteredList.length === 0 ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>필드가 없습니다</div>
        ) : (
          filteredList.map((fieldName) => {
            const selected = isSelected(fieldName)
            const agg = getAggFor(fieldName)

            return (
              <div
                key={fieldName}
                className='flex flex-col border-t border-gray-200 px-3 py-2 text-sm text-gray-800'
              >
                <div className='flex items-center justify-between'>
                  <label className='flex cursor-pointer items-center gap-2'>
                    <input
                      type='checkbox'
                      className='h-4 w-4 text-blue-600'
                      checked={selected}
                      onChange={() => toggleField(fieldName)}
                    />
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-400 text-xs'>⋮⋮⋮</span>
                      <span>{fieldName}</span>
                    </div>
                  </label>

                  {/* agg 드롭다운 */}
                  {selected && (
                    <div className='relative'>
                      <button
                        className='flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'
                        onClick={() =>
                          setOpenAggForField(openAggForField === fieldName ? null : fieldName)
                        }
                      >
                        <span>{AGG_OPTIONS.find((o) => o.value === agg)?.label ?? agg}</span>
                        <ArrowDownIcon className='h-3 w-3 text-gray-500' />
                      </button>

                      {openAggForField === fieldName && (
                        <div className='absolute right-0 z-10 mt-1 w-28 rounded border border-gray-200 bg-white text-xs shadow'>
                          {AGG_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              className='block w-full px-3 py-2 text-left hover:bg-gray-50'
                              onClick={() => {
                                setAggFor(fieldName, opt.value)
                                setOpenAggForField(null)
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selected && (
                  <div className='pl-6 text-[11px] text-gray-500'>
                    {AGG_OPTIONS.find((o) => o.value === agg)?.label} • {fieldName}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </PivotFieldModalShell>
  )
}

export default ValueSelectModal
