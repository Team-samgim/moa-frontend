import { useCallback, useState } from 'react'

import { arrayMove } from '@dnd-kit/sortable'
import ColumnIcon from '@/assets/icons/column.svg?react'
import FilterIcon from '@/assets/icons/filter.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'

import PivotHeaderTabs from '@/components/features/pivot/PivotHeaderTabs'
import PivotChartConfigModal from '@/components/features/pivot/chart/PivotChartConfigModal'
import PivotChartView from '@/components/features/pivot/chart/PivotChartView'
import PivotHeatmapTableModal from '@/components/features/pivot/chart/PivotHeatmapTableModal'
import ColumnSelectModal from '@/components/features/pivot/modal/ColumnSelectModal'
import FieldFilterModal from '@/components/features/pivot/modal/FieldFilterModal'
import RowSelectModal from '@/components/features/pivot/modal/RowSelectModal'
import ValueSelectModal from '@/components/features/pivot/modal/ValueSelectModal'
import PivotConfigPanel from '@/components/features/pivot/panel/PivotConfigPanel'
import SortableRowsList from '@/components/features/pivot/panel/SortableRowsList'
import SortableValuesList from '@/components/features/pivot/panel/SortableValuesList'
import PivotResultTable from '@/components/features/pivot/table/PivotResultTable'

