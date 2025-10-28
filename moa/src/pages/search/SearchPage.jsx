import { useEffect, useMemo, useState } from 'react'
import { searchMetaApi, executeSearchApi } from '@/api/search'

// ---- 유틸/상수 ----
const DataType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  IP: 'IP',
  DATETIME: 'DATETIME',
  BOOLEAN: 'BOOLEAN',
}

const uid = () => Math.random().toString(36).slice(2, 9)
const inputTypeOf = (dt) =>
  dt === DataType.NUMBER ? 'number' : dt === DataType.DATETIME ? 'datetime-local' : 'text'
const defaultValuesFor = (arity) =>
  arity === 0 ? [] : arity === 1 ? [''] : arity === 2 ? ['', ''] : [] // -1은 빈 배열 후 토큰 방식

// ---- 시간/페이로드 유틸 ----
const presetToMs = (preset) => {
  switch (preset) {
    case '1H':
      return 60 * 60 * 1000
    case '2H':
      return 2 * 60 * 60 * 1000
    case '24H':
      return 24 * 60 * 1000 * 60
    case '7D':
      return 7 * 24 * 60 * 60 * 1000
    default:
      return 60 * 60 * 1000
  }
}
const coerceValue = (dt, v) => (dt === DataType.NUMBER ? Number(v) : v)

/**
 * 안전한 검색 DSL 페이로드 빌더
 * - SQL을 직접 보내지 않고 field/op/values만 전달
 * - 값 비어있는 조건은 자동 제외
 */
const buildSearchPayload = ({ conditions, timePreset, globalNot, fields }) => {
  const now = Date.now()
  const toEpoch = Math.floor(now / 1000)
  const fromEpoch = Math.floor((now - presetToMs(timePreset)) / 1000)

  // valueArity 조회 도우미
  const arityOf = (c) => {
    const f = fields.find((x) => x.key === c.fieldKey)
    const op = (f?.operators || []).find((o) => o.opCode === c.operator)
    return op?.valueArity ?? 1
  }

  // 값 검증 & 정리
  const cleaned = conditions
    .map((c, idx) => {
      const arity = arityOf(c)
      const vals = Array.isArray(c.values) ? c.values : []

      if (arity === 0) {
        return {
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: [],
          dataType: c.dataType,
        }
      }
      if (arity === 1) {
        const v = (vals[0] ?? '').toString().trim()
        if (!v) return null
        return {
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: [coerceValue(c.dataType, v)],
          dataType: c.dataType,
        }
      }
      if (arity === 2) {
        const v1 = (vals[0] ?? '').toString().trim()
        const v2 = (vals[1] ?? '').toString().trim()
        if (!v1 || !v2) return null
        return {
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: [coerceValue(c.dataType, v1), coerceValue(c.dataType, v2)],
          dataType: c.dataType,
        }
      }
      // -1 (list)
      if (arity === -1) {
        const list = vals.map((x) => x?.toString().trim()).filter(Boolean)
        if (list.length === 0) return null
        return {
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: list.map((v) => coerceValue(c.dataType, v)),
          dataType: c.dataType,
        }
      }
      return null
    })
    .filter(Boolean)

  return {
    layer: 'HTTP_PAGE',
    source: 'http_page_sample', // 요청사항: http_page_sample 테이블
    time: { field: 'ts_server', fromEpoch, toEpoch, inclusive: true }, // 현재시간-프리셋 ~ 현재시간(포함)
    not: globalNot,
    conditions: cleaned,
    options: { orderBy: 'ts_server', order: 'DESC', limit: 100 },
  }
}

// 목록(-1) 입력용 작은 컴포넌트
const ListInput = ({ row, update }) => {
  const [buf, setBuf] = useState('')
  const values = Array.isArray(row.values) ? row.values : []

  const add = () => {
    const t = (buf ?? '').trim()
    if (!t) return
    update(row.id, { values: [...values, t] })
    setBuf('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 999,
            padding: '6px 10px',
            fontSize: 12,
          }}
        >
          {v}
          <button
            style={{
              marginLeft: 6,
              color: '#9ca3af',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => update(row.id, { values: values.filter((_, idx) => idx !== i) })}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className='input'
        placeholder='값 입력 후 Enter'
        value={buf}
        onChange={(e) => setBuf(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          }
        }}
      />
      <button className='btn' onClick={add}>
        추가
      </button>
    </div>
  )
}

