import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import { fetchGridBySearchSpec } from '@/api/grid'
import AggregatesPanel5 from '@/components/features/grid/AggregatesPanel'
import CustomCheckboxFilter from '@/components/features/grid/CustomCheckboxFilter'
import DataGrid from '@/components/features/grid/DataGrid'
import FieldList from '@/components/features/search/FieldList'
import FieldPicker from '@/components/features/search/FieldPicker'
import LayerBar from '@/components/features/search/LayerBar'
import QueryPreview from '@/components/features/search/QueryPreview'
import SelectedConditions from '@/components/features/search/SelectedConditions'
import TimePresetBar from '@/components/features/search/TimePresetBar'
import useActiveFilters from '@/hooks/grid/useActiveFilters'
import useAggregateQuery from '@/hooks/grid/useAggregateQuery'
import useInfiniteSearchDatasource from '@/hooks/grid/useInfiniteDatasource'
import { useSearchMeta } from '@/hooks/queries/useSearch'
import GridToolbar from '@/pages/grid/GridToolbar'
import { formatUtcToSeoul } from '@/utils/dateFormat'
import { makeFilterModel } from '@/utils/makeFilterModel'
import { pickFormatterByField } from '@/utils/numFormat'
import { buildSearchPayload } from '@/utils/searchPayload'

ModuleRegistry.registerModules([AllCommunityModule])

const uid = () => Math.random().toString(36).slice(2, 9)
const defaultValuesFor = (arity) =>
  arity === 0 ? [] : arity === 1 ? [''] : arity === 2 ? ['', ''] : []

