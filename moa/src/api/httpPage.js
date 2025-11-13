import axiosInstance from '@/api/axios'

export async function getHttpPageMetrics(rowKey, { signal } = {}) {
  if (!rowKey) throw new Error('rowKey is required')
  try {
    const res = await axiosInstance.get(`/details/http-page/${encodeURIComponent(rowKey)}`, {
      signal,
    })
    return res.data
  } catch (e) {
    // 요청 취소는 그대로 던져서 react-query가 처리
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') throw e
    if (e.response && e.response.status === 404) return null
    throw e
  }
}
