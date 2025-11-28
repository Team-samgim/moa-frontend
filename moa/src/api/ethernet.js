/**
 * 이더넷 상세 지표 조회 API
 *
 * 기능:
 * - rowKey(필수)를 기반으로 /details/ethernet/{rowKey} 조회
 * - AbortSignal 지원 (요청 취소 가능)
 * - 404일 경우 null 반환 (데이터 없음)
 * - 그 외 오류는 그대로 throw
 *
 * 예외 처리:
 * - 요청 취소(CanceledError, ERR_CANCELED)는 react-query가 처리하도록 재던짐
 *
 * AUTHOR        : 방대혁
 */

import axiosInstance from '@/api/axios'

export async function getEthernetMetrics(rowKey, { signal } = {}) {
  if (!rowKey) throw new Error('rowKey is required')

  try {
    const res = await axiosInstance.get(`/details/ethernet/${encodeURIComponent(rowKey)}`, {
      signal,
    })
    return res.data
  } catch (e) {
    // 요청 취소는 react-query가 처리해야 하므로 그대로 throw
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') {
      throw e
    }

    // 404 Not Found → 데이터 없음으로 판단
    if (e.response && e.response.status === 404) {
      return null
    }

    // 그 외 예외는 상위로 전달
    throw e
  }
}
