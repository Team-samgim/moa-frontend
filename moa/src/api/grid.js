import axiosInstance from '@/api/axios'

const toJsonParam = (v) => {
  if (v === null) return undefined
  return typeof v === 'string' ? v : JSON.stringify(v) // 한 번만 문자열화
}

export const fetchFilterValues = async ({
  layer,
  field,
  filterModel, // object 또는 string 둘 다 허용
  baseSpec, // object 또는 string 둘 다 허용
  search = '',
  offset = 0,
  limit = 200,
  signal,
  includeSelf = false,
  orderBy,
  order,
}) => {
  const { data } = await axiosInstance.get('/filtering', {
    params: {
      layer,
      field,
      filterModel: toJsonParam(filterModel) ?? '{}',
      baseSpec: toJsonParam(baseSpec),
      search,
      offset,
      limit,
      includeSelf,
      orderBy,
      order,
      __ts: Date.now(),
    },
    signal,
  })
  return data
}

export const fetchAggregates = async ({ layer, aggFilters, metrics, baseSpec }) => {
  const { data } = await axiosInstance.post('/aggregate', {
    layer,
    filterModel: JSON.stringify(aggFilters || {}),
    baseSpecJson: baseSpec ? JSON.stringify(baseSpec) : null,
    metrics, // { [field]: { type: 'number'|'string', ops: [...] } }
  })
  return data // { aggregates: { [field]: {...} } }
}

export const exportGrid = async (payload, signal) => {
  const { data } = await axiosInstance.post('/exports/grid', payload, { signal })
  return data
}

export const fetchGridBySearchSpec = async (payload) => {
  const { data } = await axiosInstance.post('/grid/search', payload)
  console.log('grid data', data)
  return data // { layer, columns:[{name,type,labelKo}], rows:[...] }
}

export const fetchRows = async ({
  layer,
  offset = 0,
  limit = 100,
  sortField,
  sortDirection,
  filterModel,
}) => {
  const orderBy = sortField || 'ts_server_nsec'
  const order = (sortDirection || 'DESC').toUpperCase()

  const { data } = await axiosInstance.post('/grid/search', {
    layer,
    columns: [],
    time: {
      field: 'ts_server_nsec',
      fromEpoch: Math.floor(Date.now() / 1000) - 3600, // 최근 1시간 데이터 (선택)
      toEpoch: Math.floor(Date.now() / 1000),
    },
    conditions: [], // TODO: 필요 시 filterModel 변환 후 반영
    options: {
      orderBy,
      order,
      limit,
      offset,
    },
    filterModel: filterModel || {},
  })
  console.log(`[fetchRows] 요청됨 → orderBy=${orderBy}, order=${order}`)
  return data
}
