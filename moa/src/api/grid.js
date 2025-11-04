import axiosInstance from '@/api/axios'

export const fetchFilterValues = async ({
  layer,
  field,
  filterModel,
  search = '',
  after = null,
  offset = 0,
  limit = 50,
  signal,
  includeSelf = false,
}) => {
  const params = {
    layer,
    field,
    filterModel: JSON.stringify(filterModel || {}),
    search,
    limit,
    includeSelf,
    __ts: Date.now(),
  }
  if (after !== null) params.after = after
  else params.offset = offset

  const { data } = await axiosInstance.get('/filtering', { params, signal })
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

export const fetchGridPage = async ({
  basePayload, // buildSearchPayload(...) 결과 (레이어, 조건, 시간 프리셋 등)
  offset,
  limit,
  sortField,
  sortDirection,
  filterModel, // CustomCheckboxFilter가 만든 {field: {mode,...}} 원본(클라이언트 스냅샷)
}) => {
  const payload = {
    ...basePayload,
    paging: { offset, limit },
    sort: sortField ? { field: sortField, direction: sortDirection || 'asc' } : null,
    filterModel: filterModel || {}, // 서버가 이해하는 포맷이면 그대로, 아니라면 서버에서 매핑
  }
  const { data } = await axiosInstance.post('/grid/search', payload)
  // 서버는 { rows, total(optional), columns(optional) } 형태로 응답하도록 가정
  return data
}
