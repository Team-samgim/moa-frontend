/**
 * PreviewGrid
 *
 * AG Grid 기반 CSV 미리보기 전용 그리드 컴포넌트.
 *
 * 특징:
 * - 서버에서 받은 rows(columns 기반 JSON 배열)를 표 형태로 렌더링
 * - 컬럼 자동 사이즈 조정(sizeColumnsToFit)
 * - 정렬/필터/이동 불가로 구성해 "정적 미리보기"에 최적화
 * - tooltipValueGetter로 널/문자 처리 안정화
 *
 * Props:
 * - rows: 데이터 배열 [{}, {}, ...]
 * - columns: 컬럼 이름 배열 ["col1", "col2", ...]
 * - height: 그리드 높이
 *
 * AUTHOR: 방대혁
 */

import { memo, useMemo, useRef, useCallback } from 'react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

// AG Grid 모듈 등록 (중복 호출되어도 안전하지만 파일 단 한 번 실행됨)
ModuleRegistry.registerModules([AllCommunityModule])

const PreviewGrid = ({ rows = [], columns = [], height = 360 }) => {
  const gridRef = useRef(null)

  /**
   * 컬럼 정의
   * - valueFormatter: null → 빈 문자열 처리
   * - resizable, tooltip 모두 활성화
   */
  const columnDefs = useMemo(
    () =>
      columns.map((c) => ({
        field: c,
        headerName: c,
        sortable: false, // 미리보기이므로 정렬은 비활성화
        filter: false, // 필터 비활성화
        resizable: true,
        valueFormatter: (p) => (p.value === null ? '' : String(p.value)),
      })),
    [columns],
  )

  /**
   * 모든 컬럼에 공통 적용되는 설정
   */
  const defaultColDef = useMemo(
    () => ({
      minWidth: 120,
      resizable: true,
      tooltipValueGetter: (p) => (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  /**
   * 컬럼 자동 너비 맞춤
   */
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
        suppressMovableColumns={true} // 컬럼 드래그 이동 비활성화
        suppressCellFocus={true} // 셀 포커스 아웃라인 제거
        rowSelection={false} // 미리보기이므로 선택 비활성화
        animateRows={false} // 성능상 비활성화
        onGridReady={onGridReady}
        onFirstDataRendered={onFirstDataRendered}
      />
    </div>
  )
}

export default memo(PreviewGrid)
