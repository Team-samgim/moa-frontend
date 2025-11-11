import { uid, fixEpochRange, inferPresetKey } from '@/utils/misc'

// 저장된 export의 config → SearchPage payload 변환
export const toSearchSpecFromConfig = (cfg = {}) => {
  const base = cfg.baseSpec || {}
  const time = base.time || {}

  const hasAbs = Number.isFinite(time?.fromEpoch) && Number.isFinite(time?.toEpoch)
  let customTimeRange = null
  if (hasAbs) {
    const { fromEpoch, toEpoch } = fixEpochRange(time.fromEpoch, time.toEpoch)
    customTimeRange = {
      fromEpoch,
      toEpoch,
      from: new Date(fromEpoch * 1000),
      to: new Date(toEpoch * 1000),
    }
  }

  const conditions = (base.conditions || []).map((c, i) => ({
    id: uid(),
    join: i === 0 ? 'AND' : 'AND',
    fieldKey: c.field,
    dataType: c.dataType || 'TEXT',
    operator: c.op,
    values: Array.isArray(c.values)
      ? c.values
      : c.value !== null && c.value !== undefined
        ? [c.value]
        : [],
  }))

  return {
    layer: cfg.layer || base.layer || 'HTTP_PAGE',
    viewKeys: Array.isArray(cfg.columns) ? cfg.columns : base.columns || [],
    conditions,
    globalNot: !!base.not,
    timePreset: hasAbs
      ? 'CUSTOM'
      : cfg.query?.timePreset || inferPresetKey(time.fromEpoch, time.toEpoch),
    customTimeRange,
  }
}
