import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { fetchGridBySearchSpec } from '@/api/grid'
import DataGrid from '@/components/features/grid/DataGrid'
import FieldList from '@/components/features/search/FieldList'
import FieldPicker from '@/components/features/search/FieldPicker'
import LayerBar from '@/components/features/search/LayerBar'
import QueryPreview from '@/components/features/search/QueryPreview'
import SelectedConditions from '@/components/features/search/SelectedConditions'
import TimePresetBar from '@/components/features/search/TimePresetBar'
import { useSearchMeta } from '@/hooks/queries/useSearch'
import GridToolbar from '@/pages/grid/GridToolbar'
import { buildSearchPayload } from '@/utils/searchPayload'

const uid = () => Math.random().toString(36).slice(2, 9)
const defaultValuesFor = (arity) =>
  arity === 0 ? [] : arity === 1 ? [''] : arity === 2 ? ['', ''] : []

const SearchPage = () => {
  const [gridApis, setGridApis] = useState(null)
  const [layer, setLayer] = useState('HTTP_PAGE')
  const [fieldFilter, setFieldFilter] = useState('')
  const [conditions, setConditions] = useState([])
  const [globalNot, setGlobalNot] = useState(false)
  const [timePreset, setTimePreset] = useState('1H')
  const [customTimeRange, setCustomTimeRange] = useState(null)
  const [viewKeys, setViewKeys] = useState([])
  const [gridCols, setGridCols] = useState([])
  const [searchPayload, setSearchPayload] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchTotal, setSearchTotal] = useState(null)

  const gridRef = useRef(null)

  useEffect(() => {
    setConditions([])
    setViewKeys([])
    setFieldFilter('')
    setHasSearched(false)
    setCustomTimeRange(null)
    setGridCols([])
    setSearchTotal(null)
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
    setIsSearching(true)
    try {
      const payload = buildSearchPayload({
        layer,
        viewKeys,
        conditions,
        timePreset,
        customTimeRange,
        globalNot,
        fields,
      })

      console.log('[SearchPage] 🔍 초기 메타 조회 (limit=1)')

      // 컬럼/총건수만 선조회
      const res = await fetchGridBySearchSpec({
        ...payload,
        options: { ...(payload.options || {}), limit: 1, offset: 0 },
      })

      setGridCols(res?.columns ?? [])
      const total = typeof res?.total === 'number' ? res.total : null
      setSearchTotal(total)

      console.log('[SearchPage] ✅ 메타 조회 완료:', {
        columns: res?.columns?.length,
        total,
      })

      // 무한스크롤 datasource 장착 (실제 데이터는 DataGrid에서 로드)
      const base = {
        ...payload,
        options: {
          ...(payload.options || {}),
          orderBy: payload?.options?.orderBy || 'ts_server_nsec',
          order: payload?.options?.order || 'DESC',
        },
      }
      setSearchPayload(base)

      console.log('[SearchPage] 🚀 DataGrid 무한스크롤 시작 (cacheBlockSize=100)')

      setHasSearched(true)
      setTimeout(() => gridRef.current?.purge?.(), 0)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className='p-5 flex flex-col gap-4'>
      {/* 검색 영역 */}
      <div className='p-6 max-w-[1200px] mx-auto gap-3 flex flex-col'>
        <TimePresetBar
          value={timePreset}
          onChange={setTimePreset}
          onApplyCustom={(range) => setCustomTimeRange(range)}
          onRefresh={() => {
            setTimePreset('1H')
            setCustomTimeRange(null)
          }}
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
            className='px-5 py-2.5 rounded-xl text-white bg-[#3877BE] hover:bg-blue-700 border border-[#3877BE] disabled:opacity-60'
            onClick={onClickSearch}
            disabled={isSearching}
          >
            {isSearching ? '검색 중…' : '검색 하기'}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {hasSearched && (
        <div className='max-w-[1200px] mx-auto w-full px-6'>
          {searchTotal === 0 ? (
            <div className='text-sm text-gray-500 py-10 text-center border rounded-xl'>
              조건에 맞는 결과가 없습니다.
            </div>
          ) : (
            <>
              <GridToolbar
                currentLayer={layer}
                onReset={() => gridRef.current?.resetFilters?.()}
                onPivot={undefined /* 필요시 라우팅 핸들러 연결 */}
                gridApis={gridApis}
                getActiveFilters={() => gridRef.current?.getActiveFilters?.() || {}}
                getBaseSpec={() => searchPayload}
              />
              {searchTotal !== null && (
                <div className='mb-2 text-sm text-gray-600'>
                  총{' '}
                  <span className='font-semibold text-blue-600'>
                    {searchTotal.toLocaleString()}
                  </span>
                  건
                </div>
              )}
              <DataGrid
                ref={gridRef}
                layer={layer}
                columns={gridCols}
                basePayload={searchPayload}
                height='55vh'
                cacheBlockSize={100}
                onGridApis={setGridApis}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPage
