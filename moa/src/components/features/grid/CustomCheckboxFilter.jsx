// src/components/filters/CustomCheckboxFilter.jsx
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
// ✅ 서비스 제거: api 경로로 교체
import { fetchFilterValues as apiFetchFilterValues } from '@/api/grid'
import { OPERATOR_OPTIONS } from '@/constants/filterOperators'

const CustomCheckboxFilter = (props) => {
  const [uniqueValues, setUniqueValues] = useState([])
  const [filteredValues, setFilteredValues] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [showConditionPanel, setShowConditionPanel] = useState(false)
  const [conditions, setConditions] = useState([{ op: 'contains', val: '', val1: '', val2: '' }])
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

  // 서버에서 체크박스 후보 로드
  const fetchFilterValues = async (overrideFilterModel) => {
    try {
      const values = await apiFetchFilterValues({
        layer,
        field,
        filterModel: overrideFilterModel || getAF(),
      })
      setUniqueValues(values)
      setFilteredValues(values)
    } catch (err) {
      console.error(`[${field}] 필터 값 로드 실패:`, err)
    }
  }

  useEffect(() => {
    fetchFilterValues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, field])

  // 기존 필터 복원
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueValues])

  // 검색
  const handleSearch = (e) => {
    const keyword = (e.target.value || '').toLowerCase()
    setSearch(keyword)
    const filtered = uniqueValues.filter((v) => v?.toString().toLowerCase().includes(keyword))
    setFilteredValues(filtered)
  }

  // 체크박스 토글
  const toggleValue = (val) => {
    setSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]))
  }

  // 필터 적용
  const applyFilter = async () => {
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
      newFilter = { mode: 'checkbox', values: selected }
    }

    // 전역 상태 갱신
    props.context?.updateFilter?.(field, newFilter)

    // 최신 스냅샷 구성
    const nextFilters = JSON.parse(JSON.stringify(getAF()))
    if (newFilter) nextFilters[field] = newFilter
    else delete nextFilters[field]

    // 닫고 갱신
    setShowConditionPanel(false)
    getApi()?.hidePopupMenu?.()

    await fetchFilterValues(nextFilters) // 후보 갱신
    getApi()?.refreshInfiniteCache?.() // 데이터 재조회
    setSearch('')
  }

  const addCondition = () => {
    setConditions((prev) => [...prev, { op: 'contains', val: '', val1: '', val2: '' }])
    setLogicOps((prev) => [...prev, 'AND'])
  }

  const removeCondition = (index) => {
    setConditions((prev) => prev.filter((_, i) => i !== index))
    setLogicOps((prev) => prev.filter((_, i) => i !== index && i !== index - 1))
    inputRefs.current.splice(index, 1)
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
        fetchFilterValues(currentFilters).then(() => setSearch(''))
      }
      return next
    })

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPanelPos({ top: rect.top + window.scrollY - 10, left: rect.right + 12 })
    }
  }

  // 외부 클릭으로 패널 닫기
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

  // 패널 UI (포털)
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

                  {/* 단일값 입력 */}
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

                  {/* 날짜 between */}
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
                  onClick={() => removeCondition(idx)}
                  className='h-6 cursor-pointer rounded border border-gray-300 bg-gray-100 px-1.5 text-[13px] font-semibold'
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addCondition}
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

  // 메인 렌더
  return (
    <>
      <div className='relative w-[200px] rounded-md border border-gray-200 bg-white p-2 text-[13px] shadow-sm'>
        <input
          type='text'
          placeholder='검색...'
          value={search}
          onChange={handleSearch}
          className='mb-2 w-full rounded border border-gray-300 px-2 py-1 text-[12px]'
        />

        <button
          ref={buttonRef}
          onClick={handleShowConditionPanel}
          className='w-full cursor-pointer rounded border border-gray-300 bg-gray-50 py-1 text-[12px]'
        >
          조건별 필터
        </button>

        <div className='mt-1 max-h-[180px] overflow-y-auto border-y border-gray-100 py-1'>
          {filteredValues.length === 0 ? (
            <div className='py-2 text-center text-[12px] text-gray-400'>결과 없음</div>
          ) : (
            filteredValues.map((val) => (
              <label key={val} className='block cursor-pointer px-1.5 py-0.5 text-[12px]'>
                <input
                  type='checkbox'
                  checked={selected.includes(val)}
                  onChange={() => toggleValue(val)}
                  className='mr-1.5'
                />
                {val}
              </label>
            ))
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