const SearchPage = () => {
  // ---- 상태 ----
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fields, setFields] = useState([]) // [{ key, label, dataType, orderNo, operators: [...] }]
  const [filter, setFilter] = useState('')
  const [conditions, setConditions] = useState([]) // [{id, join, fieldKey, dataType, operator, values}]
  const [globalNot, setGlobalNot] = useState(false) // 전체 쿼리 NOT 토글
  const [timePreset, setTimePreset] = useState('1H') // 조회기간 프리셋
  const [results, setResults] = useState([]) // 검색 결과

  // 선택된 필드 집합(체크박스 상태 반영)
  const selectedKeys = useMemo(() => new Set(conditions.map((c) => c.fieldKey)), [conditions])

  // ---- 메타 호출 ----
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // ✅ 백엔드와 연결: searchMetaApi 사용
        if (import.meta.env.DEV) {
          console.log('[META] searchMetaApi: layer=HTTP_PAGE')
        }
        const res = await searchMetaApi('HTTP_PAGE')
        const raw = res?.fields ?? []
        // ✅ operators.default -> isDefault 로 정규화
        const normalized = raw.map((f) => ({
          ...f,
          operators: (f.operators || []).map((op) => ({
            ...op,
            isDefault: op.isDefault ?? op.default ?? false,
          })),
        }))
        if (mounted) setFields(normalized)
      } catch (e) {
        console.error(e)
        if (mounted) setError('메타 로드 실패')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // ---- 파생값 ----
  const filteredFields = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return fields
    return fields.filter((f) => f.key.toLowerCase().includes(q))
  }, [fields, filter])

  // ---- 헬퍼 ----
  const operatorsFor = (fieldKey) => {
    const f = fields.find((x) => x.key === fieldKey)
    return (f?.operators || []).slice().sort((a, b) => a.orderNo - b.orderNo)
  }

  const addConditionFromField = (f) => {
    // 이미 선택돼 있으면 무시
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

  // ---- 프리뷰 ----
  const queryChips = useMemo(() => {
    const chips = []
    conditions.forEach((c, idx) => {
      const labelOp =
        operatorsFor(c.fieldKey).find((o) => o.opCode === c.operator)?.label || c.operator
      if (idx > 0) {
        chips.push({ type: 'join', text: c.join })
      }
      const seg = [c.fieldKey, labelOp]
      if (Array.isArray(c.values) && c.values.length > 0) {
        if (c.values.length === 1) seg.push(String(c.values[0] ?? ''))
        else if (c.values.length === 2) seg.push(`[${c.values[0]} ~ ${c.values[1]}]`)
        else seg.push(`[${c.values.join(', ')}]`)
      }
      chips.push({ type: 'clause', text: seg.join(' ') })
    })
    return chips
  }, [conditions, fields])

  // ---- 렌더 ----
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* 상단: 조회 기간/레이어 (디자인 유지) */}
      <div className='section'>
        <div className='section-title'>조회 기간</div>
        <div className='pill-group'>
          <button
            className={`btn-pill ${timePreset === '1H' ? 'active' : ''}`}
            onClick={() => setTimePreset('1H')}
          >
            1시간
          </button>
          <button
            className={`btn-pill ${timePreset === '2H' ? 'active' : ''}`}
            onClick={() => setTimePreset('2H')}
          >
            2시간
          </button>
          <button
            className={`btn-pill ${timePreset === '24H' ? 'active' : ''}`}
            onClick={() => setTimePreset('24H')}
          >
            24시간
          </button>
          <button
            className={`btn-pill ${timePreset === '7D' ? 'active' : ''}`}
            onClick={() => setTimePreset('7D')}
          >
            1주일
          </button>
          <button className='btn-pill dropdown' onClick={() => alert('직접설정 TBD')}>
            직접설정 <span className='caret'>▾</span>
          </button>
        </div>
      </div>

      <div className='section'>
        <div className='section-title'>조회 계층</div>
        <div className='pill-group'>
          <button className='btn-pill active'>HTTP PAGE</button>
          <button className='btn-pill disabled' disabled={true}>
            HTTP URI
          </button>
          <button className='btn-pill disabled' disabled={true}>
            TCP
          </button>
          <button className='btn-pill disabled' disabled={true}>
            Ethernet
          </button>
        </div>
      </div>

      <div className='grid'>
        {/* 좌측: 필드 리스트 (key + 체크박스만) */}
        <div className='col left'>
          <div className='card'>
            <div className='muted'>필드선택</div>
            <input
              className='input'
              placeholder='필드 검색'
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className='list'>
              {loading && <div className='muted'>로딩중…</div>}
              {error && <div className='error'>{error}</div>}
              {!loading &&
                !error &&
                filteredFields.map((f) => (
                  <label key={f.key} className='row' style={{ cursor: 'pointer' }}>
                    <input
                      type='checkbox'
                      checked={selectedKeys.has(f.key)}
                      onChange={(e) =>
                        e.target.checked ? addConditionFromField(f) : removeByFieldKey(f.key)
                      }
                    />
                    <div className='title'>{f.key}</div>
                  </label>
                ))}
            </div>
          </div>
        </div>

        {/* 우측: 선택된 필드 → 연산자 셀렉트/값 입력 */}
        <div className='col right'>
          <div className='card'>
            <div className='muted'>선택된 필드 수: {conditions.length}</div>
            {conditions.length === 0 && <div className='muted'>왼쪽에서 필드를 체크하세요.</div>}

            <div className='vstack'>
              {conditions.map((row, idx) => {
                const opList = operatorsFor(row.fieldKey)
                const type = inputTypeOf(row.dataType)

                return (
                  <div key={row.id} className='cond'>
                    {/* JOIN */}
                    <select
                      className='select'
                      value={row.join}
                      onChange={(e) => updateCondition(row.id, { join: e.target.value })}
                      disabled={idx === 0}
                    >
                      <option value='AND'>AND</option>
                      <option value='OR'>OR</option>
                    </select>

                    {/* FIELD (읽기 전용 표시) */}
                    <div className='select wide' style={{ background: '#f3f4f6' }}>
                      {row.fieldKey}
                    </div>

                    {/* OP */}
                    <select
                      className='select'
                      value={row.operator}
                      onChange={(e) => onChangeOperator(row, e.target.value)}
                    >
                      {opList.map((op) => (
                        <option key={op.opCode} value={op.opCode}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* VALUE(S) */}
                    <div className='values'>
                      {(() => {
                        const op = opList.find((o) => o.opCode === row.operator)
                        if (!op) return null
                        if (op.valueArity === 0)
                          return <span className='muted small'>(입력 없음)</span>
                        if (op.valueArity === -1)
                          return <ListInput row={row} update={updateCondition} />
                        if (op.valueArity === 1) {
                          return (
                            <input
                              className='input'
                              type={type}
                              value={row.values[0] ?? ''}
                              placeholder={
                                row.dataType === DataType.IP ? '예: 10.0.0.1' : '값 입력'
                              }
                              onChange={(e) =>
                                updateCondition(row.id, { values: [e.target.value] })
                              }
                            />
                          )
                        }
                        return (
                          <div className='hstack'>
                            <input
                              className='input'
                              type={type}
                              placeholder={row.dataType === DataType.DATETIME ? '시작' : '최솟값'}
                              value={row.values[0] ?? ''}
                              onChange={(e) =>
                                updateCondition(row.id, {
                                  values: [e.target.value, row.values[1] ?? ''],
                                })
                              }
                            />
                            <span className='tilde'>~</span>
                            <input
                              className='input'
                              type={type}
                              placeholder={row.dataType === DataType.DATETIME ? '끝' : '최댓값'}
                              value={row.values[1] ?? ''}
                              onChange={(e) =>
                                updateCondition(row.id, {
                                  values: [row.values[0] ?? '', e.target.value],
                                })
                              }
                            />
                          </div>
                        )
                      })()}
                    </div>

                    {/* 삭제(체크 해제와 동일) */}
                    <button className='btn danger' onClick={() => removeByFieldKey(row.fieldKey)}>
                      삭제
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 쿼리 프리뷰 & 검색 버튼에서 쿼리 프리뷰 카드만 아래로 이동 */}
      <div className='card light' style={{ marginTop: 16 }}>
        <div className='muted'>실시간 쿼리</div>
        <div className='chips'>
          <button
            type='button'
            className={`chip toggle ${globalNot ? 'active not' : ''}`}
            onClick={() => setGlobalNot((v) => !v)}
            title='전체 쿼리에 NOT 적용'
          >
            NOT
          </button>
          {queryChips.length ? (
            queryChips.map((c, i) => (
              <span key={i} className={`chip ${c.type === 'join' ? 'join' : 'clause'}`}>
                {c.text}
              </span>
            ))
          ) : (
            <span className='muted'>조건이 없습니다.</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button
          className='btn btn-primary big'
          onClick={async () => {
            const payload = buildSearchPayload({ conditions, timePreset, globalNot, fields })
            console.log('SEARCH payload', payload)
            try {
              const data = await executeSearchApi(payload)
              const rows = Array.isArray(data?.rows)
                ? data.rows
                : Array.isArray(data)
                  ? data
                  : (data?.list ?? [])
              setResults(rows)
            } catch (e) {
              console.error(e)
              alert('검색 중 오류가 발생했습니다.')
            }
          }}
        >
          검색 하기
        </button>
      </div>
      {Array.isArray(results) && results.length > 0 && (
        <div className='card' style={{ marginTop: 16 }}>
          <div className='muted'>검색 결과 ({results.length.toLocaleString()}건)</div>
          <div style={{ overflow: 'auto' }}>
            <table className='tbl'>
              <thead>
                <tr>
                  {Object.keys(results[0]).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    {Object.keys(results[0]).map((k) => (
                      <td key={k + i}>{String(r[k] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* --- 페이지 전용 최소 스타일 --- */}
      <style>{`
        .grid { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
        .card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px; background: #fff; margin-bottom: 12px; }
        .card.light { background: #f3f4f6; }
        .muted { font-size: 16px; color: #6b7280; margin-bottom: 8px; }
        .muted.small { font-size: 12px; }
        .input, .select { width: 100%; padding: 8px 10px; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 14px; }
        .list { max-height: 300px; overflow: auto; display: grid; gap: 8px; }
        .row { display: flex; align-items: center; gap: 12px; border: 1px solid #e5e7eb; padding: 10px; border-radius: 12px; }
        .title { font-weight: 600; font-size: 14px; }
        .sub { font-size: 12px; color: #6b7280; }
        .btn { padding: 8px 10px; border: 1px solid #e5e7eb; background: #fff; border-radius: 10px; font-size: 14px; cursor: pointer; }
        .btn:hover { background: #f9fafb; }
        .btn-primary { background: #3877BE; color: #fff; border-color: #3877BE; }
        .btn-primary:hover { background: #1d4ed8; }
        .btn.danger { border-color: #ef4444; color: #ef4444; }
        .btn.big { padding: 10px 20px; border-radius: 12px; }
        .pill { margin-left: 8px; background: #111; color: #fff; border-radius: 999px; font-size: 12px; padding: 6px 10px; }
        .vstack { display: grid; gap: 10px; }
        .hstack { display: flex; align-items: center; gap: 8px; }
        .tilde { color: #6b7280; }
        .cond { display: grid; grid-template-columns: 80px 1.2fr 140px 1fr 70px; gap: 8px; align-items: center; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .chip { background: #fff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 6px 10px; font-size: 12px; }
        .chip.join { background: #eef2ff; border-color: #c7d2fe; font-weight: 600; }
        .chip.clause { background: #fff; }
        .chip.toggle { cursor: pointer; }
        .chip.toggle.not,
        .chip.not { background: #fee2e2; border-color: #fecaca; }
        .chip.toggle.active { box-shadow: 0 0 0 2px rgba(239,68,68,.2) inset; }
        .error { color: #ef4444; font-size: 12px; margin-bottom: 8px; }

        /* --- 상단 섹션 스타일 --- */
        .section {  border: 1px solid rgba(56, 119, 190, 0.2); border-radius: 20px; padding: 20px; background:#fff; margin-bottom: 16px; display:flex; align-items:center; gap: 20px; }
        .section-title { font-size: 16px; color:#0f172a; min-width: 160px; }
        .pill-group { display:flex; align-items:center; gap: 14px; flex-wrap: wrap; }

        .btn-pill { padding: 10px 20px; border:1px solid #D1D1D6; border-radius: 15px; background:#F5F5F7; color:#374151; font-size: 14px; cursor:pointer; }
        .btn-pill:hover { background:#f9fafb; }
        .btn-pill.active { background:#3877BE; border-color:#3877BE; color:#fff; }
        .btn-pill.disabled { background:#f3f4f6; color:#6b7280; cursor:not-allowed; }
        .btn-pill.dropdown { display:flex; align-items:center; gap:6px; }
        .caret { font-size: 14px; opacity: .9; }
        .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .tbl th, .tbl td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; white-space: nowrap; }
        .tbl thead th { background: #f3f4f6; position: sticky; top: 0; }
      `}</style>
    </div>
  )
}

export default SearchPage