const SearchPage = () => {
  const [layer, setLayer] = useState('HTTP_PAGE')
  const [fieldFilter, setFieldFilter] = useState('')
  const [conditions, setConditions] = useState([])
  const [globalNot, setGlobalNot] = useState(false)
  const [timePreset, setTimePreset] = useState('1H')
  const [viewKeys, setViewKeys] = useState([])

  const [setGridRows] = useState(null) // 검색 결과
  const [hasSearched, setHasSearched] = useState(false) // 게이트
  const [colDefs, setColDefs] = useState([])
  const basePayloadRef = useRef(null)
  const { activeFilters, activeFiltersRef, updateFilter, setActiveFilters } = useActiveFilters()

  const gridRef = useRef(null)

  useEffect(() => {
    // 레이어 바뀌면 다시 검색해야 보이도록 초기화
    setConditions([])
    setViewKeys([])
    setFieldFilter('')
    setGridRows(null)
    setHasSearched(false)
  }, [layer])

  const { data: meta, isLoading, error } = useSearchMeta({ layer })
  const fields = useMemo(() => meta?.fields ?? [], [meta])
  const selectedKeys = useMemo(() => new Set(conditions.map((c) => c.fieldKey)), [conditions])

  const filteredFields = useMemo(() => {
    const q = fieldFilter.trim().toLowerCase()
    if (!q) return fields
    return fields.filter((f) => f.key.toLowerCase().includes(q))
  }, [fields, fieldFilter])

  const operatorsFor = useCallback(
    (fieldKey) => {
      const f = fields.find((x) => x.key === fieldKey)
      return (f?.operators || []).slice().sort((a, b) => a.orderNo - b.orderNo)
    },
    [fields],
  )

  const addConditionFromField = (f) => {
    if (conditions.some((c) => c.fieldKey === f.key)) return
    const ops = operatorsFor(f.key)
    const def = ops.find((o) => o.isDefault) || ops[0]
    setConditions((prev) => [
      ...prev,
      {
        id: uid(),
        join: prev.length === 0 ? 'AND' : 'AND',
        fieldKey: f.key,
        dataType: f.dataType,
        operator: def?.opCode || 'EQ',
        values: defaultValuesFor(def?.valueArity ?? 1),
      },
    ])
  }
  const removeByFieldKey = (key) => setConditions((prev) => prev.filter((c) => c.fieldKey !== key))
  const updateCondition = (id, patch) =>
    setConditions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  const onChangeOperator = (row, opCode) => {
    const op = operatorsFor(row.fieldKey).find((o) => o.opCode === opCode)
    updateCondition(row.id, { operator: opCode, values: defaultValuesFor(op?.valueArity ?? 1) })
  }

  const queryChips = useMemo(() => {
    const chips = []
    conditions.forEach((c, idx) => {
      const labelOp =
        operatorsFor(c.fieldKey).find((o) => o.opCode === c.operator)?.label || c.operator
      if (idx > 0) chips.push({ type: 'join', text: c.join })
      const seg = [c.fieldKey, labelOp]
      if (Array.isArray(c.values) && c.values.length > 0) {
        if (c.values.length === 1) seg.push(String(c.values[0] ?? ''))
        else if (c.values.length === 2) seg.push(`[${c.values[0]} ~ ${c.values[1]}]`)
        else seg.push(`[${c.values.join(', ')}]`)
      }
      chips.push({ type: 'clause', text: seg.join(' ') })
    })
    return chips
  }, [conditions, operatorsFor])

  const onClickSearch = async () => {
    const payload = buildSearchPayload({
      layer,
      conditions,
      timePreset,
      globalNot,
      fields,
    })
    basePayloadRef.current = payload
    const head = await fetchGridBySearchSpec({ ...payload, paging: { offset: 0, limit: 0 } })
    setColDefs(buildColDefs(head?.columns ?? []))
    setHasSearched(true)
    setTimeout(() => gridRef.current?.api?.purgeInfiniteCache?.(), 0)
  }

  const datasource = useInfiniteSearchDatasource({
    basePayloadRef,
    activeFiltersRef,
    pageSize: 50,
  })

  const buildColDefs = useCallback(
    (serverCols = []) => [
      {
        headerName: 'No',
        field: '__rowNo',
        valueGetter: (p) => (p.node.rowPinned ? (p.data?.__label ?? '') : p.node.rowIndex + 1),
        width: 80,
        resizable: true,
        filter: false,
        cellStyle: { textAlign: 'center' },
      },
      ...serverCols.map((col, idx) => {
        const isDate = col.type === 'date'
        const isNumber = col.type === 'number'
        const vf = isNumber ? pickFormatterByField(col.name) : null
        return {
          field: col.name,
          headerName: col.labelKo || col.name,
          colId: `${col.name}-${col.type}-${idx}`,
          sortable: true,
          filter: CustomCheckboxFilter,
          filterParams: { layer, type: col.type, pageLimit: 50, debounceMs: 350 },
          resizable: true,
          floatingFilter: false,
          ...(isDate && { valueFormatter: ({ value }) => formatUtcToSeoul(value) }),
          ...(isNumber && {
            valueFormatter: ({ value }) => (value === null ? '' : vf(Number(value))),
            cellClass: 'ag-right-aligned-cell',
          }),
        }
      }),
    ],
    [layer],
  )

  const filterOpenSubsRef = useRef(new Map())
  const subscribeFilterMenuOpen = useCallback((field, cb) => {
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
  }, [])

  const onFilterOpened = (e) => {
    const field = e?.column?.getColDef?.()?.field
    if (!field) return
    const subs = filterOpenSubsRef.current.get(field) || []
    subs.forEach((fn) => typeof fn === 'function' && fn())
  }

  const gridContext = useMemo(
    () => ({
      updateFilter,
      getActiveFilters: () => activeFiltersRef.current,
      getApi: () => gridRef.current?.api,
      activeFilters,
      subscribeFilterMenuOpen,
      refreshInfiniteCache: () => gridRef.current?.api?.refreshInfiniteCache?.(),
    }),
    [activeFilters, updateFilter, subscribeFilterMenuOpen],
  )

  // 필터 바뀌면 캐시 리프레시
  useEffect(() => {
    gridRef.current?.api?.refreshInfiniteCache?.()
  }, [activeFilters])

  const filterModelObj = useMemo(() => makeFilterModel(activeFilters), [activeFilters])
  const { data: aggData, isFetching: aggLoading } = useAggregateQuery({
    layer,
    filterModel: filterModelObj,
    columns: colDefs,
  })

  const resetFilters = () => {
    const api = gridRef.current?.api
    if (api) {
      api.setFilterModel(null)
      api.refreshInfiniteCache()
    }
    setActiveFilters({})
  }

  return (
    <div className='p-5 flex flex-col gap-4'>
      {/* 검색 영역 */}
      <div className='p-6 max-w-[1200px] mx-auto gap-3 flex flex-col'>
        <TimePresetBar
          value={timePreset}
          onChange={setTimePreset}
          onOpenCustom={() => alert('직접설정 TBD')}
        />
        <LayerBar active={layer} onChange={(opt) => setLayer(opt.key)} />
        <FieldPicker fields={fields} selected={viewKeys} onChange={setViewKeys} />
        <div className='grid grid-cols-3 gap-3'>
          <div className='col-span-1'>
            <FieldList
              loading={isLoading}
              error={error ? '메타 로드 실패' : null}
              fields={filteredFields}
              filter={fieldFilter}
              onFilter={setFieldFilter}
              selectedKeys={selectedKeys}
              onToggle={(field, checked) =>
                checked ? addConditionFromField(field) : removeByFieldKey(field.key)
              }
            />
          </div>
          <div className='col-span-2'>
            <SelectedConditions
              conditions={conditions}
              operatorsFor={operatorsFor}
              updateCondition={updateCondition}
              removeByFieldKey={removeByFieldKey}
              onChangeOperator={onChangeOperator}
            />
          </div>
        </div>

        <QueryPreview
          chips={queryChips}
          globalNot={globalNot}
          onToggleNot={() => setGlobalNot((v) => !v)}
        />

        <div className='flex justify-center'>
          <button
            className='px-5 py-2.5 rounded-xl text-white bg-[#3877BE] hover:bg-blue-700 border border-[#3877BE]'
            onClick={onClickSearch}
          >
            검색 하기
          </button>
        </div>
      </div>

      {/* 결과 앵커 */}
      <div id='result-grid-anchor' />

      {/* ✅ 검색 전: 아무 것도 렌더링하지 않음 */}
      {hasSearched && (
        <div className='max-w-[1200px] mx-auto w-full px-6'>
          <GridToolbar
            currentLayer={layer}
            onReset={resetFilters}
            onPivot={() => {}}
            gridApis={{ api: gridRef.current?.api, columnApi: gridRef.current?.columnApi }}
            getActiveFilters={() => activeFilters}
          />
          <DataGrid
            ref={gridRef}
            layer={layer}
            colDefs={colDefs} // 변환된 ag-grid 컬럼(defs) 사용
            viewKeys={viewKeys}
            height='70vh'
            rowModelType='infinite'
            datasource={datasource}
            gridContext={gridContext}
            onFilterOpened={onFilterOpened}
          />
          <AggregatesPanel5
            columns={colDefs}
            aggregates={aggData?.aggregates}
            loading={aggLoading}
          />
        </div>
      )}
    </div>
  )
}

export default SearchPage
