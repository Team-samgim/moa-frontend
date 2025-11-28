/**
 * useEthernetMetrics & 관련 유틸리티 훅
 *
 * Ethernet 메트릭 데이터를 TanStack React Query 기반으로 조회하는 훅 모음.
 *
 * 구성:
 * 1. ethernetKeys — React Query Key 팩토리
 * 2. useEthernetMetrics — 특정 rowKey에 대한 단건 메트릭 조회
 * 3. prefetchEthernetMetrics — hover 등 사전 조회
 * 4. invalidateEthernetMetrics — 상세 닫기 후 캐시 무효화
 *
 * 특징:
 * - rowKey가 없으면 자동 호출 방지 (enabled)
 * - staleTime 15초로 짧게 캐싱
 * - retry 1회
 * - prefetchQuery로 hover 프리패칭 지원
 *
 * AUTHOR: 방대혁
 */

import { useQuery } from '@tanstack/react-query'
import { getEthernetMetrics } from '@/api/ethernet'

/**
 * React Query Key 팩토리
 * - 캐싱, 무효화, 프리패치 등에 사용
 */
export const ethernetKeys = {
  all: ['ethernet'],
  detail: (rowKey) => ['ethernet', 'detail', rowKey],
}

/**
 * useEthernetMetrics
 * - Ethernet 단일 rowKey 기준 상세 메트릭 조회 훅
 * - rowKey가 있을 때만 호출(enabled)
 * - 실패 시 1회 재시도
 * - staleTime: 15초
 */
export default function useEthernetMetrics(rowKey) {
  const query = useQuery({
    queryKey: ethernetKeys.detail(rowKey),
    queryFn: ({ signal }) => getEthernetMetrics(rowKey, { signal }),
    enabled: !!rowKey,
    retry: 1,
    staleTime: 15_000,
  })

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
    isSuccess: query.isSuccess,
    isFetching: query.isFetching,
    status: query.status,
  }
}

/**
 * prefetchEthernetMetrics
 * - hover 등에서 미리 로딩(프리패치)할 때 사용
 * - 캐시가 유효하면 네트워크 요청 없이 기존 값 재사용
 */
export function prefetchEthernetMetrics(queryClient, rowKey) {
  if (!rowKey) return
  return queryClient.prefetchQuery({
    queryKey: ethernetKeys.detail(rowKey),
    queryFn: ({ signal }) => getEthernetMetrics(rowKey, { signal }),
    staleTime: 15_000,
  })
}

/**
 * invalidateEthernetMetrics
 * - 상세 창 닫은 후 fresh 데이터를 다시 받고 싶을 때 사용
 */
export function invalidateEthernetMetrics(queryClient, rowKey) {
  return queryClient.invalidateQueries({
    queryKey: ethernetKeys.detail(rowKey),
  })
}
