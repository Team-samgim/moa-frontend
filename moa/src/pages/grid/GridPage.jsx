import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const [columns, setColumns] = useState([])
  const [ready, setReady] = useState(false)
  const gridRef = useRef(null)
  const navigate = useNavigate()
  const [currentLayer, setCurrentLayer] = useState(null)
  const token = localStorage.getItem('accessToken')

  /** 컬럼 정보 로드 */
  useEffect(() => {
    fetch(`http://localhost:8080/api/mock-search?offset=0&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.columns) return

        const colDefs = [
          {
            headerName: 'No',
            valueGetter: (params) => params.node.rowIndex + 1,
            sortable: false,
            filter: false,
            resizable: true,
            cellStyle: {
              textAlign: 'center',
              padding: '0px',
              backgroundColor: '#fafafa',
              color: '#555',
            },
            headerClass: 'no-column-header',
          },

          ...data.columns.map((col) => ({
            field: col,
            sortable: true,
            filter: true,
            resizable: true,
            valueFormatter: (p) =>
              typeof p.value === 'object' ? (p.value?.value ?? '') : (p.value ?? ''),
          })),
        ]
        setColumns(colDefs)
        setReady(true)
      })
      .catch((err) => console.error('컬럼 로드 오류:', err))
  }, [])

  const goToPivotPage = () => {
    navigate('/pivot', {
      state: {
        layer: currentLayer,
        columns: columns.map((c) => c.field),
        filters: {},
      },
    })
  }

  /** 무한 스크롤용 데이터소스 */
  const datasource = {
    getRows: (params) => {
      const { startRow, endRow, sortModel } = params
      const offset = startRow
      const limit = endRow - startRow

      const sortField = sortModel?.[0]?.colId || null
      const sortDirection = sortModel?.[0]?.sort || null

      let url = `http://localhost:8080/api/mock-search?offset=${offset}&limit=${limit}`
      if (sortField) url += `&sortField=${sortField}&sortDirection=${sortDirection}`

      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          const rows = data.rows || []
          const lastRow = rows.length < limit ? offset + rows.length : -1
          params.successCallback(rows, lastRow)
          if (data.layer) setCurrentLayer(data.layer)
        })
        .catch((err) => {
          console.error('데이터 로드 실패:', err)
          params.failCallback()
        })
    },
  }

  const defaultColDef = useMemo(() => ({ flex: 1, minWidth: 120 }), [])

  const onGridReady = (params) => {
    params.api.setGridOption('datasource', datasource)
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'inline-flex',
          background: '#3877BE',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '13px',
          color: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          margin: '10px 0',
        }}
      >
        {currentLayer}
      </div>

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
        <p>그리드 로딩 중</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={goToPivotPage}
          style={{
            backgroundColor: '#3877BE',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '13px',
            color: '#fff',
            cursor: 'pointer',
            transition: '0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            margin: '10px 0',
          }}
        >
          피벗 모드
        </button>
      </div>
    </div>
  )
}

export default GridPage
