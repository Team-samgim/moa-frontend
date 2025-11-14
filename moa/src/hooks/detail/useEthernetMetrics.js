import { useQuery } from '@tanstack/react-query'
import { getEthernetMetrics } from '@/api/ethernet'

/** Query Key 팩토리 */
export const ethernetKeys = {
  all: ['ethernet'],
  detail: (rowKey) => ['ethernet', 'detail', rowKey],
}

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

/** hover 등으로 미리 불러오고 싶을 때 */
export function prefetchEthernetMetrics(queryClient, rowKey) {
  if (!rowKey) return
  return queryClient.prefetchQuery({
    queryKey: ethernetKeys.detail(rowKey),
    queryFn: ({ signal }) => getEthernetMetrics(rowKey, { signal }),
    staleTime: 15_000,
  })
}

/** 상세 닫은 뒤 캐시 무효화하고 싶을 때 */
export function invalidateEthernetMetrics(queryClient, rowKey) {
  return queryClient.invalidateQueries({
    queryKey: ethernetKeys.detail(rowKey),
  })
}
