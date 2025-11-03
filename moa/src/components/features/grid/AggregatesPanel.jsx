import React, { useMemo, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { fmtAggCell5 } from '@/utils/aggFormat'

/**
 * 아래쪽 집계 전용 AG Grid (5행 고정)
 * - columns: 메인 그리드 columnDefs (그대로 재사용)
 * - aggregates: { [field]: {...} } 집계 결과
 */
const AggregatesGrid = ({ columns = [], aggregates = {} }) => {
  const gridRef = useRef(null)

  // 메인 컬럼에서 날짜(type==='date')는 제외(값이 공란이므로 표시해도 무방)
  const colDefs = useMemo(() => {
    if (!columns?.length) return []

    // 첫 열: '집계' 라벨
    const first = {
      headerName: '집계',
      field: '__label',
      width: 80,
      pinned: 'left',
      sortable: false,
      filter: false,
      resizable: true,
      cellStyle: {
        color: '#374151',
      },
    }

    // 나머지 열: 메인 컬럼과 동일 (정렬/필터는 OFF, 스타일만 축소)
    const rest = columns
      .filter((c) => !!c.field && c.field !== '__rowNo' && c.headerName !== 'No')
      .map((c) => ({
        field: c.field,
        headerName: c.headerName || c.field,
        sortable: false,
        filter: false,
        resizable: true,
        // 집계표는 작은 폰트/줄간격
        cellStyle: {
          // text_Align: 'center',
        },
      }))

    return [first, ...rest]
  }, [columns])

  // 5행 집계 데이터 생성
  const rowData = useMemo(() => fmtAggCell5(columns, aggregates), [columns, aggregates])

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      tooltipValueGetter: (p) => (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  return (
    <section className='mt-4'>
      <div className='ag-theme-quartz w-full'>
        <AgGridReact
          ref={gridRef}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          rowData={rowData}
          domLayout='autoHeight' // 내용만큼 높이
          suppressCellFocus={true}
          suppressDragLeaveHidesColumns={true}
          // 집계 그리드는 읽기 전용
          suppressMovableColumns={true}
          suppressMenuHide={true}
        />
      </div>
    </section>
  )
}
export default AggregatesGrid
