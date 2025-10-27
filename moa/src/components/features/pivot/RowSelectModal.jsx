import { useState, useMemo } from 'react'
import PivotFieldModalShell from './PivotFieldModalShell'
import CloseIcon from '@/assets/icons/delete.svg?react'
import { usePivotFields } from '@/hooks/queries/usePivot'

const RowSelectModal = ({
  initialSelected = [],
  onApplyRows, // function
  onClose,
}) => {
  const { data, isLoading } = usePivotFields() // 필드 목록
  const fieldNames = (data?.fields || []).map((f) => f.name)

  const [selected, setSelected] = useState(initialSelected)
  const [sortOrder, setSortOrder] = useState(null)
  const [searchValue, setSearchValue] = useState('')

  const filteredList = useMemo(() => {
    let base = fieldNames

    if (searchValue) {
      base = base.filter((name) => name.toLowerCase().includes(searchValue.toLowerCase()))
    }

    if (sortOrder === 'asc') {
      base = [...base].sort((a, b) => a.localeCompare(b))
    } else if (sortOrder === 'desc') {
      base = [...base].sort((a, b) => b.localeCompare(a))
    }

    return base
  }, [fieldNames, sortOrder, searchValue])

  const toggleAll = () => {
    setSelected(filteredList)
  }

  const toggleField = (fieldName) => {
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
        <div className='mb-3 flex flex-wrap gap-2'>
          {selected.map((field) => (
            <span
              key={field}
              className='flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800'
            >
              <span className='text-gray-500'>⋮⋮⋮</span>
              {field}
              <button
                onClick={() => removeToken(field)}
                className='text-gray-400 hover:text-red-500'
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
      {/* 리스트 헤더 영역 */}
      <div className='flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700'>
        <label className='flex items-center gap-2'>
          <input
            type='checkbox'
            className='h-4 w-4'
            onChange={toggleAll}
            checked={
              selected.length > 0 &&
              filteredList.length > 0 &&
              filteredList.every((f) => selected.includes(f))
            }
          />
          <span>
            전체 선택 {selected.length}/{fieldNames.length}
          </span>
        </label>
      </div>

      {/* 실제 리스트 */}
      <div className='border border-t-0 border-gray-200'>
        {isLoading ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>로딩중...</div>
        ) : filteredList.length === 0 ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>필드가 없습니다</div>
        ) : (
          filteredList.map((fieldName) => (
            <label
              key={fieldName}
              className='flex cursor-pointer items-center gap-2 border-t border-gray-200 px-3 py-2 text-sm text-gray-800'
            >
              <input
                type='checkbox'
                className='h-4 w-4 text-blue-600'
                checked={selected.includes(fieldName)}
                onChange={() => toggleField(fieldName)}
              />
              <div className='flex items-center gap-2'>
                <span className='text-gray-400 text-xs'>⋮⋮⋮</span>
                <span>{fieldName}</span>
              </div>
            </label>
          ))
        )}
      </div>
    </PivotFieldModalShell>
  )
}

export default RowSelectModal
