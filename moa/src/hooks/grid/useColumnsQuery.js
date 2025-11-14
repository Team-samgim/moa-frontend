import { useQuery } from '@tanstack/react-query'
import { fetchColumns } from '@/api/grid'

export default function useColumnsQuery(layer) {
  return useQuery({
    queryKey: ['grid', 'columns', layer],
    queryFn: () => fetchColumns({ layer, offset: 0, limit: 1 }),
    enabled: !!layer,
    select: (res) => res?.columns || [],
    staleTime: 60_000,
  })
}
