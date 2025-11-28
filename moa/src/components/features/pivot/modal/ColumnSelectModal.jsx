// 작성자: 최이서
// 피벗 테이블의 열(Column) 필드를 선택하는 모달 컴포넌트

import { useState, useMemo } from 'react'
import PivotFieldModalShell from './PivotFieldModalShell'
import { usePivotFields } from '@/hooks/queries/usePivot'
import { usePivotStore } from '@/stores/pivotStore'

const ColumnSelectModal = ({ initialSelected, onApplyColumn, onClose, availableFields }) => {
  const { data, isLoading } = usePivotFields()
  const fieldNames = useMemo(() => {
    if (availableFields && availableFields.length > 0) {
      return availableFields
    }
    return (data?.fields || []).map((f) => f.name)
  }, [availableFields, data])

  const isLoadingEffective = !availableFields?.length && isLoading

  const { rows: globalRows, values: globalValues } = usePivotStore()

  const usedInRows = useMemo(() => new Set(globalRows.map((r) => r.field)), [globalRows])
  const usedInValues = useMemo(() => new Set(globalValues.map((v) => v.field)), [globalValues])

  const blockedForColumn = useMemo(() => {
    const s = new Set()
    usedInRows.forEach((f) => s.add(f))
    usedInValues.forEach((f) => s.add(f))
    return s
  }, [usedInRows, usedInValues])

  const [selected, setSelected] = useState(initialSelected || '')
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
        {isLoadingEffective ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>로딩중...</div>
        ) : filteredList.length === 0 ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>필드가 없습니다</div>
        ) : (
          filteredList.map((fieldName) => {
            const isDisabled = blockedForColumn.has(fieldName) && selected !== fieldName

            return (
              <label
                key={fieldName}
                className={[
                  'flex items-center gap-2 border-t border-gray-200 px-3 py-3 text-sm',
                  isDisabled
                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'text-gray-800 hover:bg-gray-50 cursor-pointer',
                ].join(' ')}
              >
                <input
                  type='radio'
                  className={[
                    'h-4 w-4',
                    isDisabled
                      ? 'accent-gray-300 cursor-not-allowed'
                      : 'accent-blue cursor-pointer',
                  ].join(' ')}
                  disabled={isDisabled}
                  checked={selected === fieldName}
                  onChange={() => {
                    if (!isDisabled) setSelected(fieldName)
                  }}
                />
                <span>{fieldName}</span>
              </label>
            )
          })
        )}
      </div>
    </PivotFieldModalShell>
  )
}

export default ColumnSelectModal
