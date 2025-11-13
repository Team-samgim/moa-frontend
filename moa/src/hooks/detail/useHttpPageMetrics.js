import { useQuery } from '@tanstack/react-query'
import { getHttpPageMetrics } from '@/api/httpPage'

export default function useHttpPageMetrics(rowKey) {
  return useQuery({
    queryKey: ['httpPageMetrics', rowKey],
    queryFn: ({ signal }) => getHttpPageMetrics(rowKey, { signal }),
    enabled: !!rowKey,
    staleTime: 10_000,
  })
}
