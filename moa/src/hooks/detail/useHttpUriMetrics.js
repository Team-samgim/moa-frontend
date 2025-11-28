/**
 * useHttpUriMetrics & 관련 유틸리티 훅
 *
 * HTTP URI 메트릭 데이터를 TanStack React Query 기반으로 조회하는 훅 모음.
 *
 * 구성:
 * 1. httpUriKeys — React Query Key 팩토리
 * 2. useHttpUriMetrics — rowKey 기반 단건 메트릭 조회
 * 3. prefetchHttpUriMetrics — hover 등 사전 조회
 * 4. invalidateHttpUriMetrics — 상세 닫기 후 fresh 데이터 재조회
 *
 * 특징:
 * - rowKey 없을 시 auto disabled (enabled)
 * - staleTime 15초 — 짧게 캐싱
 * - retry 1회
 * - 404 → data:null 로 처리해 "데이터 없음" UI 대응 가능
 *
 * AUTHOR: 방대혁
 */

import { useQuery } from '@tanstack/react-query'
import { getHttpUriMetrics } from '@/api/httpUri'

/**
 * React Query Key 팩토리
 * - 캐싱, 프리패치, 무효화 등에 사용
 */
export const httpUriKeys = {
  all: ['httpUri'],
  detail: (rowKey) => ['httpUri', 'detail', rowKey],
}

/**
 * useHttpUriMetrics
 * - HTTP URI 메트릭 단일 rowKey 조회 훅
 *
 * @param {string} rowKey - 조회 대상 key
 */
export default function useHttpUriMetrics(rowKey) {
  const query = useQuery({
    queryKey: httpUriKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpUriMetrics(rowKey, { signal }),
    enabled: !!rowKey, // rowKey 없으면 호출 안 함
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
 * prefetchHttpUriMetrics
 * - hover 시 미리 로드해 UX를 부드럽게 하고 싶을 때 사용
 *
 * @param {QueryClient} queryClient
 * @param {string} rowKey
 */
export function prefetchHttpUriMetrics(queryClient, rowKey) {
  if (!rowKey) return
  return queryClient.prefetchQuery({
    queryKey: httpUriKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpUriMetrics(rowKey, { signal }),
    staleTime: 15_000,
  })
}

/**
 * invalidateHttpUriMetrics
 * - 상세 패널 닫은 뒤 fresh 데이터 다시 받고 싶은 경우 사용
 *
 * @param {QueryClient} queryClient
 * @param {string} rowKey
 */
export function invalidateHttpUriMetrics(queryClient, rowKey) {
  return queryClient.invalidateQueries({
    queryKey: httpUriKeys.detail(rowKey),
  })
}
