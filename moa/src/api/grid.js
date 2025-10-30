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

export const fetchFilterValues = async ({ layer, field, filterModel }) => {
  const { data } = await axiosInstance.get('/filtering', {
    params: { layer, field, filterModel: JSON.stringify(filterModel || {}), __ts: Date.now() },
  })
  return data?.values || []
}
