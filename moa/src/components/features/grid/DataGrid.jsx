import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
import { formatUtcToSeoul } from '@/utils/dateFormat'
import { pickFormatterByField } from '@/utils/numFormat'

ModuleRegistry.registerModules([AllCommunityModule])

const DataGrid = forwardRef(function DataGrid(
  {
    layer,
    columns = [], // 서버가 준 컬럼 메타 [{name,type,labelKo}]
    colDefs: colDefsProp, // (선택) 이미 완성된 colDefs를 직접 주입하면 이걸 우선 사용
    rows = [], // clientSide 모드일 때만 사용
    viewKeys,
    height = '70vh',
    // 🔹 아래부터 신규 옵션: infinite 모드용
    rowModelType = 'clientSide', // 'clientSide' | 'infinite'
    datasource, // infinite 모드일 때 주입
    gridContext, // CustomCheckboxFilter가 쓰는 context
    cacheBlockSize = 100, // infinite 페이지 크기
    onFilterOpened, // 필터 열림 이벤트 전달
    onGridReady: onGridReadyProp, // 외부에서 받고 싶을 때
  },
  ref,
) {
  const gridRef = useRef(null)
  const [columnDefs, setColumnDefs] = useState([])

  useImperativeHandle(ref, () => ({
    purge: () => gridRef.current?.api?.purgeInfiniteCache?.(),
    refresh: () => gridRef.current?.api?.refreshInfiniteCache?.(),
    setFilterModel: (m) => gridRef.current?.api?.setFilterModel?.(m),
    api: () => gridRef.current?.api,
  }))

  // ✅ 프롭으로 받은 columns로 컬럼 정의
  useEffect(() => {
    if (Array.isArray(colDefsProp) && colDefsProp.length > 0) {
      setColumnDefs(colDefsProp)
      return
    }
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
            filterParams: { layer, type: col.type, pageLimit: 50, debounceMs: 400 },
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
  }, [columns, colDefsProp, viewKeys, layer])

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      tooltipValueGetter: (p) => p?.valueFormatted ?? (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  const handleGridReady = (params) => {
    if (rowModelType === 'infinite' && datasource) {
      params.api.setGridOption('datasource', datasource)
    }
    onGridReadyProp?.(params)
  }

  return (
    <div className='ag-theme-quartz w-full' style={{ height }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType={rowModelType}
        rowData={rowModelType === 'clientSide' ? rows : undefined}
        cacheBlockSize={cacheBlockSize}
        context={gridContext}
        onFilterOpened={onFilterOpened}
        onGridReady={handleGridReady}
        animateRows={true}
        suppressMaintainUnsortedOrder={true}
      />
    </div>
  )
})

export default DataGrid
