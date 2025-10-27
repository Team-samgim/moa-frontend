import React, { useEffect, useState, useMemo, useRef } from 'react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

// 모든 커뮤니티 모듈 등록 (정렬/필터/무한스크롤 포함)
ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const [columns, setColumns] = useState([])
  const [ready, setReady] = useState(false)
  const gridRef = useRef(null)
  const layer = 'http_page'

  /** 1️⃣ 컬럼 정보 로드 */
  useEffect(() => {
    fetch(`http://localhost:8080/api/mock-search?layer=${layer}&offset=0&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        const colDefs = data.columns.map((col) => ({
          field: col,
          sortable: true,
          filter: true,
          resizable: true,
          valueFormatter: (p) =>
            typeof p.value === 'object' ? (p.value?.value ?? '') : (p.value ?? ''),
        }))
        setColumns(colDefs)
        setReady(true)
      })
      .catch((err) => console.error('컬럼 로드 오류:', err))
  }, [])

  /** 2️⃣ 무한 스크롤용 데이터소스 */
  const datasource = {
    getRows: (params) => {
      const { startRow, endRow, sortModel } = params
      const offset = startRow
      const limit = endRow - startRow

      const sortField = sortModel?.[0]?.colId || null
      const sortDirection = sortModel?.[0]?.sort || null

      let url = `http://localhost:8080/api/mock-search?layer=${layer}&offset=${offset}&limit=${limit}`
      if (sortField) url += `&sortField=${sortField}&sortDirection=${sortDirection}`

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const rows = data.rows || []
          const lastRow = rows.length < limit ? offset + rows.length : -1
          params.successCallback(rows, lastRow)
        })
        .catch((err) => {
          console.error('데이터 로드 실패:', err)
          params.failCallback()
        })
    },
  }

  const defaultColDef = useMemo(() => ({ flex: 1, minWidth: 120 }), [])

  /** 3️⃣ 그리드 초기화 */
  const onGridReady = (params) => {
    gridRef.current = params.api
    // 최신 버전에서는 setDatasource() 대신 setGridOption() 사용
    params.api.setGridOption('datasource', datasource)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '10px' }}>검색 결과</h2>

      {ready ? (
        <div className='ag-theme-quartz' style={{ height: '80vh', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            rowModelType='infinite'
            cacheBlockSize={100}
            maxBlocksInCache={2}
            animateRows={true}
            pagination={false}
            onGridReady={onGridReady}
          />
        </div>
      ) : (
        <p>그리드 초기화 중...</p>
      )}
    </div>
  )
}

export default GridPage
