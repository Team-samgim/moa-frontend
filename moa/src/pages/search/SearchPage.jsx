import { useMemo, useState, useCallback, useEffect } from 'react'

import FieldList from '@/components/features/search/FieldList'
import FieldPicker from '@/components/features/search/FieldPicker'
import LayerBar from '@/components/features/search/LayerBar'
import QueryPreview from '@/components/features/search/QueryPreview'
import SelectedConditions from '@/components/features/search/SelectedConditions'
import TimePresetBar from '@/components/features/search/TimePresetBar'
import { useSearchMeta, useExecuteSearch } from '@/hooks/queries/useSearch'
import { buildSearchPayload } from '@/utils/searchPayload'

const uid = () => Math.random().toString(36).slice(2, 9)
const defaultValuesFor = (arity) =>
  arity === 0 ? [] : arity === 1 ? [''] : arity === 2 ? ['', ''] : [] // -1은 태그 리스트

const SearchPage = () => {
  // 페이지 로컬 상태
  const [layer, setLayer] = useState('HTTP_PAGE')
  const [fieldFilter, setFieldFilter] = useState('')
  const [conditions, setConditions] = useState([]) // [{id, join, fieldKey, dataType, operator, values}]
  const [globalNot, setGlobalNot] = useState(false)
  const [timePreset, setTimePreset] = useState('1H')
  const [setResults] = useState([])
  const [viewKeys, setViewKeys] = useState([]) // 조회(표시) 컬럼 전용

  useEffect(() => {
    setConditions([])
    setViewKeys([])
    setFieldFilter('')
  }, [layer])

  // 메타: 훅으로 1회 캐시 (재호출 방지)
  const { data: meta, isLoading, error } = useSearchMeta({ layer })
  const fields = useMemo(() => meta?.fields ?? [], [meta])

  const selectedKeys = useMemo(() => new Set(conditions.map((c) => c.fieldKey)), [conditions])

  // 파생
  const filteredFields = useMemo(() => {
    const q = fieldFilter.trim().toLowerCase()
    if (!q) return fields
    return fields.filter((f) => f.key.toLowerCase().includes(q))
  }, [fields, fieldFilter])

  // 필드별 연산자 목록
  const operatorsFor = useCallback(
    (fieldKey) => {
      const f = fields.find((x) => x.key === fieldKey)
      return (f?.operators || []).slice().sort((a, b) => a.orderNo - b.orderNo)
    },
    [fields],
  )

  // 조건 추가/변경/삭제
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

  // 프리뷰 칩
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

  // 검색 실행 훅
  const exec = useExecuteSearch({
    onSuccess: (data) => {
      const rows = Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data)
          ? data
          : (data?.list ?? [])
      setResults(rows)
    },
    onError: () => alert('검색 중 오류가 발생했습니다.'),
  })

  return (
    <div className='p-6 max-w-[1200px] mx-auto gap-3 flex flex-col'>
      <TimePresetBar
        value={timePreset}
        onChange={setTimePreset}
        onOpenCustom={() => alert('직접설정 TBD')}
      />
      <LayerBar
        active={layer}
        onChange={(opt) => {
          setLayer(opt.key)
        }}
      />
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
          onClick={() => {
            const payload = buildSearchPayload({
              conditions,
              timePreset,
              globalNot,
              fields,
              rows: viewKeys,
            })
            exec.mutate(payload)
          }}
        >
          검색 하기
        </button>
      </div>
    </div>
  )
}
export default SearchPage
