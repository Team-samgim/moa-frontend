import { useQuery } from '@tanstack/react-query'
import { fetchTcpMetrics } from '@/api/tcp'

export default function useTcpMetrics(rowKey, options = {}) {
  return useQuery({
    queryKey: ['tcpMetrics', rowKey],
    queryFn: ({ signal }) => fetchTcpMetrics(rowKey, signal),
    enabled: !!rowKey,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    ...options,
  })
}
