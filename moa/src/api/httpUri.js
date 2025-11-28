/* ------------------------------------------------------------------
 * HTTP URI 메트릭 조회
 *
 * 요청: GET /details/http-uri/{rowKey}
 *
 * 파라미터:
 *  - rowKey: string (필수)
 *  - signal: AbortSignal (react-query에서 제공)
 *
 * 처리 로직:
 *  - rowKey 없으면 즉시 에러 throw
 *  - 요청 취소(CanceledError)는 그대로 throw (react-query가 처리)
 *  - 404 응답 → null 반환
 *  - 정상 응답은 그대로 반환
 *
 * 반환 예:
 *  {
 *    uri: "/api/member",
 *    count: 120,
 *    failCount: 4,
 *    avgResTime: 0.32,
 *    methods: {...},
 *    timings: {...},
 *    ...
 *  }
 * ------------------------------------------------------------------ */
import axiosInstance from '@/api/axios'

export async function getHttpUriMetrics(rowKey, { signal } = {}) {
  if (!rowKey) throw new Error('rowKey is required')

  try {
    const res = await axiosInstance.get(`/details/http-uri/${encodeURIComponent(rowKey)}`, {
      signal,
    })

    return res.data
  } catch (e) {
    // react-query에서 취소한 경우 그대로 throw
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') throw e

    // 404 → 데이터 없음
    if (e.response && e.response.status === 404) return null

    // 그 외 오류는 그대로 throw
    throw e
  }
}
