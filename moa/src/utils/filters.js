/**
 * Filter Utility (Grid ActiveFilters → SearchDTO 변환)
 *
 * 목적:
 * - ag-Grid 기반 activeFilters 구조를 API SearchDTO.conditions 규격으로 변환
 * - UI의 조건식(contains, between, startsWith 등)을 서버 표준 연산자(EQ, LIKE 등)로 매핑
 * - 컬럼 타입(string/number/date/ip/mac)에 따라 value 타입 보정(숫자 캐스팅 등)
 *
 * 구성 요소:
 * - TYPE_TO_DATATYPE     : 프론트 필터 타입 → 서버 데이터타입 매핑
 * - mapConditionOp       : UI 연산자 → SearchDTO 연산자 매핑
 * - coerceNumber         : 숫자 필드 안전 변환기
 * - buildConditionsFromActiveFilters
 *   → activeFilters + colTypes 입력 → [{ join, field, op, values, dataType }] 리스트 생성
 *
 * AUTHOR: 방대혁
 */

// src/utils/filters.js
export const TYPE_TO_DATATYPE = {
  string: 'TEXT',
  number: 'NUMBER',
  ip: 'IP',
  date: 'DATETIME',
  boolean: 'BOOLEAN',
  mac: 'TEXT',
}

export function mapConditionOp(op, fieldType) {
  const isNumber = fieldType === 'number'
  switch (op) {
    case 'contains':
      return isNumber ? 'EQ' : 'LIKE'
    case 'startsWith':
      return isNumber ? 'EQ' : 'STARTS_WITH'
    case 'endsWith':
      return isNumber ? 'EQ' : 'ENDS_WITH'
    case 'equals':
    case '=':
      return 'EQ'
    case 'ne':
      return 'NE'
    case '>':
      return 'GT'
    case '>=':
      return 'GTE'
    case '<':
      return 'LT'
    case '<=':
      return 'LTE'
    case 'between':
      return 'BETWEEN'
    case 'before':
      return 'LT'
    case 'after':
      return 'GTE'
    default:
      return isNumber ? 'EQ' : 'LIKE'
  }
}

function coerceNumber(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** activeFilters → SearchDTO.conditions */
export function buildConditionsFromActiveFilters(activeFilters, colTypes) {
  const out = []
  Object.entries(activeFilters || {}).forEach(([field, def]) => {
    const fType = colTypes[field] || 'string'
    const dataType = TYPE_TO_DATATYPE[fType] || 'TEXT'

    if (def.mode === 'checkbox') {
      const raw = def.values || []
      const vals = fType === 'number' ? raw.map(coerceNumber).filter((x) => x !== null) : raw
      if (vals.length)
        out.push({ join: out.length ? 'AND' : null, field, op: 'IN', values: vals, dataType })
      return
    }

    if (def.mode === 'condition') {
      const conds = def.conditions || []
      conds.forEach((c, idx) => {
        const op = mapConditionOp(c.op, fType)
        const join = out.length === 0 && idx === 0 ? null : def.logicOps?.[idx - 1] || 'AND'

        if (op === 'BETWEEN') {
          let a, b
          if (Array.isArray(c.values) && c.values.length >= 2) {
            ;[a, b] = c.values
          } else if (typeof c.val === 'string' && c.val.includes(',')) {
            ;[a, b] = c.val.split(',')
          } else if (c.val1 !== undefined || c.val2 !== undefined) {
            a = c.val1
            b = c.val2
          }
          if (fType === 'number') {
            a = coerceNumber(a)
            b = coerceNumber(b)
          }
          if (a !== null && b !== null && a !== undefined && b !== undefined) {
            out.push({ join, field, op, values: [a, b], dataType })
          }
        } else {
          let v = Array.isArray(c.values) ? c.values[0] : (c.val ?? c.value ?? '')
          if (fType === 'number') v = coerceNumber(v)
          if (v !== null && v !== undefined && (fType !== 'number' || Number.isFinite(v))) {
            out.push({ join, field, op, values: [v], dataType })
          }
        }
      })
    }
  })
  return out
}
