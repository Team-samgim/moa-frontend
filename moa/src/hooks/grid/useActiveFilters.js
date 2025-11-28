import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * useActiveFilters
 * - 그리드/검색 UI에서 필터 상태를 관리하는 커스텀 훅
 *
 * 기능:
 * 1) activeFilters: 현재 적용된 필터 객체
 *    예: { status: { op: 'eq', value: '200' }, method: { op: 'in', value: ['GET'] } }
 *
 * 2) activeFiltersRef: 최신 필터 상태를 항상 참조하기 위한 ref
 *    - 비동기 이벤트, 모달, 외부 핸들러에서 stale state 문제 방지
 *
 * 3) updateFilter(field, filterData)
 *    - 특정 필드 필터 추가/수정
 *    - filterData가 falsy면 필터 제거
 *
 * 4) setActiveFilters
 *    - 필터 객체 전체를 외부에서 직접 갱신하고 싶을 때 사용
 *
 * AUTHOR: 방대혁
 */
export default function useActiveFilters() {
  // 현재 필터 상태
  const [activeFilters, setActiveFilters] = useState({})

  // 최신 상태 보관(ref는 변경되어도 리렌더링 안 일어남)
  const activeFiltersRef = useRef(activeFilters)

  // state 변경 시 ref 최신화
  useEffect(() => {
    activeFiltersRef.current = activeFilters
  }, [activeFilters])

  /**
   * 개별 필터 업데이트
   * - filterData가 null/undefined → 해당 필터 삭제
   * - filterData가 존재 → 해당 필터 갱신
   */
  const updateFilter = useCallback((field, filterData) => {
    setActiveFilters((prev) => {
      const next = { ...prev }

      if (!filterData) {
        delete next[field] // 필터 제거
      } else {
        next[field] = filterData // 필터 설정
      }

      return next
    })
  }, [])

  return { activeFilters, activeFiltersRef, updateFilter, setActiveFilters }
}
