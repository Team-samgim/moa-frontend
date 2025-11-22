import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { fetchGridBySearchSpec } from '@/api/grid'
import { saveGridPreset } from '@/api/presets'
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
import { epochSecToIsoUtc } from '@/utils/dateFormat'
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
    setSearchPayload(null)
    setAggFilters({})
    gridRef.current?.resetFilters?.()
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

  // === 헬퍼: 현재 상태에서 time 스펙 뽑기 ===
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

  // === 전체 초기화 버튼 (카드 하단 '초기화') ===
  const handleResetAll = () => {
    setLayer('HTTP_PAGE')
    setFieldFilter('')
    setConditions([])
    setGlobalNot(false)
    setTimePreset('1H')
    setCustomTimeRange(null)
    setViewKeys([])
    setGridCols([])
    setSearchPayload(null)
    setSearchTotal(null)
    setHasSearched(false)
    setAggFilters({})
    setGridApis(null)
    gridRef.current?.resetFilters?.()
    gridRef.current?.purge?.()
  }

  // === 피벗으로 이동 (columns = viewKeys 고정) ===
  const handleGoPivot = useCallback(() => {
    const cols = Array.isArray(viewKeys) ? viewKeys.filter(Boolean) : []
    const api = gridApis?.api
    const sortModel = api?.getSortModel?.()?.[0] || null
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
      baseSpec,
      query: { layer, timePreset, customTimeRange, globalNot, conditions, viewKeys },
    }

    const timeSpec = getTimeSpec()

    const presetConfig = {
      pivot: {
        mode: 'fromGrid',
        config: {
          layer,
          timeRange: {
            type: 'custom',
            value: null,
            now: new Date().toISOString(),
          },
          customRange: {
            from: timeSpec?.fromEpoch ? epochSecToIsoUtc(timeSpec.fromEpoch) : null,
            to: timeSpec?.toEpoch ? epochSecToIsoUtc(timeSpec.toEpoch) : null,
          },
          column: null,
          rows: [],
          values: [],
          filters: [],
        },
      },
      search: {
        preset_type: 'SEARCH',
        config: searchPreset,
      },
    }

    // initFromGrid는 여전히 호출 (store 즉시 업데이트)
    const { initFromGrid } = usePivotStore.getState()
    initFromGrid({
      layer,
      time: timeSpec,
      columns: cols,
      conditions,
      searchPreset,
    })

    navigate(userNavigations.PIVOT, {
      state: {
        preset: presetConfig,
      },
    })
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
    globalNot,
  ])

  /** 프리셋 주입(브리지 우선, 없으면 라우트 state) */
  useEffect(() => {
    const fromStore = usePresetBridgeStore.getState().takeSearchSpec?.()
    const fromRoute = location.state?.preset
    const raw = fromStore || fromRoute
    if (!raw) return

    let spec = raw?.payload ?? raw

    if (!fromStore && spec && spec.search) {
      spec = toSearchSpecFromConfig(spec)
    }

    skipLayerResetRef.current = true
    setLayer(spec.layer ?? 'HTTP_PAGE')
    setViewKeys(spec.viewKeys ?? [])
    setConditions(spec.conditions ?? [])
    setGlobalNot(!!spec.globalNot)
    const toDate = (sec) => (Number.isFinite(sec) ? new Date(sec * 1000) : null)
    let nextPreset = spec.timePreset ?? '1H'
    let nextCustom = spec.customTimeRange ?? null

    if (!nextCustom && spec.time?.fromEpoch && spec.time?.toEpoch) {
      nextCustom = {
        from: toDate(spec.time.fromEpoch),
        to: toDate(spec.time.toEpoch),
        fromEpoch: spec.time.fromEpoch,
        toEpoch: spec.time.toEpoch,
      }
    }
    if (nextCustom?.from && nextCustom?.to) nextPreset = 'CUSTOM'

    setTimePreset(nextPreset)
    setCustomTimeRange(nextCustom ?? null)

    if (fromStore) {
      setTimeout(() => onClickSearch(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const presetMut = useMutation({
    mutationFn: async () => {
      const api = gridApis?.api
      if (!api) throw new Error('그리드가 아직 준비되지 않았습니다.')

      const columns = api
        .getAllDisplayedColumns()
        .map((c) => c.getColDef())
        .map((def) => def?.field ?? def?.colId)
        .filter((f) => !!f && f !== '__rowNo')

      const uiQuery = {
        layer,
        timePreset,
        customTimeRange,
        globalNot,
        conditions,
        viewKeys,
      }

      const baseSpec = searchPayload ?? null

      // === 시간 스냅샷 ===
      let time = null
      if (baseSpec?.time?.fromEpoch && baseSpec?.time?.toEpoch) {
        time = baseSpec.time
      } else if (customTimeRange?.from && customTimeRange?.to) {
        time = {
          field: 'ts_server_nsec',
          fromEpoch: Math.floor(customTimeRange.from.getTime() / 1000),
          toEpoch: Math.floor(customTimeRange.to.getTime() / 1000),
        }
      } else {
        const now = Math.floor(Date.now() / 1000)
        const span = presetSeconds[timePreset] ?? 3600
        time = {
          field: 'ts_server_nsec',
          fromEpoch: now - span,
          toEpoch: now,
        }
      }

      const search = {
        version: 1,
        layer,
        columns,
        condition: conditions,
        query: uiQuery,
        time,
      }

      const config = { search }

      const fallback = `검색 프리셋 ${new Date().toLocaleString()}`
      const presetName = (window.prompt('프리셋 이름을 입력하세요', fallback) || fallback).trim()

      return await saveGridPreset({
        presetName,
        presetType: 'SEARCH',
        config,
        favorite: false,
      })
    },
    onSuccess: (data) => {
      alert(`프리셋 저장 완료! (ID: ${data?.presetId})`)
    },
    onError: (e) => {
      console.error(e)
      alert(`프리셋 저장 실패: ${e?.response?.status ?? e?.message ?? ''}`)
    },
  })

  return (
    <div className='p-4 mx-30 4xl:mx-60'>
      <div className='mx-auto space-y-6'>
        {/* 상단 타이틀 + 프리셋 버튼 */}
        {/* <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold text-slate-900'>그리드 테이블 구성</h1>
          <div className='flex items-center gap-6 text-sm font-medium text-[#3877BE]'>
            <button type='button' className='hover:underline'>
              프리셋 저장
            </button>
            <button type='button' className='hover:underline'>
              프리셋 불러오기
            </button>
          </div>
        </div> */}

        <div className='flex items-center justify-between gap-5 px-3'>
          <h2 className='text-[20px] font-semibold text-gray-900'>검색</h2>
        </div>

        {/* 검색 구성 카드 (스크린샷 영역) */}
        <div className='flex flex-col rounded-lg bg-white border border-gray-200 shadow-sm p-5 gap-7'>
          {/* 조회 계층 / 조회 기간 한 줄 배치 */}
          <div className='w-full max-w-ws shrink-0 space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='text-base font-semibold 4xl:text-lg text-gray-900'>
                그리드 테이블 구성
              </div>
              <div className='flex items-center gap-6 text-sm font-medium text-[#3877BE]'>
                <button
                  type='button'
                  className='hover:underline'
                  onClick={() => presetMut.mutate()}
                >
                  {presetMut.isPending ? '저장 중…' : '프리셋 저장'}
                </button>
                <button type='button' className='hover:underline'>
                  프리셋 불러오기
                </button>
              </div>
            </div>
            <div className='flex gap-8'>
              <LayerBar active={layer} onChange={(opt) => setLayer(opt.key)} />
              <TimePresetBar
                value={timePreset}
                layerKey={layer}
                onChange={(key) => {
                  setTimePreset(key)
                  if (key !== 'CUSTOM') setCustomTimeRange(null)
                }}
                customRange={customTimeRange}
                autoOpenOnCustom={false}
                onApplyCustom={(range) => setCustomTimeRange(range)}
                onClearCustom={() => setCustomTimeRange(null)}
                onRefresh={() => {
                  setTimePreset('1H')
                  setCustomTimeRange(null)
                }}
              />
            </div>
          </div>

          {/* 조회 필드 (그리드 컬럼) */}
          <FieldPicker
            fields={fields}
            selected={viewKeys}
            onChange={setViewKeys}
            layerKey={layer}
          />

          {/* 실시간 쿼리 프리뷰 */}
          <QueryPreview
            chips={queryChips}
            globalNot={globalNot}
            onToggleNot={() => setGlobalNot((v) => !v)}
            layerKey={layer}
          />

          <div className='h-px w-full bg-gray-200' />

          {/* 카드 하단 버튼 영역 */}
          <div className='flex justify-end gap-3'>
            <button
              type='button'
              onClick={handleResetAll}
              className='h-10 px-6 rounded-sm border border-blue-dark bg-white text-s font-medium text-blue-dark hover:bg-slate-50'
            >
              초기화
            </button>
            <button
              type='button'
              onClick={onClickSearch}
              disabled={isSearching}
              className='h-10 px-6 rounded-sm text-s font-medium text-white bg-[#3877BE] hover:bg-blue-dark border border-[#3877BE] disabled:opacity-60'
            >
              {isSearching ? '검색 중…' : '검색하기'}
            </button>
          </div>
        </div>

        {/* 조건 필드 / 상세조건 편집 영역 (카드 밖, 아래쪽에 유지) */}
        <div
          className='
            grid grid-cols-1 
            lg:grid-cols-[minmax(0,0.6fr)_auto_minmax(0,1.6fr)]
            items-stretch
            gap-6 p-5 border border-gray-200 shadow-sm rounded-lg
          '
        >
          {/* 왼쪽: 필드 리스트 */}
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

          <div className='hidden lg:block w-px bg-gray-200 h-full justify-self-center' />

          {/* 오른쪽: 선택된 조건 영역 */}
          <SelectedConditions
            conditions={conditions}
            operatorsFor={operatorsFor}
            updateCondition={updateCondition}
            removeByFieldKey={removeByFieldKey}
            onChangeOperator={onChangeOperator}
          />
        </div>
      </div>

      {/* 결과 */}
      {hasSearched && (
        <div className='mx-auto w-full py-6'>
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
                    총 <span>{searchTotal.toLocaleString()}</span>건
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
