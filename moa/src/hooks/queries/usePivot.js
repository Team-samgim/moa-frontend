import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchPivotFields, runPivotQuery } from '@/api/pivot'
import { usePivotStore } from '@/stores/pivotStore'

export function usePivotFields(options = {}) {
  const layer = usePivotStore((s) => s.layer)

  return useQuery({
    queryKey: ['pivot-fields', layer],
    queryFn: () => fetchPivotFields(layer),
    staleTime: 60_000,
    ...options,
  })
}

export function usePivotQuery(options = {}) {
  return useMutation({
    mutationFn: (pivotConfigPayload) => runPivotQuery(pivotConfigPayload),
    ...options,
  })
}
