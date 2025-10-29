import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import axiosInstance from '@/api/axios'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'

ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const [columns, setColumns] = useState([])
  const [ready, setReady] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const gridRef = useRef(null)
  const navigate = useNavigate()
  const [currentLayer, setCurrentLayer] = useState('ethernet')

  /** 컬럼 정보 로드 */
  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const res = await axiosInstance.get('/randering', {
          params: { offset: 0, limit: 1 },
        })
        const data = res.data
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
          },
          ...data.columns.map((col) => ({
            field: col,
            sortable: true,
            filter: CustomCheckboxFilter,
            filterParams: {
              layer: currentLayer || 'ethernet',
            },
            resizable: true,
            floatingFilter: false,
          })),
        ]
        setColumns(colDefs)
        setReady(true)
      } catch (err) {
        console.error('컬럼 로드 실패:', err)
      }
    }

    fetchColumns()
  }, [currentLayer])

  /** 무한 스크롤용 데이터소스 */
  const datasource = useMemo(
    () => ({
      getRows: async (params) => {
        const { startRow, endRow, sortModel } = params
        const offset = startRow
        const limit = endRow - startRow
        const sortField = sortModel?.[0]?.colId || null
        const sortDirection = sortModel?.[0]?.sort || null

        try {
          const query = {
            offset,
            limit,
            ...(sortField && { sortField }),
            ...(sortDirection && { sortDirection }),
          }

          if (Object.keys(activeFilters).length > 0) {
            const filterModel = {}
            Object.entries(activeFilters).forEach(([key, vals]) => {
              const arr = Array.isArray(vals) ? vals : vals.values
              if (arr && arr.length > 0) {
                filterModel[key] = { type: 'set', values: arr }
              }
            })
            if (Object.keys(filterModel).length > 0) {
              query.filterModel = JSON.stringify(filterModel)
            }
          }

          const res = await axiosInstance.get('/randering', { params: query })
          const data = res.data

          const rows = data.rows || []
          const lastRow = rows.length < limit ? offset + rows.length : -1
          params.successCallback(rows, lastRow)

          if (data.layer) setCurrentLayer(data.layer)
        } catch (err) {
          console.error('데이터 로드 실패:', err)
          params.failCallback()
        }
      },
    }),
    [activeFilters],
  )

  /** 필터 적용 시 데이터 다시 로드 */
  useEffect(() => {
    if (!ready) return
    const api = gridRef.current?.api
    if (api) {
      api.refreshInfiniteCache()
    }
  }, [activeFilters, ready])

  const defaultColDef = useMemo(() => ({ flex: 1, minWidth: 120 }), [])

  const onGridReady = (params) => {
    params.api.setGridOption('datasource', datasource)
  }

  /** 필터 초기화 버튼 클릭 */
  const resetFilters = () => {
    const api = gridRef.current?.api
    if (api) {
      api.setFilterModel(null)
      api.refreshInfiniteCache()
    }
    setActiveFilters({})
  }

  /** 피벗 이동 */
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
    <div style={{ padding: '20px' }}>
      {/* 상단 영역 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '10px 0 15px',
        }}
      >
        {/* 현재 레이어 */}
        <div
          style={{
            display: 'inline-flex',
            background: '#3877BE',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            color: '#fff',
            fontWeight: 500,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {currentLayer}
        </div>

        {/* 필터 초기화 버튼 */}
        <button
          onClick={resetFilters}
          style={{
            backgroundColor: '#fff',
            color: '#3877BE',
            border: '1px solid #3877BE',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          필터 초기화
        </button>
      </div>

      {/* 그리드 */}
      {ready ? (
        <div className='ag-theme-quartz' style={{ height: '80vh', width: '100%' }}>
          <AgGridReact
            key={JSON.stringify(activeFilters)} // 중요: 리렌더링 강제
            ref={gridRef}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            rowModelType='infinite'
            cacheBlockSize={100}
            maxBlocksInCache={2}
            animateRows={true}
            pagination={false}
            onGridReady={onGridReady}
            context={{
              updateFilter: (field, values) => {
                setActiveFilters((prev) => ({
                  ...prev,
                  [field]: { values },
                }))
              },
              currentLayer,
              activeFilters,
            }}
          />
        </div>
      ) : (
        <p>그리드 로딩 중...</p>
      )}

      {/* 피벗 이동 버튼 */}
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
