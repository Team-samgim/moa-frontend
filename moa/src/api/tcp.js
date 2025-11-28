/**
 * TCP Metrics API 모듈
 *
 * 기능:
 * - 단일 TCP 상세 메트릭 조회
 *
 * AUTHOR : 방대혁
 */

import axiosInstance from '@/api/axios'

/* ===============================================================
 *  TCP 상세 메트릭 조회
 * =============================================================== */
/**
 * TCP Metrics 조회
 * GET /details/tcp/{rowKey}
 *
 * @param {string} rowKey - TCP rowKey (필수)
 * @param {AbortSignal} signal - 요청 취소 시그널(optional)
 *
 * 반환:
 *   백엔드 TCP 상세 데이터 그대로 반환
 */
export const fetchTcpMetrics = async (rowKey, signal) => {
  if (!rowKey) throw new Error('rowKey is required')

  const { data } = await axiosInstance.get(`/details/tcp/${encodeURIComponent(rowKey)}`, { signal })

  return data
}
