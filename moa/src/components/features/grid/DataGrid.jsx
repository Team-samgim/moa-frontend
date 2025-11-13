import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react'
import { ModuleRegistry, AllCommunityModule, InfiniteRowModelModule } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import axiosInstance from '@/api/axios'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
import { formatUtcToSeoul } from '@/utils/dateFormat'
import { buildConditionsFromActiveFilters } from '@/utils/filters'
import { pickFormatterByField } from '@/utils/numFormat'

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule])

const DataGrid = forwardRef(function DataGrid(
  {
    layer,
    columns = [],
    basePayload,
    height = '70vh',
    cacheBlockSize = 100,
    onGridApis,
    onActiveFiltersChange,
    onRowClick,
  },
  ref,
) {
  const gridRef = useRef(null)
  const [columnDefs, setColumnDefs] = useState([])

  // ---------- 필터 컨텍스트 ----------
  const filterOpenSubsRef = useRef(new Map())
  const [activeFilters, setActiveFilters] = useState({})
  const activeFiltersRef = useRef(activeFilters)
  useEffect(() => {
    activeFiltersRef.current = activeFilters
    if (typeof onActiveFiltersChange === 'function') {
      onActiveFiltersChange(activeFilters)
    }
  }, [activeFilters])

  const subscribeFilterMenuOpen = (field, cb) => {
    const m = filterOpenSubsRef.current
    const list = m.get(field) || []
    m.set(field, [...list, cb])
    return () => {
      const cur = filterOpenSubsRef.current.get(field) || []
      filterOpenSubsRef.current.set(
        field,
        cur.filter((fn) => fn !== cb),
      )
    }
  }

  const onSortChanged = useCallback((e) => {
    const api = e.api
    // 정렬이 변경되면 캐시를 비우고 datasource가 새로 요청하도록 함
    console.log('[DataGrid] 🔄 정렬 변경 감지, 데이터 다시 불러옵니다.')
    api.purgeInfiniteCache()
  }, [])

  const updateFilter = (field, newFilter) => {
    setActiveFilters((prev) => {
      const next = { ...prev }
      if (!newFilter) delete next[field]
      else next[field] = newFilter
      return next
    })
  }

  const basePayloadRef = useRef(basePayload)
  useEffect(() => {
    basePayloadRef.current = basePayload
  }, [basePayload])

  const gridContextRef = useRef({
    updateFilter: (field, newFilter) => updateFilter(field, newFilter),
    getActiveFilters: () => activeFiltersRef.current,
    getApi: () => gridRef.current?.api,
    subscribeFilterMenuOpen,
    getOrder: () => {
      const api = gridRef.current?.api
      const sortModel = api?.getSortModel?.() || []
      if (sortModel.length > 0) {
        const sm = sortModel[0]
        const def = api.getColumnDef(sm.colId)
        const field = def?.field || sm.colId
        return { orderBy: field, order: (sm.sort || 'desc').toUpperCase() }
      }
      return {
        orderBy: basePayloadRef.current?.options?.orderBy || 'ts_server_nsec',
        order: (basePayloadRef.current?.options?.order || 'DESC').toUpperCase(),
      }
    },
    getBasePayload: () => basePayloadRef.current,
  })

  useImperativeHandle(ref, () => ({
    purge: () => gridRef.current?.api?.purgeInfiniteCache?.(),
    refresh: () => gridRef.current?.api?.refreshInfiniteCache?.(),
    setFilterModel: (m) => gridRef.current?.api?.setFilterModel?.(m),
    getApi: () => gridRef.current?.api,
    getActiveFilters: () => activeFiltersRef.current,
    resetFilters: () => {
      const api = gridRef.current?.api
      // AG Grid 필터 UI 초기화
      api?.setFilterModel?.(null)
      // 내부 상태 초기화
      setActiveFilters({})
      // 데이터 리로드
      api?.purgeInfiniteCache?.()
      if (typeof onActiveFiltersChange === 'function') onActiveFiltersChange({})
    },
  }))

  // {type,value} 안전 언랩
  const unwrapGetter = useCallback(
    (field) => (p) => {
      const v = p?.data?.[field]
      return v && typeof v === 'object' && 'value' in v ? v.value : v
    },
    [],
  )

  // 컬럼 정의
  useEffect(() => {
    const src = Array.isArray(columns) ? columns : []
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
      ...src.map((col) => {
        const isDate = col.type === 'date'
        const isNumber = col.type === 'number'
        const vf = isNumber ? pickFormatterByField(col.name) : null
        return {
          field: col.name,
          headerName: col.labelKo || col.name,
          colId: col.name,
          sortable: true,
          filter: CustomCheckboxFilter,
          filterParams: { layer, type: col.type, pageLimit: 200, debounceMs: 250 },
          resizable: true,
          floatingFilter: false,
          valueGetter: unwrapGetter(col.name),
          ...(isDate && { valueFormatter: ({ value }) => formatUtcToSeoul(value) }),
          ...(isNumber && {
            valueFormatter: ({ value }) => (value === null ? '' : vf(Number(value))),
            cellClass: 'ag-right-aligned-cell',
          }),
        }
      }),
    ]
    setColumnDefs(defs)
  }, [columns, layer, unwrapGetter])

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 120,
      tooltipValueGetter: (p) => (p?.value === null ? '' : String(p.value)),
    }),
    [],
  )

  const conditionsFromFilters = useMemo(() => {
    const colType = Object.fromEntries((columns || []).map((c) => [c.name, c.type || 'string']))
    return buildConditionsFromActiveFilters(activeFilters, colType)
  }, [activeFilters, columns])

  // ---------- datasource (basePayload + filters + offset/limit) ----------
  const datasource = useMemo(() => {
    if (!basePayload) return null
    let requestCount = 0

    return {
      getRows: async (rq) => {
        requestCount++
        const start = rq.startRow ?? 0
        const end = rq.endRow ?? start + cacheBlockSize
        const limit = end - start

        console.log(`[DataGrid] 요청 #${requestCount}:`, {
          startRow: start,
          endRow: end,
          limit,
          message: `${start}번부터 ${end}번까지 (${limit}개 요청)`,
        })

        // ✅ 정렬 정보 가져오기 (개선)
        const sortModel = rq.sortModel || []

        let orderBy = basePayload?.options?.orderBy || 'ts_server_nsec'
        let order = (basePayload?.options?.order || 'DESC').toUpperCase()

        if (sortModel.length > 0) {
          const sm = sortModel[0]
          orderBy = sm.colId // ✅ colId를 그대로 필드로 사용 (위에서 colId=field로 통일)
          order = (sm.sort || 'desc').toUpperCase()

          console.log(`[DataGrid] 정렬 적용:`, {
            colId: sm.colId,
            extractedField: orderBy,
            order: order,
          })
        }

        const payload = {
          ...basePayload,
          conditions: [...(basePayload.conditions || []), ...conditionsFromFilters],
          options: {
            ...(basePayload.options || {}),
            orderBy,
            order,
            limit,
            offset: start,
          },
        }

        console.log(`[DataGrid] 서버 요청 payload:`, payload)

        try {
          const response = await axiosInstance.post('/grid/search', payload)
          const responseData = response.data
          const rows = responseData?.rows || []
          const total = responseData?.total

          console.log(`[DataGrid] 응답 #${requestCount}:`, {
            receivedRows: rows.length,
            total,
            orderBy,
            order,
            message: `${rows.length}개 받음, 전체 ${total}개`,
          })

          const lastRow = typeof total === 'number' ? total : undefined

          rq.successCallback(rows, lastRow)
        } catch (e) {
          console.error(`[DataGrid] 요청 #${requestCount} 실패:`, e)
          rq.failCallback()
        }
      },
    }
  }, [basePayload, conditionsFromFilters, cacheBlockSize])

  const onGridReady = useCallback(
    (params) => {
      if (datasource) {
        if (params.api.setGridOption) params.api.setGridOption('datasource', datasource)
        else if (params.api.setDatasource) params.api.setDatasource(datasource)
      }
      onGridApis?.({ api: params.api, columnApi: params.columnApi })
    },
    [datasource],
  )

  // datasource/필터 바뀌면 캐시 재생성
  useEffect(() => {
    if (gridRef.current?.api && datasource) {
      const api = gridRef.current.api
      if (api.setGridOption) api.setGridOption('datasource', datasource)
      else if (api.setDatasource) api.setDatasource(datasource)
      gridRef.current.api.purgeInfiniteCache()
    }
  }, [datasource])

  useEffect(() => {
    gridRef.current?.api?.purgeInfiniteCache?.()
  }, [activeFilters])

  const popupParent = typeof window !== 'undefined' ? document.body : undefined

  const onFilterOpened = (e) => {
    const field = e?.column?.getColDef?.()?.field
    if (!field) return
    const subs = filterOpenSubsRef.current.get(field) || []
    subs.forEach((fn) => {
      if (typeof fn === 'function') fn()
    })
  }

  return (
    <div className='ag-theme-quartz w-full' style={{ height }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType='infinite'
        cacheBlockSize={cacheBlockSize}
        maxBlocksInCache={10}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        infiniteInitialRowCount={1}
        animateRows={true}
        suppressMaintainUnsortedOrder={true}
        onGridReady={onGridReady}
        context={gridContextRef.current}
        onSortChanged={onSortChanged}
        popupParent={popupParent}
        onFilterOpened={onFilterOpened}
        onRowClicked={(e) => {
          // 무한 스크롤 모델에서도 e.data 사용 가능
          console.log('[row]', e.data)

          onRowClick?.(e.data)
        }}
      />
    </div>
  )
})

export default DataGrid
