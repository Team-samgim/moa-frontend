import axiosInstance from '@/api/axios'

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
  filterModel,
  search = '',
  offset = 0,
  limit = 200,
  signal,
  includeSelf = false,
}) => {
  const { data } = await axiosInstance.get('/filtering', {
    params: {
      layer,
      field,
      filterModel: JSON.stringify(filterModel || {}),
      search,
      offset,
      limit,
      includeSelf,
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
  return data // { layer, columns:[{name,type,labelKo}], rows:[...] }
}
