import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { fetchColumns } from '@/api/grid'
import AggregatesPanel5 from '@/components/features/grid/AggregatesPanel'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
import useActiveFilters from '@/hooks/grid/useActiveFilters'
import useAggregateQuery from '@/hooks/grid/useAggregateQuery'
import useInfiniteDatasource from '@/hooks/grid/useInfiniteDatasource'
import GridToolbar from '@/pages/grid/GridToolbar'
import { formatUtcToSeoul } from '@/utils/dateFormat'
import { makeFilterModel } from '@/utils/makeFilterModel'

ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const [columns, setColumns] = useState([])
  const [ready, setReady] = useState(false)
  const [filterResetKey, setFilterResetKey] = useState(0)
  const [currentLayer] = useState('ethernet')
  const [gridApis, setGridApis] = useState(null)

  const gridRef = useRef(null)
  const navigate = useNavigate()

  // 필터 상태 훅
  const { activeFilters, activeFiltersRef, updateFilter, setActiveFilters } = useActiveFilters()

  // 무한 스크롤 데이터소스
  const datasource = useInfiniteDatasource({ currentLayer, activeFiltersRef })

  // 컬럼 로드
  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchColumns({ layer: currentLayer, offset: 0, limit: 1 })
        if (!data?.columns) return

        const colDefs = [
          {
            headerName: 'No',
            field: '__rowNo',
            valueGetter: (p) => (p.node.rowPinned ? (p.data?.__label ?? '') : p.node.rowIndex + 1),
            width: 80,
            resizable: true,
            filter: false,
            cellStyle: {
              textAlign: 'center',
            },
          },
          ...data.columns.map((col, idx) => {
            const isDate = col.type === 'date'
            return {
              field: col.name,
              colId: `${col.name}-${col.type}-${idx}`,
              sortable: true,
              filter: CustomCheckboxFilter, // ✅ 커스텀 필터 그대로 사용
              filterParams: { layer: currentLayer, type: col.type },
              resizable: true,
              floatingFilter: false,
              ...(isDate && {
                valueFormatter: ({ value }) => formatUtcToSeoul(value),
              }),
            }
          }),
        ]

        setColumns(colDefs)
        setReady(true)
      } catch (e) {
        console.error('컬럼 로드 실패:', e)
      }
    }
    run()
  }, [currentLayer])

  // grid context (필터 업데이트/조회, api 접근)
  const gridContext = useMemo(
    () => ({
      updateFilter,
      getActiveFilters: () => activeFiltersRef.current,
      getApi: () => gridRef.current?.api,
      activeFilters,
    }),
    [],
  )

  // 데이터소스 등록
  const onGridReady = (params) => {
    params.api.setGridOption('datasource', datasource)
    setGridApis({ api: params.api, columnApi: params.columnApi }) // columnApi 없어도 위에서 폴백 처리함
  }

  // 필터 변경 시 캐시 리프레시
  useEffect(() => {
    gridRef.current?.api?.refreshInfiniteCache?.()
  }, [activeFilters])

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      tooltipValueGetter: (p) => (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  // ✅ 집계용 필터 모델
  const filterModelObj = useMemo(() => makeFilterModel(activeFilters), [activeFilters])

  // ✅ 집계 쿼리 (date는 훅 내부에서 스킵)
  const { data: aggData, isFetching: aggLoading } = useAggregateQuery({
    layer: currentLayer,
    filterModel: filterModelObj,
    columns,
  })

  // (선택) pinned row 스타일 강조
  const getRowStyle = (params) => {
    if (params.node.rowPinned) {
      return {
        background: '#F8FAFF',
        fontWeight: 500,
        color: '#1f2937',
        borderTop: '1px solid #e5e7eb',
      }
    }
    return null
  }

  // 필터 초기화
  const resetFilters = () => {
    const api = gridRef.current?.api
    if (api) {
      api.setFilterModel(null)
      api.refreshInfiniteCache()
    }
    setActiveFilters({})
    setFilterResetKey((v) => v + 1)
  }

  const goToPivotPage = () => {
    navigate('/pivot', {
      state: {
        layer: currentLayer,
        columns: columns.map((c) => c.field),
        filters: activeFilters,
      },
    })
  }

  return (
    <div className='p-5'>
      <GridToolbar
        currentLayer={currentLayer}
        onReset={resetFilters}
        onPivot={goToPivotPage}
        gridApis={gridApis}
        getActiveFilters={gridContext.getActiveFilters}
      />
      {ready ? (
        <div className='ag-theme-quartz h-[80vh] w-full'>
          <AgGridReact
            key={filterResetKey}
            ref={gridRef}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            rowModelType='infinite'
            cacheBlockSize={100}
            animateRows={true}
            suppressMaintainUnsortedOrder={true}
            onGridReady={onGridReady}
            context={gridContext}
            getRowStyle={getRowStyle}
          />
        </div>
      ) : (
        <p className='text-sm text-gray-500'>그리드 로딩 중...</p>
      )}
      <AggregatesPanel5 columns={columns} aggregates={aggData?.aggregates} loading={aggLoading} />
    </div>
  )
}

export default GridPage
