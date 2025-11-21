import { useCallback, useRef, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import ChartIcon from '@/assets/icons/chart-img.svg?react'
import ColumnIcon from '@/assets/icons/column.svg?react'
import ExcelIcon from '@/assets/icons/excel.svg?react'
import FilterIcon from '@/assets/icons/filter.svg?react'
import HeatmapIcon from '@/assets/icons/heatmap.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import ChartSettingIcon from '@/assets/icons/setting-outline.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'

import PivotHeaderTabs from '@/components/features/pivot/PivotHeaderTabs'
import DrilldownTimeSeriesPanel from '@/components/features/pivot/chart/DrilldownTimeSeriesPanel'
import PivotChartConfigModal from '@/components/features/pivot/chart/PivotChartConfigModal'
import PivotChartView from '@/components/features/pivot/chart/PivotChartView'
import PivotHeatmapTableModal from '@/components/features/pivot/chart/PivotHeatmapTableModal'
import ColumnSelectModal from '@/components/features/pivot/modal/ColumnSelectModal'
import FieldFilterModal from '@/components/features/pivot/modal/FieldFilterModal'
import PivotPresetModal from '@/components/features/pivot/modal/PivotPresetModal'
import RowSelectModal from '@/components/features/pivot/modal/RowSelectModal'
import ValueSelectModal from '@/components/features/pivot/modal/ValueSelectModal'
import PivotConfigPanel from '@/components/features/pivot/panel/PivotConfigPanel'
import SortableRowsList from '@/components/features/pivot/panel/SortableRowsList'
import SortableValuesList from '@/components/features/pivot/panel/SortableValuesList'
import PivotResultTable from '@/components/features/pivot/table/PivotResultTable'

import usePivotChart from '@/hooks/pivot/usePivotChart'
import usePivotDragHandlers from '@/hooks/pivot/usePivotDragHandlers'
import usePivotFieldModals from '@/hooks/pivot/usePivotFieldModals'
import usePivotFilterModal from '@/hooks/pivot/usePivotFilterModal'
import usePivotRunner from '@/hooks/pivot/usePivotRunner'
import useExport from '@/hooks/queries/useExport'
import usePreset from '@/hooks/queries/usePreset'

import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotStore } from '@/stores/pivotStore'
import { applyPivotPresetConfigToStore } from '@/utils/preset/pivotPreset'

