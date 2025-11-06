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
import { pickFormatterByField } from '@/utils/numFormat'

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule])

const TYPE_TO_DATATYPE = {
  string: 'TEXT',
  number: 'NUMBER',
  ip: 'IP',
  date: 'DATETIME',
  boolean: 'BOOLEAN',
  mac: 'TEXT',
}

function toNumberIfNeeded(arr, type) {
  if (type !== 'number') return arr
  return arr.map((v) => (v === '' || v === null ? null : Number(v)))
}

function mapConditionOp(op, fieldType) {
  const isNumber = fieldType === 'number'
  switch (op) {
    // 문자열 계열
    case 'contains':
      return isNumber ? 'EQ' : 'LIKE'
    case 'startsWith':
      return isNumber ? 'EQ' : 'STARTS_WITH'
    case 'endsWith':
      return isNumber ? 'EQ' : 'ENDS_WITH'

    // 동등
    case 'equals':
    case '=':
      return 'EQ'

    // 부등/비교
    case 'ne':
      return 'NE'
    case '>':
      return 'GT'
    case '>=':
      return 'GTE'
    case '<':
      return 'LT'
    case '<=':
      return 'LTE'

    // 범위
    case 'between':
      return 'BETWEEN'

    // 날짜 전/후 (SearchExecuteService.datetimeTpl 지원셋에 맞춤)
    case 'before':
      return 'LT' // 기준점보다 이전
    case 'after':
      return 'GTE' // 기준점 이상

    default:
      return isNumber ? 'EQ' : 'LIKE'
  }
}

const DataGrid = forwardRef(function DataGrid(
  { layer, columns = [], basePayload, height = '70vh', cacheBlockSize = 100 },
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

  const gridContext = useMemo(
    () => ({
      updateFilter,
      getActiveFilters: () => activeFiltersRef.current,
      getApi: () => gridRef.current?.api,
      activeFilters,
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
    }),
    [activeFilters],
  )

  useImperativeHandle(ref, () => ({
    purge: () => gridRef.current?.api?.purgeInfiniteCache?.(),
    refresh: () => gridRef.current?.api?.refreshInfiniteCache?.(),
    setFilterModel: (m) => gridRef.current?.api?.setFilterModel?.(m),
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

  // ---------- activeFilters → SearchDTO.conditions로 변환 ----------
  const conditionsFromFilters = useMemo(() => {
    const colType = Object.fromEntries(columns.map((c) => [c.name, c.type || 'string']))
    const out = []

    Object.entries(activeFilters).forEach(([field, def]) => {
      const fType = colType[field] || 'string'
      const dataType = TYPE_TO_DATATYPE[fType] || 'TEXT'

      if (def.mode === 'checkbox') {
        const vals = toNumberIfNeeded(def.values || [], fType)
        if (vals.length > 0) {
          out.push({
            join: out.length === 0 ? null : 'AND',
            field,
            op: 'IN',
            values: vals,
            dataType,
          })
        }
      } else if (def.mode === 'condition') {
        const conds = def.conditions || []
        conds.forEach((c, idx) => {
          const op = mapConditionOp(c.op, fType)
          const join = out.length === 0 && idx === 0 ? null : def.logicOps?.[idx - 1] || 'AND'

          if (op === 'BETWEEN') {
            // 날짜 between: val1/val2, 숫자 between: min/max 혹은 val1/val2 둘 다 케이스 지원
            const aRaw = c.min ?? c.val1 ?? c.from ?? c.val
            const bRaw = c.max ?? c.val2 ?? c.to ?? c.val2
            if (aRaw !== null && bRaw !== null) {
              const a = fType === 'number' ? Number(aRaw) : aRaw
              const b = fType === 'number' ? Number(bRaw) : bRaw
              out.push({ join, field, op, values: [a, b], dataType })
            }
          } else {
            // 단일값: 숫자는 Number로 캐스팅, 공백/NaN은 무시
            const raw = c.val ?? c.value ?? ''
            const v = fType === 'number' ? Number(raw) : raw
            if (fType !== 'number' || Number.isFinite(v)) {
              out.push({ join, field, op, values: [v], dataType })
            }
          }
        })
      }
    })

    return out
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
        context={gridContext}
        onSortChanged={onSortChanged}
        popupParent={popupParent}
        onFilterOpened={onFilterOpened}
      />
    </div>
  )
})

export default DataGrid
