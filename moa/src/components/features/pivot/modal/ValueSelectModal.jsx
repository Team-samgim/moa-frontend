// 작성자: 최이서
// 피벗 테이블의 값(Value) 필드와 집계 함수를 선택하는 모달 컴포넌트

import { useState, useMemo } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PivotFieldModalShell from './PivotFieldModalShell'

import AddIcon from '@/assets/icons/add.svg?react'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react'
import CloseIcon from '@/assets/icons/delete.svg?react'
import DragHandleIcon from '@/assets/icons/side-kick.svg?react'

import { usePivotFields } from '@/hooks/queries/usePivot'
import { usePivotStore } from '@/stores/pivotStore'

const AGG_OPTIONS = [
  { value: 'sum', label: '합계' },
  { value: 'count', label: '개수' },
  { value: 'avg', label: '평균' },
  { value: 'max', label: '최대' },
]

const ValueToken = ({
  item,
  openAggForId,
  setOpenAggForId,
  updateAggForItem,
  removeValueItem,
  isNumberField,
}) => {
  const { id, field, agg } = item

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const aggMeta = AGG_OPTIONS.find((o) => o.value === agg)
  const aggLabel = aggMeta ? aggMeta.label : agg

  const numeric = isNumberField?.(field) // true | false | undefined
  const isNumericField = !!numeric

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='relative flex items-center gap-2 rounded-2xl border border-gray-300 bg-gray-100 px-2 py-1 text-xs text-gray-800'
    >
      <button
        className='text-gray-500 cursor-grab active:cursor-grabbing'
        {...attributes}
        {...listeners}
      >
        <DragHandleIcon className='h-4 w-4' />
      </button>

      <div className='flex flex-row gap-2.5 leading-tight'>
        <span className='font-medium text-gray-800'>
          {aggLabel}: {field}
        </span>

        {isNumericField ? (
          <>
            <button
              className='flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-50'
              onClick={() => {
                setOpenAggForId(openAggForId === id ? null : id)
              }}
            >
              <span>{aggLabel}</span>
              <ArrowDownIcon className='h-2.5 w-2.5 text-gray-500' />
            </button>

            {openAggForId === id && (
              <div className='absolute z-10 mt-7 ml-20 w-24 rounded border border-gray-200 bg-white text-xs shadow'>
                {AGG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className='block w-full px-3 py-2 text-left hover:bg-gray-50'
                    onClick={() => {
                      updateAggForItem(id, opt.value)
                      setOpenAggForId(null)
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          // 숫자 아닌 필드는 count 고정 뱃지만 보여주기
          <span className='inline-flex items-center rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-500'>
            {aggLabel}
          </span>
        )}
      </div>

      {/* 삭제 버튼 */}
      <button onClick={() => removeValueItem(id)} className='text-gray-400 hover:text-red-500'>
        <CloseIcon className='h-3 w-3' />
      </button>
    </div>
  )
}

const ValueSelectModal = ({ initialSelected = [], onApplyValues, onClose, availableFields }) => {
  const { data, isLoading } = usePivotFields()

  const fields = useMemo(() => {
    if (!data?.fields) return []
    if (availableFields && availableFields.length > 0) {
      const set = new Set(availableFields)
      return data.fields.filter((f) => set.has(f.name))
    }
    return data.fields
  }, [data, availableFields])

  const fieldMetaMap = useMemo(() => {
    const map = new Map()
    fields.forEach((f) => {
      map.set(f.name, f)
    })
    return map
  }, [fields])

  const fieldNames = useMemo(() => fields.map((f) => f.name), [fields])

  const isNumberField = (fieldName) => {
    const meta = fieldMetaMap.get(fieldName)
    return typeof meta?.dataType === 'string' && meta.dataType.toLowerCase() === 'number'
  }

  const { column: globalColumn, rows: globalRows } = usePivotStore()

  const blockedForValues = useMemo(() => {
    const s = new Set()
    if (globalColumn?.field) {
      s.add(globalColumn.field)
    }
    for (const r of globalRows) {
      s.add(r.field)
    }
    return s
  }, [globalColumn, globalRows])

  const [valuesState, setValuesState] = useState(
    initialSelected.map((v) => ({
      id: `${v.field}#${v.agg}`,
      field: v.field,
      agg: v.agg,
    })),
  )

  const [openAggForId, setOpenAggForId] = useState(null)
  const [sortOrder, setSortOrder] = useState(null)
  const [searchValue, setSearchValue] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const isLoadingEffective = !availableFields?.length && isLoading

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

  const addField = (fieldName) => {
    if (blockedForValues.has(fieldName)) return

    const defaultAgg = isNumberField(fieldName) ? 'sum' : 'count'
    const newId = `${fieldName}#${defaultAgg}`

    setValuesState((prev) => [...prev, { id: newId, field: fieldName, agg: defaultAgg }])
  }

  const removeValueItem = (id) => {
    setValuesState((prev) => prev.filter((v) => v.id !== id))
  }

  const updateAggForItem = (id, nextAgg) => {
    setValuesState((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v

        if (!isNumberField(v.field)) {
          return { ...v, agg: 'count', id: `${v.field}#count` }
        }

        return { ...v, agg: nextAgg, id: `${v.field}#${nextAgg}` }
      }),
    )
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setValuesState((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleApply = () => {
    const finalValues = valuesState.map((v) => {
      const opt = AGG_OPTIONS.find((o) => o.value === v.agg)
      const aggLabel = opt ? opt.label : v.agg
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={valuesState.map((v) => v.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className='flex flex-wrap items-center gap-2'>
              {valuesState.length === 0 && (
                <span className='text-xs text-gray-400'>
                  선택된 값이 없습니다. 아래에서 추가하세요.
                </span>
              )}

              {valuesState.map((item, idx) => (
                <div key={item.id} className='flex items-center gap-2'>
                  <ValueToken
                    item={item}
                    openAggForId={openAggForId}
                    setOpenAggForId={setOpenAggForId}
                    updateAggForItem={updateAggForItem}
                    removeValueItem={removeValueItem}
                    isNumberField={isNumberField}
                  />
                  {idx !== valuesState.length - 1 && (
                    <ArrowRightIcon className='h-3.5 w-3.5 text-gray-500' />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

      {/* 필드 목록 */}
      <div className='border border-t-0 border-gray-200'>
        {isLoadingEffective ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>로딩중...</div>
        ) : filteredList.length === 0 ? (
          <div className='px-3 py-4 text-center text-xs text-gray-400'>필드가 없습니다</div>
        ) : (
          filteredList.map((fieldName) => {
            const isDisabledOutside = blockedForValues.has(fieldName)

            return (
              <div
                key={fieldName}
                className={[
                  'flex items-center justify-between border-t border-gray-200 px-3 py-2 text-sm',
                  isDisabledOutside
                    ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'text-gray-800 hover:bg-gray-50 cursor-pointer',
                ].join(' ')}
              >
                <div className='flex items-center gap-2'>
                  <div
                    className={[
                      'flex h-4 w-4 items-center justify-center rounded bg-[#BABBBC] text-gray-700',
                      isDisabledOutside
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:bg-gray-300 cursor-pointer',
                    ].join(' ')}
                    onClick={() => {
                      if (!isDisabledOutside) addField(fieldName)
                    }}
                  >
                    {!isDisabledOutside && <AddIcon className='h-3.5 w-3.5 text-white' />}
                  </div>

                  <span>{fieldName}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </PivotFieldModalShell>
  )
}

export default ValueSelectModal