import usePivotChart from '@/hooks/pivot/usePivotChart'
import { usePivotQuery } from '@/hooks/queries/usePivot'
import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotModalStore } from '@/stores/pivotModalStore'
import { usePivotStore } from '@/stores/pivotStore'
import { buildTimePayload } from '@/utils/pivotTime'

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
    setCustomRange,
    setRows,
    setValues,
    setFilters,
  } = usePivotStore()

  const isChartMode = usePivotChartStore((s) => s.isChartMode)
  const setIsChartMode = usePivotChartStore((s) => s.setIsChartMode)

  const [filterModal, setFilterModal] = useState({
    open: false,
    field: null,
  })

  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false)

  const {
    isConfigOpen: isChartConfigOpen,
    handleToggleChart,
    setIsConfigOpen,
    closeConfig: closeChartConfig,
    applyConfig: _applyChartConfig,
  } = usePivotChart()

  const handleApplyChart = () => {
    setIsChartMode(true)
  }

  const { mutate: executeQuery, data: pivotResult, isLoading: isPivotLoading } = usePivotQuery()

  const runQueryNow = useCallback(() => {
    const cfg = usePivotStore.getState()
    // console.log(cfg)
    const time = buildTimePayload(cfg.timeRange, cfg.customRange)

    executeQuery({
      layer: cfg.layer,
      time,
      column: cfg.column,
      rows: cfg.rows,
      values: cfg.values,
      filters: cfg.filters,
    })
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

  const applyRows = useCallback(
    (newRows) => {
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

  const handleSelectTimePreset = useCallback(
    (value) => {
      setTimePreset(value)
      runQueryNow()
    },
    [setTimePreset, runQueryNow],
  )

  const handleApplyCustomRange = useCallback(
    (fromDate, toDate) => {
      setCustomRange(fromDate, toDate)
      runQueryNow()
    },
    [setCustomRange, runQueryNow],
  )

  const currentFilterForModal = filters.find((f) => f.field === filterModal.field && f.op === 'IN')

  const selectedValuesForModal = Array.isArray(currentFilterForModal?.value)
    ? currentFilterForModal.value
    : undefined

  const timeForFilter = buildTimePayload(timeRange, customRange)

  const initialTopNForModal = currentFilterForModal?.topN

  return (
    <>
      <div className='flex flex-col gap-4 p-4 mx-30'>
        <div className='flex items-center'>
          <PivotHeaderTabs />
        </div>

        <section className='rounded-lg border border-gray-200 bg-white shadow-sm'>
          <div className='flex flex-row gap-6 p-5 lg:flex-row'>
            {/* 왼쪽 패널 */}
            <PivotConfigPanel
              layer={layer}
              timeRange={timeRange}
              customRange={customRange}
              onChangeLayer={(nextLayer) => {
                setLayer(nextLayer)
                runQueryNow()
              }}
              onSelectTimePreset={handleSelectTimePreset}
              onApplyCustomRange={handleApplyCustomRange}
            />

            <div className='hidden w-px bg-gray-200 lg:block' />

            {/* 오른쪽 패널 */}
            <div className='flex flex-1 flex-col gap-4 lg:flex-row lg:h-60 min-h-0'>
              {/* Column 카드 */}
              <div className='flex-1 flex min-h-0 flex-col rounded border border-gray-200 overflow-hidden'>
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

                {/* 리스트 영역만 스크롤 */}
                <div className='flex-1 divide-y divide-gray-200 overflow-y-auto'>
                  {column && column.field ? (
                    <div className='flex items-center justify-between px-3 py-2 text-sm text-gray-800'>
                      <span className='flex items-center gap-2'>
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

              {/* Rows 카드 */}
              <div className='flex-1 flex min-h-0 flex-col rounded border border-gray-200 overflow-hidden'>
                <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
                  <span className='flex items-center gap-1'>
                    <RowIcon className='h-4 w-4 text-gray-600' />행 (Rows)
                  </span>
                  <button className='p-1 text-gray-500 hover:text-gray-700' onClick={openRowsModal}>
                    <SettingIcon className='h-4 w-4' />
                  </button>
                </div>

                <div className='flex-1 divide-y divide-gray-200 overflow-y-auto'>
                  <SortableRowsList
                    rows={rows}
                    onDragEnd={handleDragEndRows}
                    onFilterRow={openFilterForField}
                  />
                </div>
              </div>

              {/* Values 카드 */}
              <div className='flex-1 flex min-h-0 flex-col rounded border border-gray-200 overflow-hidden'>
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

                <div className='flex-1 divide-y divide-gray-200 overflow-y-auto'>
                  <SortableValuesList
                    values={values}
                    onDragEnd={handleDragEndValues}
                    onFilterValue={openFilterForField}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 결과 프리뷰 / 차트 모드 토글 */}
        <section className='rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='font-medium text-gray-800'>차트 모드</span>

              {/* 토글 버튼 */}
              <button
                type='button'
                onClick={handleToggleChart}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isChartMode ? 'bg-[#1b254b]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isChartMode ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 오른쪽 영역: 차트 설정 + 전체보기 버튼 */}
            <div className='flex items-center gap-2'>
              <button onClick={() => setIsConfigOpen(true)} className='text-xs text-gray-700'>
                <span>차트 설정 (임시)</span>
              </button>

              <button
                type='button'
                onClick={() => {
                  // 최소한 column/rows/values 있어야 전체보기 의미가 있으니까 가드
                  if (!column?.field || !rows?.length || !values?.length) {
                    window.alert('전체보기를 사용하려면 열/행/값을 먼저 설정해주세요.')
                    return
                  }
                  setIsHeatmapOpen(true)
                }}
                className='rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50'
              >
                전체보기 (테이블 히트맵)
              </button>
            </div>
          </div>

          {/* 이하 기존 내용 그대로 */}
          {isChartMode ? (
            <div className='flex min-h-[400px] items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400'>
              <PivotChartView />
            </div>
          ) : (
            <>
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
            </>
          )}
        </section>
      </div>

      {isOpen && mode === 'rows' && (
        <RowSelectModal
          initialSelected={draftRows.map((r) => r.field)}
          onApplyRows={(newRows) => applyRows(newRows)}
          onClose={closeModal}
        />
      )}

      {isOpen && mode === 'column' && (
        <ColumnSelectModal
          initialSelected={draftColumn?.field || ''}
          onApplyColumn={(newCol) => applyColumn(newCol)}
          onClose={closeModal}
        />
      )}

      {isOpen && mode === 'values' && (
        <ValueSelectModal
          initialSelected={draftValues.map((v) => ({
            field: v.field,
            agg: v.agg,
          }))}
          onApplyValues={(newVals) => applyValues(newVals)}
          onClose={closeModal}
        />
      )}

      {filterModal.open && (
        <FieldFilterModal
          layer={layer}
          time={timeForFilter}
          customRange={customRange}
          filters={filters}
          fieldName={filterModal.field}
          valueAliases={filterModal.valueAliases}
          selectedValues={selectedValuesForModal}
          initialTopN={initialTopNForModal}
          onApply={applyFilter}
          onClose={closeFilter}
        />
      )}
      {isChartConfigOpen && (
        <PivotChartConfigModal
          layer={layer}
          time={timeForFilter}
          filters={filters}
          onClose={closeChartConfig}
          onApply={handleApplyChart}
        />
      )}
      {isHeatmapOpen && (
        <PivotHeatmapTableModal isOpen={isHeatmapOpen} onClose={() => setIsHeatmapOpen(false)} />
      )}
    </>
  )
}

export default PivotPage
