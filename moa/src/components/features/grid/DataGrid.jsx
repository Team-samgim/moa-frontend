import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
import { formatUtcToSeoul } from '@/utils/dateFormat'
import { pickFormatterByField } from '@/utils/numFormat'

ModuleRegistry.registerModules([AllCommunityModule])

const DataGrid = forwardRef(function DataGrid(
  { layer, columns = [], rows = [], viewKeys, height = '70vh' },
  ref,
) {
  const gridRef = useRef(null)
  const [columnDefs, setColumnDefs] = useState([])

  useImperativeHandle(ref, () => ({
    purge: () => gridRef.current?.api?.purgeInfiniteCache?.(),
    refresh: () => gridRef.current?.api?.refreshInfiniteCache?.(),
    setFilterModel: (m) => gridRef.current?.api?.setFilterModel?.(m),
  }))

  // ✅ 프롭으로 받은 columns로 컬럼 정의
  useEffect(() => {
    const src = Array.isArray(columns) ? columns : []
    const fieldsToShow = viewKeys?.length ? viewKeys : src.map((c) => c.name)

    const defs = [
      {
        headerName: 'No',
        field: '__rowNo',
        valueGetter: (p) => (p.node.rowPinned ? (p.data?.__label ?? '') : p.node.rowIndex + 1),
        width: 80,
        resizable: true,
        filter: false,
        cellStyle: { textAlign: 'center' },
      },
      ...src
        .filter((c) => fieldsToShow.includes(c.name))
        .map((col, idx) => {
          const isDate = col.type === 'date'
          const isNumber = col.type === 'number'
          const vf = isNumber ? pickFormatterByField(col.name) : null
          return {
            field: col.name,
            headerName: col.labelKo || col.name,
            colId: `${col.name}-${col.type}-${idx}`,
            sortable: true,
            filter: CustomCheckboxFilter,
            filterParams: { layer, type: col.type, pageLimit: 200, debounceMs: 250 },
            resizable: true,
            floatingFilter: false,
            ...(isDate && { valueFormatter: ({ value }) => formatUtcToSeoul(value) }),
            ...(isNumber && {
              valueFormatter: ({ value }) => (value === null ? '' : vf(Number(value))),
              cellClass: 'ag-right-aligned-cell',
            }),
          }
        }),
    ]
    setColumnDefs(defs)
  }, [columns, viewKeys, layer])

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      tooltipValueGetter: (p) => p?.valueFormatted ?? (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  return (
    <div className='ag-theme-quartz w-full' style={{ height }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType='clientSide'
        rowData={rows}
        animateRows={true}
        suppressMaintainUnsortedOrder={true}
      />
    </div>
  )
})

export default DataGrid