const PivotPage = () => {
  const location = useLocation()
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
    pivotMode,
    setPivotMode,
    gridContext,
  } = usePivotStore()

  const isFromGrid = pivotMode === 'fromGrid'
  const gridColumns = gridContext?.columns || []

  const isChartMode = usePivotChartStore((s) => s.isChartMode)
  const setIsChartMode = usePivotChartStore((s) => s.setIsChartMode)

  const chartViewRef = useRef(null)

  // ====== 마이페이지에서 넘어온 피벗 프리셋 적용 ======
  const presetConfigFromLocation = location.state?.preset

  useEffect(() => {
    if (!presetConfigFromLocation) return

    try {
      const modeFromPreset = presetConfigFromLocation?.pivot?.mode

      // config 전체를 store에 밀어넣기
      applyPivotPresetConfigToStore(presetConfigFromLocation || {})

      // fromGrid / free 모드 동기화
      if (modeFromPreset === 'fromGrid' || modeFromPreset === 'free') {
        setPivotMode(modeFromPreset)
      }

      // 바로 쿼리 실행
      runQueryNow()
    } catch (e) {
      console.error(e)
      window.alert('프리셋 적용 중 오류가 발생했습니다.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetConfigFromLocation])

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false)

  const [drilldownState, setDrilldownState] = useState({
    open: false,
    selectedColKey: null,
    rowKeys: [],
    colorMap: null,
  })

  // 차트 관련 훅
  const {
    isConfigOpen: isChartConfigOpen,
    handleToggleChart,
    setIsConfigOpen,
    closeConfig: closeChartConfig,
  } = usePivotChart()

  const handleApplyChart = () => {
    setIsChartMode(true)
  }

  const { runQueryNow, pivotResult, isPivotLoading } = usePivotRunner()

  const handleChartClickForDrilldown = useCallback(
    ({ selectedColKey, rowKeys, seriesColorMap }) => {
      setDrilldownState((prev) => {
        // 같은 colKey를 다시 클릭하면 토글 off
        if (prev.open && prev.selectedColKey === selectedColKey) {
          return {
            open: false,
            selectedColKey: null,
            rowKeys: [],
            colorMap: null,
          }
        }

        return {
          open: true,
          selectedColKey,
          rowKeys: rowKeys || [],
          colorMap: seriesColorMap || null,
        }
      })
    },
    [],
  )

  const handleCloseDrilldown = useCallback(() => {
    setDrilldownState({
      open: false,
      selectedColKey: null,
      rowKeys: [],
      colorMap: null,
    })
  }, [])

  // 시간 프리셋 / 커스텀 범위 변경 시 쿼리
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

  // 필터 모달 관련 훅
  const {
    filterModal,
    openFilterForField,
    closeFilter,
    applyFilter,
    selectedValuesForModal,
    timeForFilter,
    initialTopNForModal,
  } = usePivotFilterModal({
    values,
    filters,
    timeRange,
    customRange,
    setFilters,
    runQueryNow,
  })

  // 행/열/값 모달 관련 훅
  const {
    modalState,
    openRowsModal,
    openColumnModal,
    openValuesModal,
    applyRows,
    applyColumn,
    applyValues,
    closeModal,
  } = usePivotFieldModals({
    rows,
    column,
    values,
    setRows,
    setColumnField,
    setValues,
    runQueryNow,
  })

  const { isOpen, mode, draftRows, draftColumn, draftValues } = modalState

  // DnD 핸들러 훅
  const { handleDragEndRows, handleDragEndValues } = usePivotDragHandlers({
    rows,
    setRows,
    values,
    setValues,
    runQueryNow,
  })

  // Export / Preset 훅
  const { exportChartImageMutation, exportPivotCsvMutation } = useExport(chartViewRef)
  const { savePivotPresetMutation } = usePreset()

  return (
    <>
      <div className='flex flex-col gap-4 p-4 mx-30'>
        <div className='flex items-center'>
          <PivotHeaderTabs pivotMode={pivotMode} />
        </div>

        {/* 상단 설정 영역 */}
        <section className='rounded-lg border border-gray-200 bg-white shadow-sm'>
          <div className='flex flex-row gap-6 p-5 lg:flex-row'>
            {/* 왼쪽 패널 */}
            <PivotConfigPanel
              layer={layer}
              timeRange={timeRange}
              customRange={customRange}
              isFromGrid={isFromGrid}
              onChangeLayer={(nextLayer) => {
                if (isFromGrid) return
                setLayer(nextLayer)
                runQueryNow()
              }}
              onSelectTimePreset={(value) => {
                if (isFromGrid) return
                handleSelectTimePreset(value)
              }}
              onApplyCustomRange={(fromDate, toDate) => {
                if (isFromGrid) return
                handleApplyCustomRange(fromDate, toDate)
              }}
              onPresetLoad={() => setIsPresetModalOpen(true)}
              onSavePreset={() => savePivotPresetMutation.mutate()}
            />

            <div className='hidden w-px bg-gray-200 lg:block' />

            {/* 오른쪽 패널: Column / Rows / Values */}
            <div className='flex flex-1 flex-col gap-4 lg:flex-row min-h-0 items-stretch'>
              {/* Column 카드 */}
              <div className='flex-1 flex min-h-0 h-full flex-col rounded border border-gray-200 overflow-hidden'>
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
              <div className='flex-1 flex min-h-0 h-full flex-col rounded border border-gray-200 overflow-hidden'>
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
              <div className='flex-1 flex min-h-0 h-full flex-col rounded border border-gray-200 overflow-hidden'>
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

        {/* 결과 / 차트 모드 영역 */}
        {isChartMode && (
          <section className='rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  onClick={handleToggleChart}
                  className={`relative inline-flex h-5.5 w-10.5 items-center rounded-full transition-colors ${
                    isChartMode ? 'bg-[#3877BE]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isChartMode ? 'translate-x-5.5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className='font-medium text-gray-800'>차트 모드</span>
              </div>

              <div className='flex items-center gap-1'>
                {/* 차트 이미지 다운로드 */}
                <button
                  className='rounded-md border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 font-medium text-[12px] text-gray-500 px-3 py-1 disabled:opacity-50'
                  onClick={() => exportChartImageMutation.mutate()}
                  disabled={!isChartMode || exportChartImageMutation.isPending}
                >
                  <ChartIcon className='w-4 h-4 text-[#595959]' />
                  <span>
                    {exportChartImageMutation.isPending ? '내보내는 중…' : '차트 이미지 저장'}
                  </span>
                </button>

                {/* 전체보기 (히트맵) */}
                <button
                  className='rounded-md border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 font-medium text-[12px] text-gray-500 px-3 py-1 disabled:opacity-50'
                  type='button'
                  onClick={() => {
                    if (!column?.field || !rows?.length || !values?.length) {
                      window.alert('전체보기를 사용하려면 열/행/값을 먼저 설정해주세요.')
                      return
                    }
                    setIsHeatmapOpen(true)
                  }}
                >
                  <HeatmapIcon className='w-4 h-4 text-[#595959]' />
                  <span>전체보기 (테이블 히트맵)</span>
                </button>

                {/* 차트 설정 */}
                <button
                  className='rounded-md border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 font-medium text-[12px] text-gray-500 px-3 py-1 disabled:opacity-50'
                  onClick={() => setIsConfigOpen(true)}
                >
                  <ChartSettingIcon className='w-4 h-4 text-[#595959]' />
                  <span>차트 설정</span>
                </button>
              </div>
            </div>

            {/* 실제 결과 영역 */}
            <div className='flex min-h-[400px] items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400'>
              <PivotChartView ref={chartViewRef} onChartClick={handleChartClickForDrilldown} />
            </div>

            {drilldownState.open && drilldownState.selectedColKey && (
              <DrilldownTimeSeriesPanel
                selectedColKey={drilldownState.selectedColKey}
                rowKeys={drilldownState.rowKeys}
                colorMap={drilldownState.colorMap}
                onClose={handleCloseDrilldown}
              />
            )}
          </section>
        )}

        <section className='rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            {isChartMode ? (
              <div className='flex items-center gap-3'>
                <span className='font-medium text-gray-800'>피벗 테이블</span>
              </div>
            ) : (
              <div className='flex items-center gap-3'>
                <button
                  type='button'
                  onClick={handleToggleChart}
                  className={`relative inline-flex h-5.5 w-10.5 items-center rounded-full transition-colors ${
                    isChartMode ? 'bg-[#3877BE]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isChartMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className='font-medium text-gray-800'>차트 모드</span>
              </div>
            )}
            <div className='flex items-center gap-2'>
              {/* CSV 내보내기 */}
              <button
                type='button'
                onClick={() => exportPivotCsvMutation.mutate()}
                disabled={exportPivotCsvMutation.isPending}
                className='rounded-md border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 font-medium text-[12px] text-gray-500 px-3 py-1 disabled:opacity-50'
              >
                <ExcelIcon className='w-3.5 h-3.5 text-gray-600' />
                <span>{exportPivotCsvMutation.isPending ? '내보내는 중…' : 'CSV 파일 저장'}</span>
              </button>
            </div>
            {isPivotLoading && (
              <div className='flex h-32 items-center justify-center text-xs text-gray-400'>
                로딩중...
              </div>
            )}
          </div>
          {!isPivotLoading && pivotResult ? (
            <PivotResultTable pivotResult={pivotResult} />
          ) : (
            <div className='flex h-32 items-center justify-center text-xs text-gray-400'>
              아직 조회되지 않았습니다
            </div>
          )}
        </section>
      </div>

      {/* 행 선택 모달 */}
      {isOpen && mode === 'rows' && (
        <RowSelectModal
          initialSelected={draftRows.map((r) => r.field)}
          onApplyRows={applyRows}
          onClose={closeModal}
          availableFields={isFromGrid ? gridColumns : undefined}
        />
      )}

      {/* 열 선택 모달 */}
      {isOpen && mode === 'column' && (
        <ColumnSelectModal
          initialSelected={draftColumn?.field || ''}
          onApplyColumn={applyColumn}
          onClose={closeModal}
          availableFields={isFromGrid ? gridColumns : undefined}
        />
      )}

      {/* 값 선택 모달 */}
      {isOpen && mode === 'values' && (
        <ValueSelectModal
          initialSelected={draftValues.map((v) => ({
            field: v.field,
            agg: v.agg,
          }))}
          onApplyValues={applyValues}
          onClose={closeModal}
          availableFields={isFromGrid ? gridColumns : undefined}
        />
      )}

      {/* 필터 모달 */}
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

      {/* 차트 설정 모달 */}
      {isChartConfigOpen && (
        <PivotChartConfigModal
          layer={layer}
          time={timeForFilter}
          filters={filters}
          onClose={closeChartConfig}
          onApply={handleApplyChart}
        />
      )}

      {/* 전체보기(테이블 히트맵) 모달 */}
      {isHeatmapOpen && (
        <PivotHeatmapTableModal isOpen={isHeatmapOpen} onClose={() => setIsHeatmapOpen(false)} />
      )}

      {/* 프리셋 불러오기 모달 */}
      {isPresetModalOpen && (
        <PivotPresetModal
          onClose={() => setIsPresetModalOpen(false)}
          onSelect={(preset) => {
            try {
              const modeFromPreset = preset?.config?.pivot?.mode
              console.log(preset.config)
              applyPivotPresetConfigToStore(preset.config || {})
              if (modeFromPreset === 'fromGrid' || modeFromPreset === 'free') {
                setPivotMode(modeFromPreset)
              }
              runQueryNow()
            } catch (e) {
              console.error(e)
              window.alert('프리셋 적용 중 오류가 발생했습니다.')
            } finally {
              setIsPresetModalOpen(false)
            }
          }}
        />
      )}
    </>
  )
}

export default PivotPage
