import { buildConditionsFromActiveFilters } from '@/utils/filters'

function guessFieldType(def) {
  const toArray = (x) => (Array.isArray(x) ? x : x !== null ? [x] : [])
  const vals =
    def.mode === 'checkbox'
      ? toArray(def.values)
      : toArray(
          def?.conditions?.flatMap((c) =>
            Array.isArray(c.values) ? c.values : [c.val ?? c.value ?? c.val1, c.val2],
          ),
        )

  const numeric = vals
    .filter((v) => v !== '' && v !== null && v !== undefined)
    .every((v) => Number.isFinite(Number(v)))
  return numeric ? 'number' : 'string'
}

function buildColTypesFromFilters(filterModel = {}) {
  const colTypes = {}
  for (const [field, def] of Object.entries(filterModel)) {
    colTypes[field] = guessFieldType(def) // 'number' | 'string' 추론
  }
  return colTypes
}

// baseSpec.conditions 와 filters → conditions 를 머지(중복 제거)
function mergeConditions(baseSpec = {}, filters = {}) {
  const baseConds = Array.isArray(baseSpec.conditions) ? baseSpec.conditions : []

  // filters → 조건 표준화
  const colTypes = buildColTypesFromFilters(filters)
  const filterConds = buildConditionsFromActiveFilters(filters, colTypes)

  const sig = (c) => `${c.field}|${c.op}|${JSON.stringify(c.values)}|${c.dataType}`
  const map = new Map()
  for (const c of baseConds) map.set(sig(c), c)
  for (const c of filterConds) map.set(sig(c), c)
  return Array.from(map.values())
}

export function normalizePresetConfig(config = {}) {
  const layer = config.layer || config.baseSpec?.layer
  const columns = config.columns || config.baseSpec?.columns || []
  const baseSpec = config.baseSpec || {}
  const filters = config.filters || {}

  const conditions = mergeConditions(baseSpec, filters)

  // timePreset은 저장 안되어도 상세뷰에서 from/to로 배지 추론 가능
  const query = {
    layer,
    viewKeys: columns,
    globalNot: !!baseSpec?.not,
    conditions,
    timePreset: config.timePreset || baseSpec.timePreset || undefined,
    customTimeRange: undefined,
  }

  return { ...config, query }
}
