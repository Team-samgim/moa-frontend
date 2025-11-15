import { uid, fixEpochRange, inferPresetKey } from '@/utils/misc'

// 저장된 SEARCH preset의 config → SearchPage에서 쓸 spec으로 변환
export const toSearchSpecFromConfig = (cfg = {}) => {
  // 새 구조: { search: { ... } } 로 저장되어 있음
  // 혹시 search만 바로 넘어오는 경우도 지원
  const search = cfg.search || cfg

  // ---- 시간 정보 복원 ----
  // 1) search.time 우선
  // 2) 예전 구조(search.baseSpec.time) fallback
  const timeSrc = (search.time && search.time) || (search.baseSpec && search.baseSpec.time) || {}

  const hasAbs = Number.isFinite(timeSrc.fromEpoch) && Number.isFinite(timeSrc.toEpoch)

  let customTimeRange = null
  let time = undefined

  if (hasAbs) {
    const { fromEpoch, toEpoch } = fixEpochRange(timeSrc.fromEpoch, timeSrc.toEpoch)
    customTimeRange = {
      fromEpoch,
      toEpoch,
      from: new Date(fromEpoch * 1000),
      to: new Date(toEpoch * 1000),
    }
    time = {
      field: timeSrc.field || 'ts_server_nsec',
      fromEpoch,
      toEpoch,
    }
  }

  // ---- 조건(필드 + 연산자 + 값들) 복원 ----
  const rawConds =
    (Array.isArray(search.condition) && search.condition) ||
    (search.query && Array.isArray(search.query.conditions) && search.query.conditions) ||
    (search.baseSpec && Array.isArray(search.baseSpec.conditions) && search.baseSpec.conditions) ||
    []

  const conditions = rawConds.map((c, i) => {
    const valuesArr = Array.isArray(c.values)
      ? c.values
      : c.value !== null && c.value !== undefined
        ? [c.value]
        : []

    return {
      id: uid(),
      join: typeof c.join === 'string' ? c.join : i === 0 ? 'AND' : 'AND',
      fieldKey: c.fieldKey || c.field || '',
      dataType: c.dataType || 'TEXT',
      operator: c.operator || c.op || 'EQ',
      values: valuesArr,
    }
  })

  // ---- layer / 조회 필드 복원 ----
  const layer =
    search.layer || (search.baseSpec && search.baseSpec.layer) || cfg.layer || 'HTTP_PAGE'

  const viewKeys = Array.isArray(search.columns)
    ? search.columns
    : search.baseSpec && Array.isArray(search.baseSpec.columns)
      ? search.baseSpec.columns
      : []

  // ---- 글로벌 NOT, 타임 프리셋 복원 ----
  let globalNot = false
  if (search.query && typeof search.query.globalNot === 'boolean') {
    globalNot = search.query.globalNot
  } else if (typeof search.globalNot === 'boolean') {
    globalNot = search.globalNot
  } else if (search.baseSpec && typeof search.baseSpec.not === 'boolean') {
    globalNot = search.baseSpec.not
  }

  const timePreset =
    (search.query && search.query.timePreset) ||
    search.timePreset ||
    (hasAbs ? 'CUSTOM' : inferPresetKey(timeSrc.fromEpoch, timeSrc.toEpoch))

  // 🔹 SearchPage useEffect에서 그대로 쓸 spec 형태로 반환
  // SearchPage에서는:
  //   setLayer(spec.layer)
  //   setViewKeys(spec.viewKeys)
  //   setConditions(spec.conditions)
  //   setGlobalNot(spec.globalNot)
  //   setTimePreset(spec.timePreset)
  //   setCustomTimeRange(spec.customTimeRange)
  return {
    layer,
    viewKeys,
    conditions,
    globalNot,
    timePreset,
    customTimeRange,
    time, // spec.time.{fromEpoch,toEpoch}도 같이 넘겨줌 (fallback용)
  }
}
