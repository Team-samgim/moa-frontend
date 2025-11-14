import axiosInstance from '@/api/axios'

/**
 * HTTP Page 메트릭 조회 API
 * @param {string} rowKey - HTTP Page row key
 * @param {Object} options - Axios 옵션 (signal 등)
 * @returns {Promise<Object>} HTTP Page 메트릭 데이터
 */
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

    // 404는 null 반환 (데이터 없음)
    if (e.response && e.response.status === 404) return null

    // 나머지 에러는 그대로 throw
    throw e
  }
}
