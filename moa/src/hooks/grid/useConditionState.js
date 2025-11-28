import { useRef, useState } from 'react'

/**
 * useConditionState
 *
 * 목적:
 * - 검색 조건 UI 상태(conditions, logicOps, inputRefs)를 관리하는 커스텀 훅.
 * - UI 입력값 기반 → 서버에 전달할 filterModel 형태로 변환하는 buildFilterModelFromUI 제공.
 *
 * 구조:
 * - conditions: [{ op, values, val, val1, val2 }]
 * - logicOps: 조건 간 논리 연산자 배열 (['AND', 'OR', ...])
 * - inputRefs: 각 조건별 input DOM 참조 (val, val1, val2 등)
 *
 * 반환:
 * - conditions, logicOps, inputRefs
 * - setConditions, setLogicOps
 * - buildFilterModelFromUI(): UI → filterModel 변환
 *
 * AUTHOR: 방대혁
 */
export default function useConditionState() {
  /** 개별 조건 상태 */
  const [conditions, setConditions] = useState([
    { op: 'contains', values: [''], val: '', val1: '', val2: '' },
  ])

  /** 조건 사이의 논리 연산자 (AND / OR 등) */
  const [logicOps, setLogicOps] = useState([])

  /** 각 조건 Input DOM 레퍼런스 저장 */
  const inputRefs = useRef([])

  /**
   * buildFilterModelFromUI
   *
   * UI 입력 기반 filterModel 변환 함수.
   *
   * 반환:
   * - hasCondition: 유효한 조건이 하나라도 있는지 여부
   * - latest: 변환된 조건 리스트
   * - logicOps: 동일 반환
   * - inputRefs: 외부에서 접근 필요할 수 있으므로 그대로 반환
   */
  const buildFilterModelFromUI = () => {
    const latest = conditions.map((c, i) => {
      const ref = inputRefs.current[i] || {}
      const next = { op: c.op }

      // between 조건일 때 입력 2개 기반
      if (c.op === 'between' && ref.val1 && ref.val2) {
        next.values = [ref.val1.value || '', ref.val2.value || '']
      } else {
        // 그 외 단일 값 기반 조건
        const v = ref.val?.value ?? (Array.isArray(c.values) ? c.values[0] : c.val) ?? ''

        next.values = [v]
      }

      return next
    })

    // 하나라도 값이 비어 있지 않으면 유효한 조건
    const hasCondition = latest.some((c) => ((c.values?.[0] ?? '') + '').trim() !== '')

    return { hasCondition, latest, logicOps, inputRefs }
  }

  return {
    conditions,
    logicOps,
    inputRefs,
    setConditions,
    setLogicOps,
    buildFilterModelFromUI,
  }
}
