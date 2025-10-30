import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import axiosInstance from '@/api/axios'

const CustomCheckboxFilter = (props) => {
  const [uniqueValues, setUniqueValues] = useState([])
  const [filteredValues, setFilteredValues] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [showConditionPanel, setShowConditionPanel] = useState(false)
  const [conditions, setConditions] = useState([{ op: 'contains', val: '' }])
  const [logicOps, setLogicOps] = useState([])
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const getAF = () => props.context?.getActiveFilters?.() || {}
  const getApi = () => props.context?.getApi?.()

  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const inputRefs = useRef([])
  const restoredRef = useRef(false)

  const layer = props?.colDef?.filterParams?.layer || 'ethernet'
  const fieldType = props?.colDef?.filterParams?.type || 'string'
  const field = props.colDef.field

  /** 타입별 연산자 목록 */
  const operatorOptions = {
    string: [
      { label: '포함', value: 'contains' },
      { label: '일치', value: 'equals' },
      { label: '시작', value: 'startsWith' },
      { label: '끝', value: 'endsWith' },
    ],
    number: [
      { label: '=', value: '=' },
      { label: '>', value: '>' },
      { label: '<', value: '<' },
      { label: '≥', value: '>=' },
      { label: '≤', value: '<=' },
    ],
    date: [
      { label: '같음', value: 'equals' },
      { label: '이전', value: 'before' },
      { label: '이후', value: 'after' },
      { label: '사이(between)', value: 'between' },
    ],
    ip: [
      { label: '일치', value: 'equals' },
      { label: '시작', value: 'startsWith' },
      { label: '끝', value: 'endsWith' },
    ],
    mac: [
      { label: '일치', value: 'equals' },
      { label: '시작', value: 'startsWith' },
      { label: '끝', value: 'endsWith' },
    ],
  }

  /** ✅ 서버에서 필터 값 로드 (조건필터 반영 포함) */
  const fetchFilterValues = async (overrideFilterModel) => {
    try {
      const res = await axiosInstance.get('/filtering', {
        params: {
          layer,
          field,
          filterModel: JSON.stringify(overrideFilterModel || getAF()),
          __ts: Date.now(),
        },
      })
      const values = res.data.values || []
      setUniqueValues(values)
      setFilteredValues(values)
    } catch (err) {
      console.error(`[${field}] 필터 값 로드 실패:`, err)
    }
  }

  useEffect(() => {
    fetchFilterValues()
  }, [layer, field])

  /** ✅ 필터 복원 */
  useEffect(() => {
    if (restoredRef.current || uniqueValues.length === 0) return
    const prevFilter = props.context?.activeFilters?.[field]
    if (!prevFilter) return

    if (prevFilter.mode === 'checkbox') {
      const validValues = prevFilter.values?.filter((v) => uniqueValues.includes(v)) || []
      setSelected(validValues)
    } else if (prevFilter.mode === 'condition') {
      setConditions(prevFilter.conditions || [{ op: 'contains', val: '' }])
      setLogicOps(prevFilter.logicOps || [])
    }

    restoredRef.current = true
  }, [uniqueValues, props.context?.activeFilters, field])

  /** 검색 */
  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase()
    setSearch(keyword)
    const filtered = uniqueValues.filter((v) => v?.toString().toLowerCase().includes(keyword))
    setFilteredValues(filtered)
  }

  /** 체크박스 토글 */
  const toggleValue = (val) => {
    setSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]))
  }

  /** ✅ 필터 적용 (핵심 수정) */
  // ✅ CustomCheckboxFilter.jsx - applyFilter 교체본
  const applyFilter = async () => {
    // 1) UI에서 최신 값 수집
    const latestConditions = conditions.map((c, i) => ({
      ...c,
      val: inputRefs.current[i]?.value || '',
    }))
    const hasCondition = latestConditions.some((c) => c.val.trim() !== '')
    const hasSelected = selected.length > 0

    // 2) 현재 필드의 새로운 필터 객체 생성
    let newFilter = null
    if (hasCondition) {
      newFilter = { mode: 'condition', type: fieldType, conditions: latestConditions, logicOps }
    } else if (hasSelected) {
      newFilter = { mode: 'checkbox', values: selected }
    }

    // 3) 컨텍스트(그리드 전역 상태) 먼저 갱신
    props.context?.updateFilter?.(field, newFilter)

    // 4) 서버로 보낼 전체 필터 모델 구성 (null이면 키 제거)
    const nextFilters = JSON.parse(JSON.stringify(getAF())) // 최신 스냅샷
    if (newFilter) nextFilters[field] = newFilter
    else delete nextFilters[field]

    // 5) UI 닫기 + 메뉴 닫기
    setShowConditionPanel(false)
    getApi()?.hidePopupMenu?.()

    // 6) 필터 후보 재조회 (조건이 반영된 값만 받기)
    await fetchFilterValues(nextFilters)

    // 7) 데이터 재조회
    getApi()?.refreshInfiniteCache?.()

    // 8) 검색창 초기화
    setSearch('')
  }

  /** 필터 초기화 */
  const clearFilter = () => {
    setSelected([])
    setConditions([{ op: 'contains', val: '' }])
    setLogicOps([])
    props.context?.updateFilter?.(field, null)
    fetchFilterValues(getAF())
    getApi()?.hidePopupMenu?.()
    getApi()?.refreshInfiniteCache?.()
  }

  /** 조건 추가/삭제 */
  const addCondition = () => {
    setConditions((prev) => [...prev, { op: 'contains', val: '' }])
    setLogicOps((prev) => [...prev, 'AND'])
  }

  const removeCondition = (index) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
    setLogicOps((prev) => prev.filter((_, i) => i !== index && i !== index - 1))
    inputRefs.current.splice(index, 1)
  }

  /** 조건 패널 열기 */
  const handleShowConditionPanel = () => {
    setShowConditionPanel((prev) => {
      const next = !prev
      if (!prev) {
        // 이제 "열리는" 순간임
        const currentFilters = getAF()

        // 1) 현재 필드의 기존 조건을 UI에 복원
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

        // 2) 현재 조건으로 서버에서 체크박스 목록 재조회
        fetchFilterValues(currentFilters).then(() => {
          // 검색어 초기화 + 화면 목록 동기화
          setSearch('')
        })
      }
      return next
    })

    // 위치 계산은 그대로
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.top + window.scrollY - 10, left: rect.right + 12 })
    }
  }

  /** 외부 클릭 닫기 */
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

  /** 조건 패널 */
  const ConditionPanel = () =>
    createPortal(
      <div
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: `${panelPos.top}px`,
          left: `${panelPos.left}px`,
          zIndex: 10000,
          width: 280,
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          border: '1px solid #ddd',
        }}
      >
        <div
          style={{
            background: '#fff',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span>{`조건별 필터 (${fieldType})`}</span>
          <button
            onClick={() => setShowConditionPanel(false)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 16,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 10, maxHeight: 400, overflowY: 'auto' }}>
          {conditions.map((cond, idx) => (
            <div key={idx} style={{ marginBottom: 10 }}>
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
                  style={{
                    width: '100%',
                    marginBottom: 6,
                    padding: 4,
                    fontSize: 12,
                    background: '#f9f9f9',
                  }}
                >
                  <option value='AND'>AND (그리고)</option>
                  <option value='OR'>OR (또는)</option>
                </select>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <select
                    value={cond.op}
                    onChange={(e) =>
                      setConditions((prev) =>
                        prev.map((c, i) => (i === idx ? { ...c, op: e.target.value } : c)),
                      )
                    }
                    style={{ width: '100%', marginBottom: 4, padding: 4, fontSize: 12 }}
                  >
                    {operatorOptions[fieldType]?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <input
                    ref={(el) => (inputRefs.current[idx] = el)}
                    defaultValue={cond.val}
                    type={
                      fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'
                    }
                    placeholder='값 입력...'
                    style={{
                      width: '100%',
                      padding: 5,
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid #ccc',
                    }}
                  />
                </div>

                <button
                  onClick={() => removeCondition(idx)}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#000',
                    cursor: 'pointer',
                    padding: '0 6px',
                    height: 24,
                    background: '#f7f7f7',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCondition}
            style={{
              width: '100%',
              background: '#f6f8fa',
              border: '1px solid #ccc',
              borderRadius: 4,
              fontSize: 12,
              padding: '4px 0',
              cursor: 'pointer',
            }}
          >
            ➕ 조건 추가
          </button>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={applyFilter}
              style={{
                flex: 1,
                background: '#3877BE',
                color: 'white',
                border: 'none',
                borderRadius: 5,
                padding: '5px 0',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              적용
            </button>
            <button
              onClick={() => setShowConditionPanel(false)}
              style={{
                flex: 1,
                background: '#fff',
                border: '1px solid #3877BE',
                color: '#3877BE',
                borderRadius: 5,
                padding: '5px 0',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )

  /** ✅ UI 렌더 */
  return (
    <>
      <div
        style={{
          position: 'relative',
          width: 200,
          padding: 8,
          fontSize: 13,
          border: '1px solid #e0e0e0',
          borderRadius: 6,
          backgroundColor: '#fff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        }}
      >
        <input
          type='text'
          placeholder='검색...'
          value={search}
          onChange={handleSearch}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: 4,
            border: '1px solid #ccc',
            marginBottom: 8,
            fontSize: 12,
          }}
        />

        <button
          ref={buttonRef}
          onClick={handleShowConditionPanel}
          style={{
            width: '100%',
            background: '#f6f8fa',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 12,
            padding: '4px 0',
            cursor: 'pointer',
          }}
        >
          조건별 필터
        </button>

        <div
          style={{
            maxHeight: 180,
            overflowY: 'auto',
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee',
            marginTop: 6,
            padding: '4px 0',
          }}
        >
          {filteredValues.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, padding: '8px 0' }}>
              결과 없음
            </div>
          ) : (
            filteredValues.map((val) => (
              <label key={val} style={{ display: 'block', fontSize: 12, padding: '2px 4px' }}>
                <input
                  type='checkbox'
                  checked={selected.includes(val)}
                  onChange={() => toggleValue(val)}
                  style={{ marginRight: 6 }}
                />
                {val}
              </label>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={applyFilter}
            style={{
              flex: 1,
              background: '#3877BE',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '4px 0',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            적용
          </button>
          <button
            onClick={clearFilter}
            style={{
              flex: 1,
              background: '#fff',
              color: '#3877BE',
              border: '1px solid #3877BE',
              borderRadius: 4,
              padding: '4px 0',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            초기화
          </button>
        </div>
      </div>

      {showConditionPanel && <ConditionPanel />}
    </>
  )
}

export default CustomCheckboxFilter
