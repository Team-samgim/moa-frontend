/**
 * Date/Time Utility (Seoul & UTC 변환 모음)
 *
 * 목적:
 * - UTC/ISO/Epoch 기반의 시간 값을 한국(Asia/Seoul) 기준으로 변환하거나
 *   Input[type=datetime-local] 과 호환되는 형태로 포매팅하는 헬퍼 함수 모음.
 *
 * 제공 함수:
 * - formatUtcToSeoul     : UTC 문자열 → "YYYY-MM-DD HH:mm:ss" (한국시간)
 * - isoToSeoulInputValue : ISO → datetime-local 입력값 형태("YYYY-MM-DDTHH:mm")
 * - seoulInputValueToDate: datetime-local 입력값 → JS Date(Asia/Seoul 기준)
 * - epochSecToIsoUtc     : Epoch(초) → ISO UTC 문자열
 *
 * 사용 라이브러리:
 * - dayjs + utc + timezone 플러그인
 *
 * AUTHOR: 방대혁
 */

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// dayjs 확장
dayjs.extend(utc)
dayjs.extend(timezone)

/** UTC 값을 한국시간(Seoul) 기준으로 사람이 읽기 쉬운 문자열로 변환 */
export const formatUtcToSeoul = (value) =>
  value ? dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss') : ''

/** ISO → datetime-local input 포맷("YYYY-MM-DDTHH:mm") */
export const isoToSeoulInputValue = (iso) =>
  iso ? dayjs.utc(iso).tz('Asia/Seoul').format('YYYY-MM-DDTHH:mm') : ''

/** datetime-local input 문자열을 Asia/Seoul 기준 Date 객체로 변환 */
export const seoulInputValueToDate = (value) => {
  if (!value) return null
  const d = dayjs.tz(value, 'Asia/Seoul')
  return d.isValid() ? d.toDate() : null
}

/** Epoch 초(epochSec) → ISO UTC 문자열 */
export const epochSecToIsoUtc = (epochSec) => {
  if (epochSec === null) return null
  return dayjs.unix(epochSec).utc().toISOString()
}
