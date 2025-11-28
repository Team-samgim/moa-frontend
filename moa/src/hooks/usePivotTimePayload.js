// 작성자: 최이서
import { useMemo } from 'react'
import { DEFAULT_TIME_FIELD } from '@/constants/pivot'

export const usePivotTimePayload = (pivotResult, timeRange, customRange) => {
  return useMemo(() => {
    if (!pivotResult?.columnField || !timeRange) return null

    const now = new Date(timeRange.now || new Date())
    let fromEpochMs
    let toEpochMs

    if (timeRange.type === 'custom' && customRange?.from && customRange?.to) {
      fromEpochMs = new Date(customRange.from).getTime()
      toEpochMs = new Date(customRange.to).getTime()
    } else {
      toEpochMs = now.getTime()
      const value = timeRange.value || '1h'
      const match = value.match(/^(\d+)([hdw])$/)

      if (match) {
        const num = parseInt(match[1], 10)
        const unit = match[2]

        const ms = unit === 'h' ? 3600000 : unit === 'd' ? 86400000 : 604800000 // w

        fromEpochMs = toEpochMs - num * ms
      } else {
        fromEpochMs = toEpochMs - 3600000
      }
    }

    return {
      field: DEFAULT_TIME_FIELD,
      fromEpoch: Math.floor(fromEpochMs / 1000),
      toEpoch: Math.floor(toEpochMs / 1000),
    }
  }, [pivotResult, timeRange, customRange])
}
