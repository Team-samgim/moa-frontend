import { useCallback, useState } from 'react'

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import ColumnIcon from '@/assets/icons/column.svg?react'
import DeleteIcon from '@/assets/icons/delete.svg?react'
import FilterIcon from '@/assets/icons/filter.svg?react'
import ResetIcon from '@/assets/icons/reset.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'

import ColumnSelectModal from '@/components/features/pivot/ColumnSelectModal'
import FieldFilterModal from '@/components/features/pivot/FieldFilterModal'
import PivotHeaderTabs from '@/components/features/pivot/PivotHeaderTabs'

import PivotResultTable from '@/components/features/pivot/PivotResultTable'
import RowSelectModal from '@/components/features/pivot/RowSelectModal'
import ValueSelectModal from '@/components/features/pivot/ValueSelectModal'

import { usePivotQuery } from '@/hooks/queries/usePivot'
import { usePivotModalStore } from '@/stores/pivotModalStore'
import { usePivotStore } from '@/stores/pivotStore'

const LAYER_OPTIONS = ['HTTP_PAGE', 'HTTP_URI', 'TCP', 'Ethernet']

const TIME_PRESETS = [
  { label: '1시간', value: '1h' },
  { label: '2시간', value: '2h' },
  { label: '24시간', value: '24h' },
  { label: '1주일', value: '1w' },
]

const SortableRowItem = ({ item, onFilter = () => {} }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.field,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center justify-between px-3 py-2 text-sm text-gray-800 bg-white border-t first:border-t-0 border-gray-200'
    >
      <span className='flex items-center gap-2'>
        <button
          className='text-gray-500 cursor-grab active:cursor-grabbing shrink-0'
          {...attributes}
          {...listeners}
        >
          <SideKickIcon className='h-4 w-4 text-gray-500' />
        </button>
        {item.field}
      </span>
      <div className='flex items-center gap-2 text-gray-400'>
        <button className='p-1 hover:text-red-500' onClick={() => onFilter(item.field)}>
          <FilterIcon className='h-4 w-4 text-[#464646]' />
        </button>
      </div>
    </div>
  )
}

const SortableValueItem = ({ item, onFilter = () => {} }) => {
  const sortableId = item.field + '::' + item.agg

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: sortableId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center justify-between px-3 py-2 text-sm text-gray-800 bg-white border-t first:border-t-0 border-gray-200'
    >
      <div className='flex flex-col'>
        <span className='flex items-center gap-2'>
          <button
            className='text-gray-500 cursor-grab active:cursor-grabbing shrink-0'
            {...attributes}
            {...listeners}
          >
            <SideKickIcon className='h-4 w-4 text-gray-500' />
          </button>
          {item.alias ?? item.field}
        </span>
        <span className='pl-6 text-[11px] text-gray-500'>
          {item.agg?.toUpperCase()} • {item.field}
        </span>
      </div>
      <div className='flex items-center gap-2 text-gray-400'>
        <button className='p-1 hover:text-red-500' onClick={() => onFilter(item.field)}>
          <FilterIcon className='h-4 w-4 text-[#464646]' />
        </button>
      </div>
    </div>
  )
}

