/**
 * DataGrid
 *
 * AG Grid 기반의 공통 데이터 그리드 컴포넌트.
 * 무한 스크롤(infinite row model), 서버 사이드 검색, 커스텀 필터, 정렬, 포맷팅을 통합 관리한다.
 *
 * 주요 기능:
 * 1) 무한 스크롤 기반 데이터 로딩
 *    - AG Grid InfiniteRowModel 사용
 *    - datasource.getRows 내부에서 /grid/search API 호출
 *    - offset/limit 기반 페이지네이션 처리
 *
 * 2) 정렬
 *    - onSortChanged에서 AG Grid 캐시 초기화(purgeInfiniteCache)
 *    - 서버 검색 payload.options.orderBy / order 값을 변경하여 반영
 *
 * 3) 필터링
 *    - CustomCheckboxFilter + Condition 기반 필터 UI 사용
 *    - 내부 activeFilters 상태로 모든 필터의 스냅샷 유지
 *    - buildConditionsFromActiveFilters로 서버 검색 조건 배열 생성
 *    - 필터 팝업 열림 이벤트를 subscribeFilterMenuOpen으로 제공
 *    - resetFilters()로 필터 완전 초기화 가능
 *
 * 4) 컬럼 정의 처리
 *    - columns prop을 기반으로 동적 columnDefs 생성
 *    - number 타입: pickFormatterByField 이용한 포맷(1.4k 등) 또는 raw number 표시(showRawNumber)
 *    - date 타입: formatUtcToSeoul 포맷 적용
 *    - tooltipValueGetter, right-align 등 공통 옵션 적용
 *
 * 5) 외부 제어 API (useImperativeHandle)
 *    - purge(): AG Grid 캐시 비우기
 *    - refresh(): 캐시 재로딩
 *    - setFilterModel(): AG Grid 필터 모델 설정
 *    - getApi(): AG Grid api 반환
 *    - getActiveFilters(): 현재 적용된 필터 스냅샷 반환
 *    - resetFilters(): 필터 및 캐시 초기화
 *
 * Props:
 * - layer: 필터/검색용 레이어 구분
 * - columns: 컬럼 정의 [{ name, labelKo, type }]
 * - basePayload: 기본 서버 검색 payload
 * - height: 그리드 높이
 * - cacheBlockSize: 1회 가져올 row 수
 * - onGridApis: 그리드 API 전달 콜백
 * - onActiveFiltersChange: 필터 변경 시 콜백
 * - onRowClick: row 클릭 시 콜백
 * - showRawNumber: 숫자 포맷(단위 표시) 여부
 *
 * 내부 관리 요소:
 * - activeFilters: 모든 필터 상태 저장
 * - basePayloadRef: 최신 basePayload 참조 유지
 * - gridContextRef: CustomCheckboxFilter와 연결되는 컨텍스트
 *
 * 서버 요청 구조:
 * payload = {
 *   ...basePayload,
 *   conditions: [...basePayload.conditions, ...conditionsFromFilters],
 *   options: { orderBy, order, limit, offset }
 * }
 *
 * AUTHOR: 방대혁
 */

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
    showRawNumber = false,
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
            valueFormatter: ({ value }) => {
              if (value === null || value === undefined) return ''
              const num = Number(value)
              if (Number.isNaN(num)) return ''
              // false면 기존처럼 1.4k / 2.3M 등 단위 포맷 사용
              return showRawNumber ? num.toLocaleString() : vf(num)
            },
            cellClass: 'ag-right-aligned-cell',
          }),
        }
      }),
    ]
    setColumnDefs(defs)
  }, [columns, layer, unwrapGetter, showRawNumber])

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

        // 정렬 정보 가져오기
        const sortModel = rq.sortModel || []

        let orderBy = basePayload?.options?.orderBy || 'ts_server_nsec'
        let order = (basePayload?.options?.order || 'DESC').toUpperCase()

        if (sortModel.length > 0) {
          const sm = sortModel[0]
          orderBy = sm.colId
          order = (sm.sort || 'desc').toUpperCase()
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

        try {
          const response = await axiosInstance.post('/grid/search', payload)
          const responseData = response.data
          const rows = responseData?.rows || []
          const total = responseData?.total

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
    <div
      className='ag-theme-quartz w-full font-sans text-xs'
      style={{ height, overflow: 'visible' }}
    >
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
        popupParent={popupParent || undefined}
        onFilterOpened={onFilterOpened}
        onRowClicked={(e) => {
          onRowClick?.(e.data)
        }}
      />
    </div>
  )
})

export default DataGrid
