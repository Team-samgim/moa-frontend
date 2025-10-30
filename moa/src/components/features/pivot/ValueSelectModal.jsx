import { useState, useMemo } from 'react'
import PivotFieldModalShell from './PivotFieldModalShell'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import CloseIcon from '@/assets/icons/delete.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
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
    if (searchValue) base = base.filter((n) => n.toLowerCase().includes(searchValue.toLowerCase()))

    if (sortOrder === 'asc') base = [...base].sort((a, b) => a.localeCompare(b))
    else if (sortOrder === 'desc') base = [...base].sort((a, b) => b.localeCompare(a))
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
      tokensArea={
        <div className='flex flex-wrap gap-2'>
          {valuesState.map((v) => {
            const aggMeta = AGG_OPTIONS.find((o) => o.value === v.agg)
            const aggLabel = aggMeta ? aggMeta.label : v.agg
            return (
              <span
                key={v.field}
                className='flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800'
              >
                <SideKickIcon className='h-4 w-4' />
                <span>
                  {aggLabel}: {v.field}
                </span>
                <button
                  onClick={() => removeToken(v.field)}
                  className='text-gray-400 hover:text-red-500 pl-1'
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
      <div className='flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-gray-700'>
        <span>필드 목록</span>
        <div className='flex items-center gap-1 text-xs'>
          <button
            onClick={() => setSortOrder('asc')}
            className={`rounded border px-2 py-1 ${
              sortOrder === 'asc'
                ? 'border-blue-light bg-blue-light text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            오름차순
          </button>
          <button
            onClick={() => setSortOrder('desc')}
            className={`rounded border px-2 py-1 ${
              sortOrder === 'desc'
                ? 'border-blue-light bg-blue-light text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            내림차순
          </button>
        </div>
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
                className='flex flex-col border-t border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50'
              >
                <div className='flex items-center justify-between'>
                  <div
                    className='flex cursor-pointer items-center gap-2'
                    onClick={() => toggleField(fieldName)}
                  >
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        selected ? 'border-blue-light bg-blue-light' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {selected && <CheckIcon className='h-4 w-4 text-white' />}
                    </div>
                    <span>{fieldName}</span>
                  </div>

                  {/* 집계(agg) 드롭다운 */}
                  {selected && (
                    <div className='relative'>
                      <button
                        className='flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'
                        onClick={() =>
                          setOpenAggForField(openAggForField === fieldName ? null : fieldName)
                        }
                      >
                        <span>{AGG_OPTIONS.find((o) => o.value === agg)?.label ?? agg}</span>
                        <ArrowDownIcon className='h-2.5 w-2.5 text-gray-500' />
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
