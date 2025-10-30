import { useState, useMemo } from 'react'
import PivotFieldModalShell from './PivotFieldModalShell'
import { usePivotFields } from '@/hooks/queries/usePivot'

const ColumnSelectModal = ({
  initialSelected,
  onApplyColumn, // function
  onClose,
}) => {
  const { data, isLoading } = usePivotFields() // 필드 목록
  const fieldNames = (data?.fields || []).map((f) => f.name)

  const [selected, setSelected] = useState(initialSelected || '') // 선택 값
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

  const handleApply = () => {
    if (selected) {
      onApplyColumn({ field: selected })
    } else {
      onApplyColumn(null)
    }
  }

  return (
    <PivotFieldModalShell
      title='열 선택'
      headerRight={null}
      tokensArea={
        <div className='mb-3 text-sm text-gray-700'>
          선택한 필드: <span className='font-medium text-gray-900'>{selected || '-'}</span>
        </div>
      }
      onApply={handleApply}
      onClose={onClose}
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      <div className='flex rounded items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2 text-[14px] text-gray-700'>
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

      <div className='border border-t-0 border-gray-200'>
        {isLoading ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>로딩중...</div>
        ) : filteredList.length === 0 ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>필드가 없습니다</div>
        ) : (
          filteredList.map((fieldName) => (
            <label
              key={fieldName}
              className='flex cursor-pointer items-center gap-2 border-t border-gray-200 px-3 py-3 text-sm text-gray-800'
            >
              <input
                type='radio'
                className='h-4 w-4 text-blue-600'
                checked={selected === fieldName}
                onChange={() => setSelected(fieldName)}
              />
              <span>{fieldName}</span>
            </label>
          ))
        )}
      </div>
    </PivotFieldModalShell>
  )
}

export default ColumnSelectModal
