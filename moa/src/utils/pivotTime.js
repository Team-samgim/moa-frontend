// 작성자: 최이서
import { DEFAULT_TIME_FIELD } from '@/constants/pivot'

const buildTimePayload = (timeRange, customRange) => {
  const field = DEFAULT_TIME_FIELD // 'ts_server_nsec'

  const baseDate = timeRange && timeRange.now ? new Date(timeRange.now) : new Date()
  const baseSec = Math.floor(baseDate.getTime() / 1000) // ms → sec

  if (timeRange && timeRange.type === 'preset') {
    let fromSec = baseSec

    switch (timeRange.value) {
      case '1h':
        fromSec = baseSec - 60 * 60
        break
      case '2h':
        fromSec = baseSec - 2 * 60 * 60
        break
      case '24h':
        fromSec = baseSec - 24 * 60 * 60
        break
      case '1w':
        fromSec = baseSec - 7 * 24 * 60 * 60
        break
      default:
        fromSec = baseSec - 60 * 60
    }

    return {
      field,
      fromEpoch: fromSec,
      toEpoch: baseSec,
    }
  }

  // 커스텀 기간
  let fromSec = null
  let toSec = null

  if (customRange) {
    let fromDate = customRange.from
    let toDate = customRange.to

    if (fromDate && !(fromDate instanceof Date)) {
      fromDate = new Date(fromDate)
    }
    if (toDate && !(toDate instanceof Date)) {
      toDate = new Date(toDate)
    }

    if (fromDate) fromSec = Math.floor(fromDate.getTime() / 1000)
    if (toDate) toSec = Math.floor(toDate.getTime() / 1000)
  }

  return {
    field,
    fromEpoch: fromSec,
    toEpoch: toSec,
  }
}

export { buildTimePayload }
