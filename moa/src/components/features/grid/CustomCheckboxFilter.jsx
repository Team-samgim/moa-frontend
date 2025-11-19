import React, { useEffect, useState } from 'react'
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

  const [selected, setSelected] = useState([])
  const [showConditionMode, setShowConditionMode] = useState(false)

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
      reloadAll(getAF())
    })
    return () => unsub?.()
  }, [field, reloadAll, props.context])

  // 최초 후보 복원
  useEffect(() => {
    restoreSelected(getAF(), setSelected, setConditions, setLogicOps)
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
    getApi()?.hidePopupMenu?.()
    reloadAll(getAF()).catch(() => {})
    getApi()?.refreshInfiniteCache?.()
  }

  const toggleMode = () => {
    setShowConditionMode((prev) => {
      const next = !prev
      if (next) {
        // 조건 모드로 전환
        const pf = getAF()[field]
        if (pf?.mode === 'condition') {
          setConditions(pf.conditions || [{ op: 'contains', val: '' }])
          setLogicOps(pf.logicOps || [])
        } else {
          setConditions([{ op: 'contains', val: '' }])
          setLogicOps([])
        }
      } else {
        // 체크박스 모드로 전환
        const pf = getAF()[field]
        if (pf?.mode === 'checkbox') {
          setSelected(pf.values || [])
        } else {
          setSelected([])
        }
      }
      return next
    })
  }

  return (
    <div className='relative z-[10000] w-[220px] bg-white text-[13px]'>
      {!showConditionMode ? (
        <>
          {/* 체크박스 모드 */}
          <div className='p-2 border-b border-gray-200'>
            <input
              type='text'
              placeholder='검색'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full rounded border border-gray-300 px-2 py-1 text-[12px] focus:outline-none focus:border-blue-500'
            />
          </div>

          <div className='p-2 border-b border-gray-200'>
            <button
              onClick={toggleMode}
              className='w-full cursor-pointer rounded bg-white border border-gray-300 py-1.5 text-[12px] hover:bg-gray-50 transition-colors'
            >
              조건별 필터
            </button>
          </div>

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

          <div className='p-2 border-t border-gray-200'>
            <button
              onClick={applyFilter}
              className='w-full cursor-pointer rounded bg-[#3877BE] py-1.5 text-[12px] text-white hover:bg-blue-700 transition-colors'
            >
              적용
            </button>
          </div>
        </>
      ) : (
        <>
          {/* 조건 모드 */}
          <div className='p-2 border-b border-gray-200'>
            <button
              onClick={toggleMode}
              className='w-full cursor-pointer rounded bg-white border border-gray-300 py-1.5 text-[12px] hover:bg-gray-50 transition-colors flex items-center justify-center gap-1'
            >
              <span>기본 필터</span>
            </button>
          </div>

          <div className='p-2'>
            <ConditionPanel
              fieldType={fieldType}
              onClose={null}
              conditions={conditions}
              logicOps={logicOps}
              setConditions={setConditions}
              setLogicOps={setLogicOps}
              inputRefs={inputRefs}
              onApply={applyFilter}
              embedded={true}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default CustomCheckboxFilter
