// src/components/filters/CustomCheckboxFilter.jsx
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchFilterValues as apiFetchFilterValues } from '@/api/grid'
import { OPERATOR_OPTIONS } from '@/constants/filterOperators'

const CustomCheckboxFilter = (props) => {
  const [values, setValues] = useState([]) // 누적된 후보 값
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inflightRef = useRef(null)
  const lastSigRef = useRef('')

  const makeSig = (afFromCaller, includeSelf) => {
    const af = afFromCaller ?? (props.context?.getActiveFilters?.() || {})
    const { [field]: _, ...afWithoutSelf } = af
    const key = {
      layer,
      field,
      search,
      filters: afWithoutSelf,
      includeSelf,
    }
    return JSON.stringify(key, Object.keys(key).sort())
  }

  // 페이징 상태
  const [hasMore, setHasMore] = useState(false)
  const nextOffsetRef = useRef(null)

  // 조건 패널
  const [showConditionPanel, setShowConditionPanel] = useState(false)
  const [conditions, setConditions] = useState([{ op: 'contains', val: '', val1: '', val2: '' }])
  const [logicOps, setLogicOps] = useState([])
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const listRef = useRef(null) // 스크롤 감지용
  const inputRefs = useRef([])
  const restoredRef = useRef(false)
  const searchTimer = useRef(0)

  const getAF = () => props.context?.getActiveFilters?.() || {}
  const getApi = () => props.context?.getApi?.()

  const layer = props?.colDef?.filterParams?.layer || 'ethernet'
  const fieldType = props?.colDef?.filterParams?.type || 'string'
  const field = props.colDef.field

  const PAGE_LIMIT = Math.max(1, Number(props?.colDef?.filterParams?.pageLimit ?? 200))
  const DEBOUNCE_MS = Math.max(0, Number(props?.colDef?.filterParams?.debounceMs ?? 250))

  useEffect(() => {
    const unsubscribe = props.context?.subscribeFilterMenuOpen?.(field, () => {
      // 캐시 무효화 후 현재 전역 필터 기준으로 1페이지부터 다시
      lastSigRef.current = ''
      nextOffsetRef.current = 0
      setValues([])
      setHasMore(false)

      const af = getAF()
      const hasSelf = !!af[field]
      const afForFetch = hasSelf
        ? af
        : Object.fromEntries(Object.entries(af).filter(([k]) => k !== field))
      reloadAll(afForFetch)
    })
    return () => unsubscribe?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field])

  // ---------- 서버 로드 ----------
  const loadPage = async ({ reset = false, filterModelOverride } = {}) => {
    const af = filterModelOverride ?? (props.context?.getActiveFilters?.() || {})
    const includeSelf = !!af[field] // 해당 컬럼에 필터가 있으면 true
    const sig = makeSig(af, includeSelf)

    // 같은 조건으로 이미 로드되어 있고 reset 아닌 경우 스킵
    if (!reset && lastSigRef.current === sig && values.length > 0 && !hasMore) return

    // 이전 요청 취소
    if (inflightRef.current) inflightRef.current.abort()
    const controller = new AbortController()
    inflightRef.current = controller

    try {
      setLoading(true)
      setError('')
      const currentOffset = reset ? 0 : (nextOffsetRef.current ?? 0)

      const data = await apiFetchFilterValues({
        layer,
        field,
        filterModel: af,
        search,
        offset: currentOffset,
        limit: PAGE_LIMIT,
        signal: controller.signal,
        includeSelf,
      })

      const pageValues = data?.values || []
      if (reset) setValues(pageValues)
      else setValues((prev) => [...prev, ...pageValues])

      setHasMore(!!data?.hasMore)
      nextOffsetRef.current = data?.nextOffset ?? null

      // 성공 시 시그니처 저장(리셋일 때만 갱신해도 OK)
      if (reset) lastSigRef.current = sig
    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') {
        console.error(`[${field}] 필터 값 로드 실패:`, e)
        setError('필터 후보를 불러오지 못했습니다.')
      }
    } finally {
      setLoading(false)
      inflightRef.current = null
    }
  }

  const reloadAll = (filterModelOverride) => {
    nextOffsetRef.current = 0
    setValues([])
    setHasMore(false)
    return loadPage({ reset: true, filterModelOverride })
  }

  // 레이어/필드 변경 시 초기 로드
  useEffect(() => {
    restoredRef.current = false
  }, [layer, field])

  // 검색 디바운스
  const onChangeSearch = (e) => {
    const keyword = e.target.value ?? ''
    setSearch(keyword)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => {
      reloadAll()
    }, DEBOUNCE_MS)
  }

  // 기존 필터 복원 (첫 로드 한 번만)
  useEffect(() => {
    if (restoredRef.current || values.length === 0) return
    const prevFilter = props.context?.activeFilters?.[field]
    if (prevFilter?.mode === 'checkbox') {
      const setCandidate = new Set(values)
      const valid = (prevFilter.values || []).filter((v) => setCandidate.has(v))
      setSelected(valid)
    } else if (prevFilter?.mode === 'condition') {
      setConditions(prevFilter.conditions || [{ op: 'contains', val: '' }])
      setLogicOps(prevFilter.logicOps || [])
    }
    restoredRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

  // 스크롤 하단 근처에서 다음 페이지 로드
  const onScrollList = (e) => {
    if (!hasMore || loading) return
    const el = e.currentTarget
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (nearBottom) loadPage({ reset: false })
  }

  // 체크박스 토글
  const toggleValue = (val) => {
    setSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]))
  }

  // 필터 적용
  const applyFilter = async () => {
    // 조건 최신화
    const latestConditions = conditions.map((c, i) => {
      const ref = inputRefs.current[i] || {}
      const base = { ...c }
      base.val = ref.val?.value ?? c.val ?? ''
      if (c.op === 'between' && ref.val1 && ref.val2) {
        base.val = `${ref.val1.value || ''},${ref.val2.value || ''}`
      }
      return base
    })

    const hasCondition = latestConditions.some((c) => (c.val || '').trim() !== '')
    const hasSelected = selected.length > 0

    let newFilter = null
    if (hasCondition) {
      newFilter = { mode: 'condition', type: fieldType, conditions: latestConditions, logicOps }
    } else if (hasSelected) {
      newFilter = { mode: 'checkbox', type: fieldType, values: selected }
    }

    // 전역 상태 갱신
    props.context?.updateFilter?.(field, newFilter)

    // 최신 필터 스냅샷
    const nextFilters = JSON.parse(JSON.stringify(getAF()))
    if (newFilter) nextFilters[field] = newFilter
    else delete nextFilters[field]

    setShowConditionPanel(false)
    getApi()?.hidePopupMenu?.()

    lastSigRef.current = ''
    nextOffsetRef.current = 0
    setValues([])
    setHasMore(false)

    reloadAll(nextFilters).catch(() => {})
    getApi()?.refreshInfiniteCache?.()
  }

  const handleShowConditionPanel = () => {
    setShowConditionPanel((prev) => {
      const next = !prev
      if (!prev) {
        const currentFilters = getAF()
        const prevFilter = currentFilters[field]
        if (prevFilter?.mode === 'checkbox') {
          setSelected(prevFilter.values || [])
        } else if (prevFilter?.mode === 'condition') {
          setConditions(prevFilter.conditions || [{ op: 'contains', val: '' }])
          setLogicOps(prevFilter.logicOps || [])
        } else {
          setSelected([])
          setConditions([{ op: 'contains', val: '' }])
          setLogicOps([])
        }
      }
      return next
    })

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.top + window.scrollY - 10, left: rect.right + 12 })
    }
  }

  // 외부 클릭 닫기
  useEffect(() => {
    if (!showConditionPanel) return
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowConditionPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showConditionPanel])

  // 포털 패널
  const ConditionPanel = () =>
    createPortal(
      <div
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
        className='fixed z-[10000] w-[280px] rounded-xl border border-gray-300 bg-white shadow-2xl'
        style={{ top: panelPos.top, left: panelPos.left }}
      >
        <div className='flex items-center justify-between bg-white px-3 py-2 text-[13px] font-medium'>
          <span>{`조건별 필터 (${fieldType})`}</span>
          <button
            onClick={() => setShowConditionPanel(false)}
            className='cursor-pointer text-[16px] font-semibold'
          >
            ×
          </button>
        </div>

        <div className='max-h-[400px] overflow-y-auto p-2.5'>
          {conditions.map((cond, idx) => (
            <div key={idx} className='mb-2.5'>
              {idx > 0 && (
                <select
                  value={logicOps[idx - 1] || 'AND'}
                  onChange={(e) =>
                    setLogicOps((prev) => {
                      const updated = [...prev]
                      updated[idx - 1] = e.target.value
                      return updated
                    })
                  }
                  className='mb-1.5 w-full bg-gray-50 p-1 text-[12px]'
                >
                  <option value='AND'>AND (그리고)</option>
                  <option value='OR'>OR (또는)</option>
                </select>
              )}

              <div className='flex items-center gap-1.5'>
                <div className='flex-1'>
                  <select
                    value={cond.op}
                    onChange={(e) =>
                      setConditions((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, op: e.target.value } : c)),
                      )
                    }
                    className='mb-1 w-full p-1 text-[12px]'
                  >
                    {(OPERATOR_OPTIONS[fieldType] || OPERATOR_OPTIONS.string).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {!(fieldType === 'date' && cond.op === 'between') && (
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = inputRefs.current[idx] || {}
                        inputRefs.current[idx].val = el
                      }}
                      defaultValue={cond.val}
                      type={
                        fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'
                      }
                      placeholder='값 입력...'
                      className='w-full rounded border border-gray-300 p-1 text-[12px]'
                    />
                  )}

                  {fieldType === 'date' && cond.op === 'between' && (
                    <div className='flex gap-1.5'>
                      <input
                        ref={(el) => {
                          inputRefs.current[idx] = inputRefs.current[idx] || {}
                          inputRefs.current[idx].val1 = el
                        }}
                        defaultValue={cond.val1}
                        type='date'
                        placeholder='시작일'
                        className='flex-1 rounded border border-gray-300 p-1 text-[12px]'
                      />
                      <input
                        ref={(el) => {
                          inputRefs.current[idx] = inputRefs.current[idx] || {}
                          inputRefs.current[idx].val2 = el
                        }}
                        defaultValue={cond.val2}
                        type='date'
                        placeholder='종료일'
                        className='flex-1 rounded border border-gray-300 p-1 text-[12px]'
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setConditions((prev) => prev.filter((_, i) => i !== idx))
                    setLogicOps((prev) => prev.filter((_, i) => i !== idx && i !== idx - 1))
                    inputRefs.current.splice(idx, 1)
                  }}
                  className='h-6 cursor-pointer rounded border border-gray-300 bg-gray-100 px-1.5 text-[13px] font-semibold'
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setConditions((prev) => [...prev, { op: 'contains', val: '', val1: '', val2: '' }])
              setLogicOps((prev) => [...prev, 'AND'])
            }}
            className='w-full cursor-pointer rounded border border-gray-300 bg-gray-50 py-1 text-[12px]'
          >
            ➕ 조건 추가
          </button>

          <div className='mt-2.5 flex gap-2'>
            <button
              onClick={applyFilter}
              className='flex-1 cursor-pointer rounded bg-[#3877BE] py-1 text-[12px] text-white'
            >
              적용
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )

  // -------- 렌더 --------
  return (
    <>
      <div className='relative w-[220px] rounded-md border border-gray-200 bg-white p-2 text-[13px] shadow-sm'>
        <input
          type='text'
          placeholder='검색(접두어 일치)...'
          value={search}
          onChange={onChangeSearch}
          className='mb-2 w-full rounded border border-gray-300 px-2 py-1 text-[12px]'
        />

        <button
          ref={buttonRef}
          onClick={handleShowConditionPanel}
          className='w-full cursor-pointer rounded border border-gray-300 bg-gray-50 py-1 text-[12px]'
        >
          조건별 필터
        </button>

        <div
          ref={listRef}
          onScroll={onScrollList}
          className='mt-1 max-h-[200px] overflow-y-auto border-y border-gray-100 py-1'
        >
          {error && <div className='py-2 text-center text-[12px] text-red-500'>{error}</div>}
          {!error && values.length === 0 && !loading && (
            <div className='py-2 text-center text-[12px] text-gray-400'></div>
          )}
          {!error &&
            values.map((val, i) => (
              <label
                key={`${val ?? 'null'}__${i}`}
                className='block cursor-pointer px-1.5 py-0.5 text-[12px]'
              >
                <input
                  type='checkbox'
                  checked={selected.includes(val)}
                  onChange={() => toggleValue(val)}
                  className='mr-1.5'
                />
                {val ?? '(NULL)'}
              </label>
            ))}
          {loading && (
            <div className='py-2 text-center text-[12px] text-gray-400'>불러오는 중…</div>
          )}
          {!loading && hasMore && (
            <button
              onClick={() => loadPage({ reset: false })}
              className='my-1 w-full cursor-pointer rounded border border-gray-200 bg-gray-50 py-1 text-[12px]'
            >
              더 보기
            </button>
          )}
        </div>

        <div className='mt-2 flex gap-1.5'>
          <button
            onClick={applyFilter}
            className='flex-1 cursor-pointer rounded bg-[#3877BE] py-1 text-[12px] text-white'
          >
            적용
          </button>
        </div>
      </div>

      {showConditionPanel && <ConditionPanel />}
    </>
  )
}

export default CustomCheckboxFilter
