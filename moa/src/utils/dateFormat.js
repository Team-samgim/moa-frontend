import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export const formatUtcToSeoul = (value) =>
  value ? dayjs.utc(value).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss') : ''
