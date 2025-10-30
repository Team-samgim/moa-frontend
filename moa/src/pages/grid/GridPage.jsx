import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import axiosInstance from '@/api/axios'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
dayjs.extend(utc)
dayjs.extend(timezone)

ModuleRegistry.registerModules([AllCommunityModule])

const GridPage = () => {
  const [columns, setColumns] = useState([])
  const [ready, setReady] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const gridRef = useRef(null)
  const navigate = useNavigate()
  const [currentLayer] = useState('ethernet')
  const [filterResetKey, setFilterResetKey] = useState(0)

  // ✅ 최신 필터 상태를 보관하는 ref (stale 방지)
  const activeFiltersRef = useRef(activeFilters)
  useEffect(() => {
    activeFiltersRef.current = activeFilters
  }, [activeFilters])

  /** ✅ 컬럼 정보 로드 */
  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const res = await axiosInstance.get('/randering', {
          params: { layer: currentLayer, offset: 0, limit: 1 },
        })
        const data = res.data
        if (!data?.columns) return

        // 컬럼 매핑할 때(type === 'date')만 포매터 부여
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
                // 원본은 UTC로 저장된 'timestamp without time zone'
                valueFormatter: ({ value }) =>
                  value ? dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss') : '',
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
    fetchColumns()
  }, [currentLayer])

  /** ✅ 처음부터 넘길 context (참조 고정) */
  const gridContext = useMemo(
    () => ({
      updateFilter: (field, filterData) => {
        setActiveFilters((prev) => {
          const next = { ...prev }
          if (!filterData) delete next[field]
          else next[field] = filterData
          return next
        })
      },
      getActiveFilters: () => activeFiltersRef.current, // 항상 최신
      getApi: () => gridRef.current?.api, // 항상 최신
    }),
    [],
  )

  /** ✅ datasource: 호출 시점마다 ref에서 최신 필터 읽음 */
  const createDatasource = () => ({
    getRows: async (params) => {
      const { startRow, endRow, sortModel } = params
      const offset = startRow
      const limit = endRow - startRow
      const sortField = sortModel?.[0]?.colId?.split('-')[0] || null
      const sortDirection = sortModel?.[0]?.sort || null

      const query = { layer: currentLayer, offset, limit }
      if (sortField) query.sortField = sortField
      if (sortDirection) query.sortDirection = sortDirection

      const af = activeFiltersRef.current || {}
      if (Object.keys(af).length > 0) {
        const filterModel = {}
        Object.entries(af).forEach(([key, filter]) => {
          if (!filter) return
          if (filter.mode === 'checkbox') {
            filterModel[key] = { mode: 'checkbox', values: filter.values || [] }
          } else if (filter.mode === 'condition') {
            filterModel[key] = {
              mode: 'condition',
              type: filter.type || 'string',
              conditions: filter.conditions || [],
              logicOps: filter.logicOps || [],
            }
          }
        })
        query.filterModel = JSON.stringify(filterModel)
      }

      try {
        const res = await axiosInstance.get('/randering', { params: query })
        const data = res.data
        const rows = data.rows || []
        const lastRow = rows.length < limit ? offset + rows.length : -1
        params.successCallback(rows, lastRow)
      } catch (err) {
        console.error('데이터 로드 실패:', err)
        params.failCallback()
      }
    },
  })

  /** ✅ 최초 onGridReady 시 datasource 등록 */
  const onGridReady = (params) => {
    params.api.setGridOption('datasource', createDatasource())
  }

  /** ✅ 필터 변경 시 캐시 리프레시만 (데이터소스는 ref로 최신값을 읽음) */
  useEffect(() => {
    gridRef.current?.api?.refreshInfiniteCache?.()
  }, [activeFilters])

  const defaultColDef = useMemo(() => ({ flex: 1, minWidth: 120 }), [])

  /** ✅ 필터 초기화 */
  const resetFilters = () => {
    const api = gridRef.current?.api
    if (api) {
      api.setFilterModel(null) // ag-grid 내부 필터 모델(우리는 커스텀) 초기화
      api.refreshInfiniteCache()
    }
    setActiveFilters({})
    setFilterResetKey((prev) => prev + 1)
  }

  /** ✅ 피벗 이동 */
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
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
        <div
          style={{
            background: '#3877BE',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          {currentLayer}
        </div>
        <button
          onClick={resetFilters}
          style={{
            backgroundColor: '#fff',
            color: '#3877BE',
            border: '1px solid #3877BE',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          필터 초기화
        </button>
      </div>

      {ready ? (
        <div className='ag-theme-quartz' style={{ height: '80vh', width: '100%' }}>
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
            // ✅ 최초부터 context 주입 (중요)
            context={gridContext}
          />
        </div>
      ) : (
        <p>그리드 로딩 중...</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={goToPivotPage}
          style={{
            backgroundColor: '#3877BE',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 13,
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
