/**
 * misc utilities
 *
 * 목적:
 * - 공통적으로 쓰이는 경량 유틸 함수 모음
 * - className 병합, UID 생성, 시간 범위 판별, 연산자 표기 변환 등
 *
 * 함수 목록:
 * - cx(...args): truthy 값만 join
 * - uid(): 랜덤 7자리 문자열 생성
 * - near(x, target, tol): 숫자가 target 근처인지 판별
 * - inferPresetKey(fromEpoch, toEpoch): 프리셋 시간 범위 판단 (1H, 2H, 24H, 7D, CUSTOM)
 * - fixEpochRange(a,b): epoch 범위 정렬 (from ≤ to)
 * - prettyOp(op): EQ → "=", GTE → ">=" 등 사람이 읽기 쉬운 연산자로 변환
 * - fmtDate(input): createdAt/updatedAt 자동 추출 후 locale string 변환
 *
 * AUTHOR: 방대혁
 */

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
