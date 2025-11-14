export const cx = (...args) => args.filter(Boolean).join(' ')

export const uid = () => Math.random().toString(36).slice(2, 9)

export const near = (x, target, tol = 60) => typeof x === 'number' && Math.abs(x - target) <= tol

export const inferPresetKey = (fromEpoch, toEpoch) => {
  const diff =
    Number.isFinite(fromEpoch) && Number.isFinite(toEpoch) ? Math.abs(toEpoch - fromEpoch) : null
  if (near(diff, 3600)) return '1H'
  if (near(diff, 7200)) return '2H'
  if (near(diff, 86400)) return '24H'
  if (near(diff, 604800)) return '7D'
  return 'CUSTOM'
}

export const fixEpochRange = (a, b) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return { fromEpoch: a, toEpoch: b }
  return a <= b ? { fromEpoch: a, toEpoch: b } : { fromEpoch: b, toEpoch: a }
}

export const prettyOp = (op) => {
  const k = String(op || '').toUpperCase()
  switch (k) {
    case 'EQ':
      return '='
    case 'NE':
      return '!='
    case 'GT':
      return '>'
    case 'GTE':
      return '>='
    case 'LT':
      return '<'
    case 'LTE':
      return '<='
    case 'BETWEEN':
      return 'BETWEEN'
    case 'IN':
      return 'IN'
    case 'NOT IN':
      return 'NOT IN'
    case 'LIKE':
    case 'STARTS_WITH':
    case 'ENDS_WITH':
      return 'LIKE'
    case 'IS':
      return 'IS'
    case 'IS NOT':
      return 'IS NOT'
    default:
      return op || ''
  }
}

export const fmtDate = (input) => {
  const s =
    input && typeof input === 'object' && !(input instanceof Date)
      ? input.createdAt || input.created_at || input.updatedAt || input.updated_at
      : input
  return s ? new Date(s).toLocaleString() : '-'
}
