import axiosInstance from '@/api/axios'

const toJsonParam = (v) => {
  if (v === null) return undefined
  return typeof v === 'string' ? v : JSON.stringify(v) // 한 번만 문자열화
}

export const fetchColumns = async ({ layer, offset = 0, limit = 1 }) => {
  const { data } = await axiosInstance.get('/randering', { params: { layer, offset, limit } })
  return data
}

export const fetchRows = async ({
  layer,
  offset,
  limit,
  sortField,
  sortDirection,
  filterModel,
}) => {
  const params = { layer, offset, limit }
  if (sortField) params.sortField = sortField
  if (sortDirection) params.sortDirection = sortDirection
  if (filterModel && Object.keys(filterModel).length > 0) {
    params.filterModel = JSON.stringify(filterModel)
  }
  const { data } = await axiosInstance.get('/randering', { params })
  return data
}

export const fetchFilterValues = async ({
  layer,
  field,
  filterModel, // object 또는 string 둘 다 허용
  baseSpec, // object 또는 string 둘 다 허용 (이걸 실제로 쿼리에 붙임)
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
      baseSpec: toJsonParam(baseSpec), // ✅ 여기 핵심
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

export const fetchAggregates = async ({ layer, filterModel, metrics }) => {
  const { data } = await axiosInstance.post('/aggregate', {
    layer,
    filterModel: JSON.stringify(filterModel || {}),
    metrics, // { [field]: { type: 'number'|'string'|'ip'|'mac', ops: [...] } }
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
