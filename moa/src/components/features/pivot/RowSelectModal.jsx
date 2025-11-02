import { useState, useMemo } from 'react'
import PivotFieldModalShell from './PivotFieldModalShell'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import CloseIcon from '@/assets/icons/delete.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import { usePivotFields } from '@/hooks/queries/usePivot'
import { usePivotStore } from '@/stores/pivotStore'

const RowSelectModal = ({ initialSelected = [], onApplyRows, onClose }) => {
  const { data, isLoading } = usePivotFields()
  const fieldNames = (data?.fields || []).map((f) => f.name)

  const { column: globalColumn, values: globalValues } = usePivotStore()

  const blockedForRows = useMemo(() => {
    const s = new Set()
    if (globalColumn?.field) {
      s.add(globalColumn.field)
    }
    for (const v of globalValues) {
      s.add(v.field)
    }
    return s
  }, [globalColumn, globalValues])

  const [selected, setSelected] = useState(initialSelected)
  const [sortOrder, setSortOrder] = useState(null)
  const [searchValue, setSearchValue] = useState('')

  const filteredList = useMemo(() => {
    let base = fieldNames
    if (searchValue)
      base = base.filter((name) => name.toLowerCase().includes(searchValue.toLowerCase()))

    if (sortOrder === 'asc') base = [...base].sort((a, b) => a.localeCompare(b))
    else if (sortOrder === 'desc') base = [...base].sort((a, b) => b.localeCompare(a))

    return base
  }, [fieldNames, sortOrder, searchValue])

  const toggleField = (fieldName, isDisabled) => {
    if (isDisabled) return

    setSelected((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName],
    )
  }

  const removeToken = (fieldName) => {
    setSelected((prev) => prev.filter((f) => f !== fieldName))
  }

  const handleApply = () => {
    const rowsPayload = selected.map((f) => ({ field: f }))
    onApplyRows(rowsPayload)
  }

  return (
    <PivotFieldModalShell
      title='행 선택'
      headerRight={null}
      tokensArea={
        <div className='flex flex-wrap gap-2'>
          {selected.map((field) => (
            <span
              key={field}
              className='flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800'
            >
              <SideKickIcon className='h-4 w-4' />
              {field}
              <button
                onClick={() => removeToken(field)}
                className='text-gray-400 hover:text-red-500 pl-1'
              >
                <CloseIcon className='h-3 w-3' />
              </button>
            </span>
          ))}
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
            const isChecked = selected.includes(fieldName)

            const isDisabledOutside = blockedForRows.has(fieldName) && !isChecked

            let boxClass = ''
            let iconColorClass = ''
            if (isChecked) {
              boxClass = 'border-blue-light bg-blue-light'
              iconColorClass = 'text-white'
            } else if (isDisabledOutside) {
              boxClass = 'border-gray-300 bg-gray-300'
              iconColorClass = 'text-white'
            } else {
              boxClass = 'border-gray-300 bg-white'
              iconColorClass = 'text-white'
            }

            return (
              <label
                key={fieldName}
                className={[
                  'flex items-center gap-2 border-t border-gray-200 px-3 py-2 text-sm',
                  isDisabledOutside
                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'text-gray-800 hover:bg-gray-50 cursor-pointer',
                ].join(' ')}
                onClick={() => toggleField(fieldName, isDisabledOutside)}
              >
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${boxClass}`}
                >
                  {(isChecked || isDisabledOutside) && (
                    <CheckIcon className={`h-4 w-4 ${iconColorClass}`} />
                  )}
                </div>
                <span>{fieldName}</span>
              </label>
            )
          })
        )}
      </div>
    </PivotFieldModalShell>
  )
}

export default RowSelectModal
