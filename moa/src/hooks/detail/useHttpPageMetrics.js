import { useQuery } from '@tanstack/react-query'
import { getHttpPageMetrics } from '@/api/httpPage'

/** Query Key 팩토리 */
export const httpPageKeys = {
  all: ['httpPage'],
  detail: (rowKey) => ['httpPage', 'detail', rowKey],
}

/**
 * 상세(모달)용 단건 조회 훅 - TanStack Query
 *  - enabled: rowKey 있을 때만 요청
 *  - 404 => data=null (컴포넌트에서 "데이터 없음" 처리 가능)
 *  - retry: 1회 (원하는 값으로 조절)
 *  - staleTime: 15초 (짧은 캐싱)
 */
export default function useHttpPageMetrics(rowKey) {
  const query = useQuery({
    queryKey: httpPageKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpPageMetrics(rowKey, { signal }),
    enabled: !!rowKey,
    retry: 1,
    staleTime: 15_000,
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

/** 그리드 hover 시 미리 불러오고 싶을 때 사용 */
export function prefetchHttpPageMetrics(queryClient, rowKey) {
  if (!rowKey) return
  return queryClient.prefetchQuery({
    queryKey: httpPageKeys.detail(rowKey),
    queryFn: ({ signal }) => getHttpPageMetrics(rowKey, { signal }),
    staleTime: 15_000,
  })
}

/** 상세 닫은 뒤 캐시 무효화하고 싶을 때 */
export function invalidateHttpPageMetrics(queryClient, rowKey) {
  return queryClient.invalidateQueries({
    queryKey: httpPageKeys.detail(rowKey),
  })
}
