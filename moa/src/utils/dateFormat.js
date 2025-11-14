import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(timezone)

export const formatUtcToSeoul = (value) =>
  value ? dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss') : ''

export const isoToSeoulInputValue = (iso) =>
  iso ? dayjs.utc(iso).tz('Asia/Seoul').format('YYYY-MM-DDTHH:mm') : ''

export const seoulInputValueToDate = (value) => {
  if (!value) return null
  const d = dayjs.tz(value, 'Asia/Seoul')
  return d.isValid() ? d.toDate() : null
}
