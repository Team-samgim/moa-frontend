import React, { useEffect, useRef, useState } from 'react'
import ConditionPanel from '@/components/features/grid/ConditionPanel'
import ValueList from '@/components/features/grid/ValueList'
import useConditionState from '@/hooks/grid/useConditionState'
import useFilterData from '@/hooks/grid/useFilterData'

const CustomCheckboxFilter = (props) => {
  const field = props.colDef.field
  const layer = props?.colDef?.filterParams?.layer || 'ethernet'
  const fieldType = props?.colDef?.filterParams?.type || 'string'
  const pageLimit = Math.max(1, Number(props?.colDef?.filterParams?.pageLimit ?? 200))
  const debounceMs = Math.max(0, Number(props?.colDef?.filterParams?.debounceMs ?? 250))

  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  const [selected, setSelected] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const {
    values,
    hasMore,
    loading,
    error,
    search,
    setSearch,
    reloadAll,
    loadMore,
    restoreSelected,
  } = useFilterData({ layer, field, fieldType, context: props.context, pageLimit, debounceMs })

  const { conditions, logicOps, inputRefs, setConditions, setLogicOps, buildFilterModelFromUI } =
    useConditionState()

  const getAF = () => props.context?.getActiveFilters?.() || {}
  const getApi = () => props.context?.getApi?.()

  // 필터 팝업 열림 이벤트 구독
  useEffect(() => {
    const unsub = props.context?.subscribeFilterMenuOpen?.(field, () => {
      setSelected([])
      reloadAll()
    })
    return () => unsub?.()
  }, [field, reloadAll, props.context])

  // 최초 후보 복원
  useEffect(() => {
    restoreSelected(props.context?.activeFilters, setSelected, setConditions, setLogicOps)
  }, [values]) // eslint-disable-line

  const toggleValue = (val) => {
    setSelected((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]))
  }

  const onScrollList = (e) => {
    if (!hasMore || loading) return
    const el = e.currentTarget
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (nearBottom) loadMore()
  }

  const applyFilter = () => {
    const { hasCondition, latest, logicOps: ops } = buildFilterModelFromUI(fieldType)
    const hasSelected = selected.length > 0

    let newFilter = null
    if (hasCondition)
      newFilter = { mode: 'condition', type: fieldType, conditions: latest, logicOps: ops }
    else if (hasSelected) newFilter = { mode: 'checkbox', type: fieldType, values: selected }

    props.context?.updateFilter?.(field, newFilter)

    // 최신 필터 스냅샷 기반 다시 로드 + 그리드 새로고침
    setShowPanel(false)
    getApi()?.hidePopupMenu?.()
    reloadAll(getAF()).catch(() => {})
    getApi()?.refreshInfiniteCache?.()
  }

  const openPanel = () => {
    setShowPanel((prev) => {
      const next = !prev
      if (!prev) {
        const pf = getAF()[field]
        if (pf?.mode === 'checkbox') setSelected(pf.values || [])
        else if (pf?.mode === 'condition') {
          setConditions(pf.conditions || [{ op: 'contains', val: '' }])
          setLogicOps(pf.logicOps || [])
        } else {
          setSelected([])
          setConditions([{ op: 'contains', val: '' }])
          setLogicOps([])
        }
      }
      return next
    })
    const rect = buttonRef.current.getBoundingClientRect()
    setPanelPos({ top: rect.top + window.scrollY - 10, left: rect.right + 12 })
  }

  useEffect(() => {
    if (!showPanel) return
    const onDown = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPanel])

  return (
    <>
      <div className='relative w-[220px] rounded-md border border-gray-200 bg-white p-2 text-[13px] shadow-sm'>
        <input
          type='text'
          placeholder='검색(접두어 일치)...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='mb-2 w-full rounded border border-gray-300 px-2 py-1 text-[12px]'
        />
        <button
          ref={buttonRef}
          onClick={openPanel}
          className='w-full cursor-pointer rounded border border-gray-300 bg-gray-50 py-1 text-[12px]'
        >
          조건별 필터
        </button>

        <ValueList
          values={values}
          selected={selected}
          toggle={toggleValue}
          onScroll={onScrollList}
          loading={loading}
          hasMore={hasMore}
          loadMore={loadMore}
          error={error}
        />

        <div className='mt-2 flex gap-1.5'>
          <button
            onClick={applyFilter}
            className='flex-1 cursor-pointer rounded bg-[#3877BE] py-1 text-[12px] text-white'
          >
            적용
          </button>
        </div>
      </div>

      {showPanel && (
        <ConditionPanel
          fieldType={fieldType}
          panelPos={panelPos}
          onClose={() => setShowPanel(false)}
          conditions={conditions}
          logicOps={logicOps}
          setConditions={setConditions}
          setLogicOps={setLogicOps}
          inputRefs={inputRefs}
          onApply={applyFilter}
        />
      )}
    </>
  )
}

export default CustomCheckboxFilter
