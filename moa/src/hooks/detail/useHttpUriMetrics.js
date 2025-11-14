import { useQuery } from '@tanstack/react-query'
import { getHttpUriMetrics } from '@/api/httpUri'

/** Query Key 팩토리 */
export const httpUriKeys = {
  all: ['httpUri'],
  detail: (rowKey) => ['httpUri', 'detail', rowKey],
}

/**
 * HTTP URI 메트릭 조회 훅 - TanStack Query
 *
 * 특징:
 * - enabled: rowKey 있을 때만 요청
 * - 404 => data=null (컴포넌트에서 "데이터 없음" 처리)
 * - retry: 1회 (필요시 조절)
 * - staleTime: 15초 (짧은 캐싱)
 *
 * @param {string} rowKey - HTTP URI row key
 * @returns {Object} { data, isLoading, isError, error, refetch, isSuccess, ... }
 */
export default function useHttpUriMetrics(rowKey) {
  const query = useQuery({
    queryKey: httpUriKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpUriMetrics(rowKey, { signal }),
    enabled: !!rowKey,
    retry: 1,
    staleTime: 15_000, // 15초
  })

  // 기존 코드와 인터페이스 최대한 동일하게 노출
  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
    isSuccess: query.isSuccess,
    // 필요 시 사용 가능한 추가 플래그
    isFetching: query.isFetching,
    status: query.status,
  }
}

/**
 * 그리드 hover 시 미리 불러오기 (프리페칭)
 * @param {QueryClient} queryClient - TanStack Query Client
 * @param {string} rowKey - HTTP URI row key
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
 * 상세 닫은 뒤 캐시 무효화 (필요시)
 * @param {QueryClient} queryClient - TanStack Query Client
 * @param {string} rowKey - HTTP URI row key
 */
export function invalidateHttpUriMetrics(queryClient, rowKey) {
  return queryClient.invalidateQueries({
    queryKey: httpUriKeys.detail(rowKey),
  })
}
