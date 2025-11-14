import axiosInstance from '@/api/axios'

export async function getHttpUriMetrics(rowKey, { signal } = {}) {
  if (!rowKey) throw new Error('rowKey is required')

  try {
    const res = await axiosInstance.get(`/details/http-uri/${encodeURIComponent(rowKey)}`, {
      signal,
    })
    return res.data
  } catch (e) {
    // 요청 취소는 그대로 던져서 react-query가 처리
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') throw e

    // 404는 null 반환 (데이터 없음)
    if (e.response && e.response.status === 404) return null

    // 나머지 에러는 그대로 throw
    throw e
  }
}
