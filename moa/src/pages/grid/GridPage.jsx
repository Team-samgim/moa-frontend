import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
import useActiveFilters from '@/hooks/grid/useActiveFilters'
import useColumnsQuery from '@/hooks/grid/useColumnsQuery'
import useInfiniteDatasource from '@/hooks/grid/useInfiniteDatasource'
import GridToolbar from '@/pages/grid/GridToolbar'
import { formatUtcToSeoul } from '@/utils/dateFormat'

ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const gridRef = useRef(null)
  const navigate = useNavigate()
  const [currentLayer] = useState('ethernet')
  const [filterResetKey, setFilterResetKey] = useState(0)

  const { activeFilters, activeFiltersRef, updateFilter, setActiveFilters } = useActiveFilters()
  const datasource = useInfiniteDatasource({ currentLayer, activeFiltersRef })
  const { data: cols = [], isLoading } = useColumnsQuery(currentLayer)

  const columns = useMemo(
    () => [
      {
        headerName: 'No',
        valueGetter: (p) => p.node.rowIndex + 1,
        width: 80,
        resizable: true,
        filter: false,
        cellStyle: {
          textAlign: 'center',
          padding: '0px',
          backgroundColor: '#fafafa',
          color: '#555',
        },
      },
      ...cols.map((col, idx) => {
        const isDate = col.type === 'date'
        return {
          field: col.name,
          colId: `${col.name}-${col.type}-${idx}`,
          sortable: true,
          filter: CustomCheckboxFilter,
          filterParams: { layer: currentLayer, type: col.type },
          resizable: true,
          floatingFilter: false,
          ...(isDate && { valueFormatter: ({ value }) => formatUtcToSeoul(value) }),
        }
      }),
    ],
    [cols, currentLayer],
  )

  const onGridReady = (p) => p.api.setGridOption('datasource', datasource)

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
    setFilterResetKey((v) => v + 1)
  }

  const goToPivotPage = () =>
    navigate('/pivot', {
      state: { layer: currentLayer, columns: columns.map((c) => c.field), filters: activeFilters },
    })

  return (
    <div className='p-5'>
      <GridToolbar currentLayer={currentLayer} onReset={resetFilters} onPivot={goToPivotPage} />

      {isLoading ? (
        <p className='text-sm text-gray-500'>그리드 로딩 중...</p>
      ) : (
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
            context={{
              updateFilter,
              getActiveFilters: () => activeFiltersRef.current,
              getApi: () => gridRef.current?.api,
              activeFilters,
            }}
          />
        </div>
      )}
    </div>
  )
}

export default GridPage
