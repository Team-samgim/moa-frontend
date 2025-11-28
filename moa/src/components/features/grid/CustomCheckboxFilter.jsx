/**
 * CustomCheckboxFilter
 *
 * AG Grid에서 사용하는 커스텀 필터 컴포넌트.
 * 체크박스 기반 필터와 조건 기반 필터 두 가지 방식을 제공한다.
 *
 * 기능 구성:
 * 1) 체크박스 모드
 *    - useFilterData 훅을 사용해 값 목록 조회
 *    - 검색어 입력 및 debounce 처리
 *    - 무한 스크롤 기반 추가 로딩(loadMore)
 *    - 선택된 값 목록(selected) 기반 필터 적용
 *
 * 2) 조건 모드
 *    - ConditionPanel을 통한 조건 기반 필터링
 *    - AND/OR 논리 연산 조합
 *    - 문자열, 숫자, 날짜 타입에 맞는 입력 처리
 *
 * 3) 필터 UI 회복 및 상태 동기화
 *    - activeFilters 기반 값 복원(restoreSelected)
 *    - 필터 메뉴 열림 이벤트 구독 후 reloadAll 수행
 *
 * 4) Grid 연동
 *    - props.context.updateFilter로 필터 상태 저장
 *    - refreshInfiniteCache를 통한 그리드 데이터 재로딩
 *
 * Props:
 * - props.colDef.field: 컬럼 필드명
 * - props.colDef.filterParams: 필터 설정(layer, type, pageLimit 등)
 * - props.context: AG Grid filter context
 *
 * 내부 State:
 * - selected: 체크박스 모드의 선택된 값 배열
 * - showConditionMode: 조건 모드 활성화 여부
 *
 * Hooks:
 * - useFilterData: 값 목록 조회/검색/무한스크롤/리로드 처리
 * - useConditionState: 조건 모드의 조건, 연산자, 입력 참조 관리
 *
 * AUTHOR: 방대혁
 */

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
