import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { fetchColumns } from '@/components/features/grid/gridService'
import useActiveFilters from '@/hooks/grid/useActiveFilters'
import useInfiniteDatasource from '@/hooks/grid/useInfiniteDatasource'
import GridToolbar from '@/pages/grid/GridToolbar'
import CustomCheckboxFilter from '@/pages/grid/filters/CustomCheckboxFilter'
import { formatUtcToSeoul } from '@/utils/dateFormat'

ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const [columns, setColumns] = useState([])
  const [ready, setReady] = useState(false)
  const gridRef = useRef(null)
  const navigate = useNavigate()
  const [currentLayer] = useState('ethernet')
  const [filterResetKey, setFilterResetKey] = useState(0)

  const { activeFilters, activeFiltersRef, updateFilter, setActiveFilters } = useActiveFilters()
  const datasource = useInfiniteDatasource({ currentLayer, activeFiltersRef })

  useEffect(() => {
    const run = async () => {
      try {
        const data = await fetchColumns({ layer: currentLayer, offset: 0, limit: 1 })
        if (!data?.columns) return
        const colDefs = [
          {
            headerName: 'No',
            valueGetter: (params) => params.node.rowIndex + 1,
            resizable: true,
            cellStyle: {
              textAlign: 'center',
              padding: '0px',
              backgroundColor: '#fafafa',
              color: '#555',
            },
            width: 80,
          },
          ...data.columns.map((col, idx) => {
            const isDate = col.type === 'date'
            return {
              field: col.name,
              colId: `${col.name}-${col.type}-${idx}`,
              sortable: true,
              filter: CustomCheckboxFilter,
              filterParams: { layer: currentLayer || 'ethernet', type: col.type },
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
      } catch (err) {
        console.error('컬럼 로드 실패:', err)
      }
    }
    run()
  }, [currentLayer])

  const gridContext = useMemo(
    () => ({
      updateFilter,
      getActiveFilters: () => activeFiltersRef.current,
      getApi: () => gridRef.current?.api,
      activeFilters,
    }),
    [],
  )

  const onGridReady = (params) => {
    params.api.setGridOption('datasource', datasource)
  }

  useEffect(() => {
    gridRef.current?.api?.refreshInfiniteCache?.()
  }, [activeFilters])

  const defaultColDef = useMemo(() => ({ flex: 1, minWidth: 120 }), [])

  const resetFilters = () => {
    const api = gridRef.current?.api
    if (api) {
      api.setFilterModel(null)
      api.refreshInfiniteCache()
    }
    setActiveFilters({})
    setFilterResetKey((prev) => prev + 1)
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
      <GridToolbar currentLayer={currentLayer} onReset={resetFilters} onPivot={goToPivotPage} />

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
          />
        </div>
      ) : (
        <p className='text-sm text-gray-500'>그리드 로딩 중...</p>
      )}

      <div className='mt-2 flex justify-end'>
        <button
          onClick={goToPivotPage}
          className='my-2 rounded-md bg-[#3877BE] px-2.5 py-1 text-[13px] text-white shadow-sm transition hover:shadow'
        >
          피벗 모드
        </button>
      </div>
    </div>
  )
}

export default GridPage
