import axiosInstance from '@/api/axios'

export async function getHttpPageMetrics(rowKey, opts = {}) {
  if (!rowKey) throw new Error('rowKey is required')
  const { data } = await axiosInstance.get(`/details/http-page/${encodeURIComponent(rowKey)}`, {
    signal: opts.signal,
  })
  return data
}
