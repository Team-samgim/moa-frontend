/**
 * makeFilterModel
 *
 * 목적:
 * - activeFilters 객체를 서버에 전달 가능한 filterModel 형태로 변환
 *
 * 동작:
 * - checkbox 모드   → { mode: 'checkbox', values: [...] }
 * - condition 모드  → { mode: 'condition', type, conditions, logicOps }
 *
 * 반환:
 * - key: 필드명
 * - value: 필터 설정 객체
 *
 * AUTHOR: 방대혁
 */
export const makeFilterModel = (activeFilters = {}) => {
  const model = {}
  Object.entries(activeFilters).forEach(([key, filter]) => {
    if (!filter) return

    if (filter.mode === 'checkbox') {
      model[key] = {
        mode: 'checkbox',
        values: filter.values || [],
      }
    } else if (filter.mode === 'condition') {
      model[key] = {
        mode: 'condition',
        type: filter.type || 'string',
        conditions: filter.conditions || [],
        logicOps: filter.logicOps || [],
      }
    }
  })

  return model
}
