import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchGridBySearchSpec } from '@/api/grid'
import AggregatesPanel from '@/components/features/grid/AggregatesPanel'
import DataGrid from '@/components/features/grid/DataGrid'
import EthernetRowPreviewModal from '@/components/features/grid/detail/EthernetRowPreviewModal'
import HttpPageRowPreviewModal from '@/components/features/grid/detail/HttpPageRowPreviewModal'
import HttpUriRowPreviewModal from '@/components/features/grid/detail/HttpUriRowPreviewModal'
import TcpRowPreviewModal from '@/components/features/grid/detail/TcpRowPreviewModal'
import FieldList from '@/components/features/search/FieldList'
import FieldPicker from '@/components/features/search/FieldPicker'
import LayerBar from '@/components/features/search/LayerBar'
import QueryPreview from '@/components/features/search/QueryPreview'
import SelectedConditions from '@/components/features/search/SelectedConditions'
import TimePresetBar from '@/components/features/search/TimePresetBar'
import { userNavigations } from '@/constants/navigations'
import useAggregateQuery from '@/hooks/grid/useAggregateQuery'
import { useSearchMeta } from '@/hooks/queries/useSearch'
import GridToolbar from '@/pages/grid/GridToolbar'
import { usePivotStore } from '@/stores/pivotStore'
import { usePresetBridgeStore } from '@/stores/presetBridgeStore'
import { buildSearchPayload } from '@/utils/searchPayload'
import { toSearchSpecFromConfig } from '@/utils/searchSpec'

const uid = () => Math.random().toString(36).slice(2, 9)
const defaultValuesFor = (arity) =>
  arity === 0 ? [] : arity === 1 ? [''] : arity === 2 ? ['', ''] : []

