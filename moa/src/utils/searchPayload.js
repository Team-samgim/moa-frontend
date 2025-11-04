import { DataType } from '@/constants/dataTypes'

const presetToMs = (preset) => {
  switch (preset) {
    case '1H':
      return 60 * 60 * 1000
    case '2H':
      return 2 * 60 * 60 * 1000
    case '24H':
      return 24 * 60 * 60 * 1000
    case '7D':
      return 7 * 24 * 60 * 60 * 1000
    default:
      return 60 * 60 * 1000
  }
}

const coerceValue = (dt, v) => (dt === DataType.NUMBER ? Number(v) : v)

// TEXT일 때 pattern/caseSensitive 추가
const withTextHints = (cond) =>
  cond.dataType === DataType.TEXT ? { ...cond, pattern: 'contains', caseSensitive: false } : cond

export const buildSearchPayload = ({
  layer,
  viewKeys,
  conditions,
  timePreset,
  globalNot,
  fields,
}) => {
  const now = Date.now()
  const toEpoch = Math.floor(now / 1000)
  const fromEpoch = Math.floor((now - presetToMs(timePreset)) / 1000)

  const arityOf = (c) => {
    const f = fields.find((x) => x.key === c.fieldKey)
    const op = (f?.operators || []).find((o) => o.opCode === c.operator)
    return op?.valueArity ?? 1
  }

  const cleaned = conditions
    .map((c, idx) => {
      const arity = arityOf(c)
      const vals = Array.isArray(c.values) ? c.values : []

      if (arity === 0) {
        return withTextHints({
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: [],
          dataType: c.dataType,
        })
      }
      if (arity === 1) {
        const v = (vals[0] ?? '').toString().trim()
        if (!v) return null
        return withTextHints({
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: [coerceValue(c.dataType, v)],
          dataType: c.dataType,
        })
      }
      if (arity === 2) {
        const v1 = (vals[0] ?? '').toString().trim()
        const v2 = (vals[1] ?? '').toString().trim()
        if (!v1 || !v2) return null
        return withTextHints({
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: [coerceValue(c.dataType, v1), coerceValue(c.dataType, v2)],
          dataType: c.dataType,
        })
      }
      if (arity === -1) {
        const list = vals.map((x) => x?.toString().trim()).filter(Boolean)
        if (list.length === 0) return null
        return withTextHints({
          ...(idx > 0 ? { join: c.join } : {}),
          field: c.fieldKey,
          op: c.operator,
          values: list.map((v) => coerceValue(c.dataType, v)),
          dataType: c.dataType,
        })
      }
      return null
    })
    .filter(Boolean)

  // columns = FieldPicker에서 선택한 값
  const columns = Array.isArray(viewKeys) ? viewKeys.filter(Boolean) : []

  return {
    layer,
    columns,
    time: { field: 'ts_server', fromEpoch, toEpoch },
    not: globalNot,
    conditions: cleaned,
  }
}
