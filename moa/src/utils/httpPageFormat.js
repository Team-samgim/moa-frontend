/**
 * 공통 포맷터 유틸 모음
 *
 * 목적:
 * - 숫자/날짜/시간/바이트 크기 등 UI에서 반복 사용되는 공통 포맷 변환 제공
 *
 * 포함 기능:
 * - prettyBytes(n)       : 바이트 단위를 KB/MB/GB/TB 로 변환
 * - emptyValue(v, txt)   : 값이 비었을 때 fallback 텍스트 반환
 * - formatTimestamp(sec) : epoch(sec) → 한국시간 문자열
 * - formatMs(ms)         : ms → ms/us/s 포맷 문자열
 *
 * AUTHOR: 방대혁
 */

// 바이트 포맷터
export const prettyBytes = (n = 0) => {
  if (n === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

// 값 비었을 때 처리
export const emptyValue = (value, defaultText = '값 없음') => {
  if (value === null || value === undefined || value === '') return defaultText
  if (typeof value === 'number' && isNaN(value)) return defaultText
  return value
}

// epoch(초) → 한국 시간 문자열
export const formatTimestamp = (epoch) => {
  if (!epoch || epoch === 0) return null
  try {
    const date = new Date(epoch * 1000)
    if (date.getFullYear() === 1970) return null
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return null
  }
}

// ms → 문자열
export const formatMs = (ms) => {
  if (!ms || ms < 0) return '0ms'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
