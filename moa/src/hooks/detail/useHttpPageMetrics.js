/**
 * useHttpPageMetrics & 관련 유틸리티 훅
 *
 * HTTP Page 메트릭을 TanStack React Query 기반으로 조회하는 훅 모음.
 *
 * 구성:
 * 1. httpPageKeys — React Query Key 팩토리
 * 2. useHttpPageMetrics — rowKey 단일 상세 조회 훅
 * 3. prefetchHttpPageMetrics — hover 등 사전 조회
 * 4. invalidateHttpPageMetrics — 상세 닫기 후 fresh 데이터 요청
 *
 * 특징:
 * - enabled: rowKey 없으면 호출 안 함
 * - retry: 1회
 * - staleTime: 15초 (짧은 캐싱)
 * - 404 응답 시 data=null 처리하여 "데이터 없음" UI 가능
 *
 * AUTHOR: 방대혁
 */

import { useQuery } from '@tanstack/react-query'
import { getHttpPageMetrics } from '@/api/httpPage'

/**
 * React Query Key 팩토리
 * - 캐싱 / 프리패치 / 무효화에 사용
 */
export const httpPageKeys = {
  all: ['httpPage'],
  detail: (rowKey) => ['httpPage', 'detail', rowKey],
}

/**
 * useHttpPageMetrics
 * - HTTP Page 단일 rowKey 기준 상세 메트릭 조회 훅
 *
 * @param {string} rowKey - HTTP Page row key
 */
export default function useHttpPageMetrics(rowKey) {
  const query = useQuery({
    queryKey: httpPageKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpPageMetrics(rowKey, { signal }),
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
 * prefetchHttpPageMetrics
 * - hover·focus 시 미리 데이터를 가져오고 싶을 때 사용
 *
 * @param {QueryClient} queryClient
 * @param {string} rowKey
 */
export function prefetchHttpPageMetrics(queryClient, rowKey) {
  if (!rowKey) return
  return queryClient.prefetchQuery({
    queryKey: httpPageKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpPageMetrics(rowKey, { signal }),
    staleTime: 15_000,
  })
}

/**
 * invalidateHttpPageMetrics
 * - 상세 패널/모달 닫은 뒤 fresh 데이터 재조회용
 *
 * @param {QueryClient} queryClient
 * @param {string} rowKey
 */
export function invalidateHttpPageMetrics(queryClient, rowKey) {
  return queryClient.invalidateQueries({
    queryKey: httpPageKeys.detail(rowKey),
  })
}