const PivotPage = () => {
  const {
    layer,
    timeRange,
    customRange,
    column,
    rows,
    values,
    filters,
    setLayer,
    setTimePreset,
    setColumnField,
    setRows,
    setValues,
    setFilters,
  } = usePivotStore()

  const [filterModal, setFilterModal] = useState({
    open: false,
    field: null,
  })

  const { mutate: executeQuery, data: pivotResult, isLoading: isPivotLoading } = usePivotQuery()

  const runQueryNow = useCallback(() => {
    const cfg = usePivotStore.getState()
    executeQuery(cfg)
  }, [executeQuery])

  const openFilterForField = useCallback(
    (fieldName) => {
      const valueAliases = values?.length
        ? values.map((v) => v.alias ?? `${v.agg?.toUpperCase() || ''}: ${v.field}`)
        : ['Values 값들']

      setFilterModal({ open: true, field: fieldName, valueAliases })
    },
    [values],
  )

  const closeFilter = useCallback(() => setFilterModal((m) => ({ ...m, open: false })), [])
  const applyFilter = useCallback(
    (payload) => {
      // payload = { field, selected: string[], order, topN }
      setFilters((prev) => {
        const others = (prev || []).filter((f) => f.field !== payload.field)
        return [
          ...others,
          {
            field: payload.field,
            op: 'IN',
            value: payload.selected,
            topN: payload.topN,
            order: payload.order,
          },
        ]
      })
      closeFilter()
      runQueryNow()
    },
    [setFilters, closeFilter, runQueryNow],
  )

  const { isOpen, mode, openModal, closeModal, draftRows, draftColumn, draftValues } =
    usePivotModalStore()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleRemoveRowField = useCallback(
    (fieldName) => {
      const newRows = rows.filter((r) => r.field !== fieldName)
      setRows(newRows)
      runQueryNow()
    },
    [rows, setRows, runQueryNow],
  )

  const applyRows = useCallback(
    (newRows) => {
      console.log('applyRows called with:', newRows)
      setRows(newRows)
      closeModal()
      runQueryNow()
    },
    [setRows, closeModal, runQueryNow],
  )

  const applyColumn = useCallback(
    (newCol) => {
      if (newCol && newCol.field) {
        setColumnField(newCol.field)
      } else {
        setColumnField(null)
      }
      closeModal()
      runQueryNow()
    },
    [setColumnField, closeModal, runQueryNow],
  )

  const applyValues = useCallback(
    (newValues) => {
      setValues(newValues)
      closeModal()
      runQueryNow()
    },
    [setValues, closeModal, runQueryNow],
  )

  const openRowsModal = useCallback(() => {
    openModal('rows', {
      rows,
      column,
      values,
    })
  }, [openModal, rows, column, values])

  const openColumnModal = useCallback(() => {
    openModal('column', {
      rows,
      column,
      values,
    })
  }, [openModal, rows, column, values])

  const openValuesModal = useCallback(() => {
    openModal('values', {
      rows,
      column,
      values,
    })
  }, [openModal, rows, column, values])

  const handleRunQuery = useCallback(() => {
    runQueryNow()
  }, [runQueryNow])

  const handleDragEndRows = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = rows.findIndex((r) => r.field === active.id)
      const newIndex = rows.findIndex((r) => r.field === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(rows, oldIndex, newIndex)
      setRows(reordered)
      runQueryNow()
    },
    [rows, setRows, runQueryNow],
  )

  const handleDragEndValues = useCallback(
    (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const getId = (v) => v.field + '::' + v.agg

      const oldIndex = values.findIndex((v) => getId(v) === active.id)
      const newIndex = values.findIndex((v) => getId(v) === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(values, oldIndex, newIndex)
      setValues(reordered)
      runQueryNow()
    },
    [values, setValues, runQueryNow],
  )

  const RenderSortableRows = ({ rows, sensors, handleDragEndRows, onFilterRow }) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndRows}>
      <SortableContext items={rows.map((r) => r.field)} strategy={verticalListSortingStrategy}>
        {rows.length > 0 ? (
          rows.map((r) => <SortableRowItem key={r.field} item={r} onFilter={onFilterRow} />)
        ) : (
          <div className='px-3 py-6 text-center text-xs text-gray-400'>행을 선택하세요</div>
        )}
      </SortableContext>
    </DndContext>
  )

  const RenderSortableValues = ({ values, sensors, handleDragEndValues, onFilterValue }) => {
    const getId = (v) => v.field + '::' + v.agg
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndValues}
      >
        <SortableContext items={values.map((v) => getId(v))} strategy={verticalListSortingStrategy}>
          {values.length > 0 ? (
            values.map((v) => (
              <SortableValueItem key={getId(v)} item={v} onFilter={onFilterValue} />
            ))
          ) : (
            <div className='px-3 py-6 text-center text-xs text-gray-400'>값을 선택하세요</div>
          )}
        </SortableContext>
      </DndContext>
    )
  }

  const handleSelectTimePreset = useCallback(
    (value) => {
      setTimePreset(value)
      runQueryNow()
    },
    [setTimePreset, runQueryNow],
  )

  const currentFilterForModal = filters.find((f) => f.field === filterModal.field && f.op === 'IN')

  const selectedValuesForModal = Array.isArray(currentFilterForModal?.value)
    ? currentFilterForModal.value
    : undefined

  return (
    <>
      <div className='flex flex-col gap-4 p-4'>
        {/* 상단 탭 영역 */}
        <div className='flex items-center'>
          <PivotHeaderTabs />
        </div>

        {/* 피벗 카드 전체 */}
        <section className='rounded-lg border border-gray-200 bg-white shadow-sm'>
          {/* 본문 영역 */}
          <div className='flex flex-row gap-6 p-5 lg:flex-row'>
            {/* 왼쪽 패널: 조회 계층 / 조회 기간 */}
            <div className='w-full max-w-xs shrink-0 space-y-6'>
              <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                <div className='text-base font-semibold text-gray-900'>피벗 테이블 구성</div>

                <div className='flex flex-wrap items-center gap-3 text-xs font-medium text-[#2263AC]'>
                  <button className='hover:underline'>프리셋 저장</button>
                  <button className='hover:underline'>프리셋 불러오기</button>
                </div>
              </div>

              {/* 조회 계층 */}
              <div>
                <div className='mb-3 text-sm font-medium text-gray-800'>조회 계층</div>
                <div className='flex flex-wrap justify-between w-full'>
                  {LAYER_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setLayer(opt)
                        runQueryNow()
                      }}
                      className={[
                        'rounded border px-3 py-2 text-xs font-medium',
                        layer === opt
                          ? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                          : 'bg-[#F5F5F7] text-gray-700 border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 조회 기간 */}
              <div>
                <div className='mb-3 flex justify-between items-center gap-2 text-sm font-medium text-gray-800'>
                  <span>조회 기간</span>
                  <button
                    className='rounded border border-gray-300 bg-white p-1 hover:bg-gray-50'
                    title='시간 새로고침'
                    onClick={() => {
                      if (timeRange?.type === 'preset' && timeRange?.value) {
                        handleSelectTimePreset(timeRange.value)
                      }
                    }}
                  >
                    <ResetIcon className='h-3.5 w-3.5 text-gray-500' />
                  </button>
                </div>

                <div className='grid grid-cols-4 gap-2.5 w-full'>
                  {TIME_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => handleSelectTimePreset(p.value)}
                      className={[
                        'rounded border px-3 py-2 text-xs font-medium',
                        timeRange?.value === p.value
                          ? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                          : 'bg-[#F5F5F7] text-gray-700 border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* TODO: 직접 설정 기능 추가 */}
                <div className='mt-2'>
                  <button className='flex w-full items-center justify-between rounded border border-gray-300 bg-white px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50'>
                    <span>직접 설정</span>
                    <ArrowDownIcon className='h-3 w-3 text-gray-500' />
                  </button>
                </div>
              </div>
            </div>

            <div className='hidden w-px bg-gray-200 lg:block' />

            {/* 오른쪽 패널: Column / Rows / Values */}
            <div className='flex flex-1 flex-col gap-4 lg:flex-row'>
              {/* Column 카드 (단일이라 dnd 불필요) */}
              <div className='flex-1 rounded border border-gray-200 overflow-hidden'>
                <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
                  <span className='flex items-center gap-1'>
                    <ColumnIcon className='h-4 w-4 text-gray-600' />열 (Column)
                  </span>

                  <button
                    className='p-1 text-gray-500 hover:text-gray-700'
                    onClick={openColumnModal}
                  >
                    <SettingIcon className='h-4 w-4' />
                  </button>
                </div>

                <div className='divide-y divide-gray-200'>
                  {column && column.field ? (
                    <div className='flex items-center justify-between px-3 py-2 text-sm text-gray-800'>
                      <span className='flex items-center gap-2'>
                        {/* column은 단일이라 그냥 아이콘만 시각적으로 두자 */}
                        <SideKickIcon className='h-4 w-4 text-gray-500' />
                        {column.field}
                      </span>

                      <button
                        className='p-1 text-gray-400 hover:text-red-500'
                        onClick={() => openFilterForField(column.field)}
                      >
                        <FilterIcon className='h-4 w-4 text-[#464646]' />
                      </button>
                    </div>
                  ) : (
                    <div className='px-3 py-6 text-center text-xs text-gray-400'>
                      열을 선택하세요
                    </div>
                  )}
                </div>
              </div>

              {/* Rows 카드 (dnd 가능) */}
              <div className='flex-1 rounded border border-gray-200 overflow-hidden'>
                <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
                  <span className='flex items-center gap-1'>
                    <RowIcon className='h-4 w-4 text-gray-600' />행 (Rows)
                  </span>

                  <button className='p-1 text-gray-500 hover:text-gray-700' onClick={openRowsModal}>
                    <SettingIcon className='h-4 w-4' />
                  </button>
                </div>

                {/* DnD 정렬 가능한 리스트 */}
                <div className='divide-y divide-gray-200'>
                  <RenderSortableRows
                    rows={rows}
                    sensors={sensors}
                    handleDragEndRows={handleDragEndRows}
                    handleRemoveRowField={handleRemoveRowField} // (원하면 삭제 버튼도 유지)
                    onFilterRow={openFilterForField}
                  />
                </div>
              </div>

              {/* Values 카드 (dnd 가능) */}
              <div className='flex-1 rounded border border-gray-200 overflow-hidden'>
                <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
                  <span className='flex items-center gap-1'>
                    <ValueIcon className='h-4 w-4 text-gray-600' />값 (Values)
                  </span>

                  <button
                    className='p-1 text-gray-500 hover:text-gray-700'
                    onClick={openValuesModal}
                  >
                    <SettingIcon className='h-4 w-4' />
                  </button>
                </div>

                {/* DnD 정렬 가능한 리스트 */}
                <div className='divide-y divide-gray-200'>
                  <RenderSortableValues
                    values={values}
                    sensors={sensors}
                    handleDragEndValues={handleDragEndValues}
                    onFilterValue={openFilterForField}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 결과 프리뷰 */}
        <section className='rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='font-medium text-gray-800'>결과 미리보기</div>

            <div className='flex items-center gap-2'>
              <button
                className='rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'
                onClick={handleRunQuery}
              >
                조회 실행
              </button>

              <button className='flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'>
                <SideKickIcon className='h-4 w-4 text-gray-500' />
                <span>사이드킥</span>
              </button>
            </div>
          </div>

          {isPivotLoading && (
            <div className='flex h-32 items-center justify-center text-xs text-gray-400'>
              로딩중...
            </div>
          )}

          {!isPivotLoading && pivotResult && <PivotResultTable pivotResult={pivotResult} />}

          {!isPivotLoading && !pivotResult && (
            <div className='flex h-32 items-center justify-center text-xs text-gray-400'>
              아직 조회되지 않았습니다
            </div>
          )}
        </section>
      </div>

      {isOpen && mode === 'rows' && (
        <RowSelectModal
          initialSelected={draftRows.map((r) => r.field)}
          onApplyRows={(newRows /* [{field:'...'}] */) => applyRows(newRows)}
          onClose={closeModal}
        />
      )}

      {isOpen && mode === 'column' && (
        <ColumnSelectModal
          initialSelected={draftColumn?.field || ''}
          onApplyColumn={(newCol /* {field:'...'} | null */) => applyColumn(newCol)}
          onClose={closeModal}
        />
      )}

      {isOpen && mode === 'values' && (
        <ValueSelectModal
          initialSelected={draftValues.map((v) => ({
            field: v.field,
            agg: v.agg,
          }))}
          onApplyValues={(newVals /* [{field,agg,alias}] */) => applyValues(newVals)}
          onClose={closeModal}
        />
      )}

      {filterModal.open && (
        <FieldFilterModal
          layer={layer}
          timeRange={timeRange}
          customRange={customRange}
          filters={filters}
          fieldName={filterModal.field}
          valueAliases={filterModal.valueAliases}
          selectedValues={selectedValuesForModal}
          onApply={applyFilter}
          onClose={closeFilter}
        />
      )}
    </>
  )
}

export default PivotPage