const SearchPage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [tcpRowKey, setTcpRowKey] = useState(null)
  const [httpPageRowKey, setHttpPageRowKey] = useState(null)
  const [httpUriRowKey, setHttpUriRowKey] = useState(null)
  const [ethernetRowKey, setEthernetRowKey] = useState(null)

  const withRowKeyIfDetail = (keys, lyr) =>
    ['TCP', 'HTTP_PAGE', 'ETHERNET', 'HTTP_URI'].includes(lyr)
      ? Array.from(new Set(['row_key', ...(keys || [])]))
      : keys || []

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
  const [aggFilters, setAggFilters] = useState({})
  const [showRawNumber, setShowRawNumber] = useState(false)

  const gridRef = useRef(null)

  // layer 변경 시 초기화(단, 부트스트랩 중엔 스킵)
  const skipLayerResetRef = useRef(false)
  useEffect(() => {
    if (skipLayerResetRef.current) {
      skipLayerResetRef.current = false
      return
    }
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

  const aggQuery = useAggregateQuery({
    layer,
    filterModel: aggFilters,
    columns: gridCols.map((c) => ({
      field: c.name,
      filterParams: { type: c.type },
      headerName: c.labelKo || c.name,
    })),
    baseSpec: searchPayload,
  })

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
        viewKeys: withRowKeyIfDetail(viewKeys, layer),
        conditions,
        timePreset,
        customTimeRange,
        globalNot,
        fields,
      })

      const res = await fetchGridBySearchSpec({
        ...payload,
        options: { ...(payload.options || {}), limit: 1, offset: 0 },
      })

      setGridCols(res?.columns ?? [])
      const total = typeof res?.total === 'number' ? res.total : null
      setSearchTotal(total)

      const base = {
        ...payload,
        options: {
          ...(payload.options || {}),
          orderBy: payload?.options?.orderBy || 'ts_server_nsec',
          order: payload?.options?.order || 'DESC',
        },
      }
      setSearchPayload(base)

      setHasSearched(true)
      setTimeout(() => gridRef.current?.purge?.(), 0)
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (viewKeys.length === 0 && gridCols.length > 0) {
      setViewKeys(
        withRowKeyIfDetail(
          gridCols.map((c) => c.name),
          layer,
        ),
      )
    }
  }, [gridCols, viewKeys.length, layer])

  // === 헬퍼: 현재 상태에서 time 스펙 뽑기 (기존 코드 그대로 사용) ===
  const toEpochSec = (d) => Math.floor(d.getTime() / 1000)
  const presetSeconds = { '1H': 3600, '2H': 7200, '24H': 86400, '7D': 604800 }

  const getTimeSpec = () => {
    if (searchPayload?.time?.fromEpoch && searchPayload?.time?.toEpoch) {
      return {
        field: searchPayload.time.field || 'ts_server_nsec',
        fromEpoch: searchPayload.time.fromEpoch,
        toEpoch: searchPayload.time.toEpoch,
      }
    }
    if (customTimeRange?.from && customTimeRange?.to) {
      return {
        field: 'ts_server_nsec',
        fromEpoch: toEpochSec(customTimeRange.from),
        toEpoch: toEpochSec(customTimeRange.to),
      }
    }
    const now = Math.floor(Date.now() / 1000)
    const span = presetSeconds[timePreset] ?? 3600
    return { field: 'ts_server_nsec', fromEpoch: now - span, toEpoch: now }
  }

  // === 피벗으로 이동 (columns = viewKeys 고정) ===
  const handleGoPivot = useCallback(() => {
    // viewKeys만 사용 (비어있으면 빈 배열)
    const cols = Array.isArray(viewKeys) ? viewKeys.filter(Boolean) : []

    // 현재 그리드 상태 기반 검색 프리셋 구성
    const api = gridApis?.api
    const sortModel = api?.getSortModel?.()[0] || null
    const sortField = sortModel
      ? api.getColumnDef(sortModel.colId)?.field || sortModel.colId
      : searchPayload?.options?.orderBy || 'ts_server_nsec'
    const sortDirection = (sortModel?.sort || searchPayload?.options?.order || 'DESC').toUpperCase()

    const filters = gridRef.current?.getActiveFilters?.() || {}
    const baseSpec =
      searchPayload ||
      buildSearchPayload({
        layer,
        viewKeys,
        conditions,
        timePreset,
        customTimeRange,
        globalNot,
        fields,
      })

    const searchPreset = {
      version: 1,
      layer,
      columns: cols,
      sort: { field: sortField, direction: sortDirection },
      filters,
      baseSpec, // 기간/조건/옵션 포함된 서버 요청 스펙
      query: { layer, timePreset, customTimeRange, globalNot, conditions, viewKeys },
    }

    const payload = {
      layer,
      time: getTimeSpec(), // { field, fromEpoch, toEpoch }
      columns: cols, // 피벗 페이지에서 x/y/value는 따로 설정
      conditions, // 현재 조건
      searchPreset, // 검색 프리셋 같이 전달
    }

    console.log('[PIVOT payload]', payload) // 확인 로그
    const { initFromGrid } = usePivotStore.getState()
    initFromGrid(payload)
    navigate(userNavigations.PIVOT, { state: { preset: { payload } } })
  }, [
    navigate,
    layer,
    viewKeys,
    conditions,
    timePreset,
    customTimeRange,
    searchPayload,
    gridApis,
    fields,
  ])

  /** 프리셋 주입(브리지 우선, 없으면 라우트 state) */
  useEffect(() => {
    const fromStore = usePresetBridgeStore.getState().takeSearchSpec?.()
    // PresetPage에서 navigate(..., { state: { preset: p.config } }) 또는 { preset: { payload } }
    const fromRoute = location.state?.preset
    const raw = fromStore || fromRoute
    if (!raw) return

    let spec = raw?.payload ?? raw // payload 래핑/비래핑 모두 허용

    // 라우트에서 온 값이 "config"({ search: { ... } }) 형태이면 spec으로 변환
    // 마이페이지: preset = p.config 라우트로 넘기는 경우
    // 브리지(fromStore)는 이미 spec이므로 건드리지 않음
    if (!fromStore && spec && spec.search) {
      spec = toSearchSpecFromConfig(spec)
    }

    // layer 리셋 효과 방지
    skipLayerResetRef.current = true
    setLayer(spec.layer ?? 'HTTP_PAGE')
    setViewKeys(spec.viewKeys ?? [])
    setConditions(spec.conditions ?? [])
    setGlobalNot(!!spec.globalNot)
    const toDate = (sec) => (Number.isFinite(sec) ? new Date(sec * 1000) : null)
    let nextPreset = spec.timePreset ?? '1H'
    let nextCustom = spec.customTimeRange ?? null

    // fallback: spec.time.{fromEpoch,toEpoch}만 있는 케이스
    if (!nextCustom && spec.time?.fromEpoch && spec.time?.toEpoch) {
      nextCustom = {
        from: toDate(spec.time.fromEpoch),
        to: toDate(spec.time.toEpoch),
        fromEpoch: spec.time.fromEpoch,
        toEpoch: spec.time.toEpoch,
      }
    }
    // custom 범위가 있으면 무조건 CUSTOM으로
    if (nextCustom?.from && nextCustom?.to) nextPreset = 'CUSTOM'

    setTimePreset(nextPreset)
    setCustomTimeRange(nextCustom ?? null)

    // 다음 틱에 검색 실행
    if (fromStore) {
      setTimeout(() => onClickSearch(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 최초 1회만

  return (
    <div className='p-5 flex flex-col gap-4'>
      {/* 검색 영역 */}
      <div className='p-6 max-w-[1200px] mx-auto gap-3 flex flex-col'>
        <TimePresetBar
          value={timePreset}
          onChange={(key) => {
            setTimePreset(key)
            if (key !== 'CUSTOM') setCustomTimeRange(null) // 프리셋 선택 시 커스텀 해제
          }}
          customRange={customTimeRange} // 직접설정 표시 동기화
          autoOpenOnCustom={false}
          onApplyCustom={(range) => setCustomTimeRange(range)} // 적용하기 → 부모 상태 업데이트
          onClearCustom={() => setCustomTimeRange(null)}
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
                onPivot={handleGoPivot}
                gridApis={gridApis}
                getActiveFilters={() => gridRef.current?.getActiveFilters?.() || {}}
                getBaseSpec={() => searchPayload}
                getUiQuery={() => ({
                  layer,
                  timePreset,
                  customTimeRange,
                  globalNot,
                  conditions,
                  viewKeys,
                })}
              />
              {searchTotal !== null && (
                <div className='mb-2 flex items-center justify-between text-sm text-gray-600'>
                  {/* 왼쪽: 총 건수 */}
                  <div>
                    총{' '}
                    <span className='font-semibold text-blue-600'>
                      {searchTotal.toLocaleString()}
                    </span>
                    건
                  </div>

                  {/* 오른쪽: 원본 데이터 체크박스 */}
                  <label className='flex items-center gap-2 text-xs text-gray-600'>
                    <input
                      type='checkbox'
                      className='h-4 w-4'
                      checked={showRawNumber}
                      onChange={(e) => setShowRawNumber(e.target.checked)}
                    />
                    <span>원본 데이터</span>
                  </label>
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
                onActiveFiltersChange={setAggFilters}
                onRowClick={(row) => {
                  const key =
                    row?.row_key?.value ?? row?.row_key ?? row?.rowKey?.value ?? row?.rowKey
                  if (!key) return

                  if (layer === 'TCP') {
                    setTcpRowKey(key)
                  } else if (layer === 'HTTP_PAGE') {
                    setHttpPageRowKey(key)
                  } else if (layer === 'ETHERNET') {
                    setEthernetRowKey(key)
                  } else if (layer === 'HTTP_URI') {
                    setHttpUriRowKey(key)
                  }
                }}
                showRawNumber={showRawNumber}
              />
              {aggQuery.isSuccess && (
                <AggregatesPanel
                  columns={gridCols.map((c) => ({
                    field: c.name,
                    headerName: c.labelKo || c.name,
                  }))}
                  aggregates={aggQuery.data?.aggregates || {}}
                />
              )}
              {aggQuery.isLoading && (
                <div className='text-xs text-gray-500 mt-2'>집계 계산 중…</div>
              )}
              {layer === 'TCP' && (
                <TcpRowPreviewModal
                  open={!!tcpRowKey}
                  onClose={() => setTcpRowKey(null)}
                  rowKey={tcpRowKey}
                />
              )}
              {layer === 'HTTP_PAGE' && (
                <HttpPageRowPreviewModal
                  open={!!httpPageRowKey}
                  onClose={() => setHttpPageRowKey(null)}
                  rowKey={httpPageRowKey}
                />
              )}
              {layer === 'ETHERNET' && (
                <EthernetRowPreviewModal
                  open={!!ethernetRowKey}
                  onClose={() => setEthernetRowKey(null)}
                  rowKey={ethernetRowKey}
                />
              )}
              {layer === 'HTTP_URI' && (
                <HttpUriRowPreviewModal
                  open={!!httpUriRowKey}
                  onClose={() => setHttpUriRowKey(null)}
                  rowKey={httpUriRowKey}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPage
