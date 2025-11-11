import { memo, useMemo, useRef, useCallback } from 'react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

// AG Grid 모듈 등록: 컴포넌트 로드 시 1회 (중복 호출되어도 안전)
ModuleRegistry.registerModules([AllCommunityModule])

const PreviewGrid = ({ rows = [], columns = [], height = 360 }) => {
  const gridRef = useRef(null)

  const columnDefs = useMemo(
    () =>
      columns.map((c) => ({
        field: c,
        headerName: c,
        sortable: false,
        filter: false,
        resizable: true,
        valueFormatter: (p) => (p.value === null ? '' : String(p.value)),
      })),
    [columns],
  )

  const defaultColDef = useMemo(
    () => ({
      minWidth: 120,
      resizable: true,
      tooltipValueGetter: (p) => (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  const sizeFit = useCallback((api) => {
    if (api && typeof api.sizeColumnsToFit === 'function') {
      api.sizeColumnsToFit()
    }
  }, [])

  const onGridReady = useCallback((params) => sizeFit(params.api), [sizeFit])
  const onFirstDataRendered = useCallback((params) => sizeFit(params.api), [sizeFit])

  return (
    <div className='ag-theme-quartz w-full' style={{ height }}>
      <AgGridReact
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType='clientSide'
        suppressMovableColumns={true}
        suppressCellFocus={true}
        rowSelection={false}
        animateRows={false}
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
      />
    </div>
  )
}

export default memo(PreviewGrid)
