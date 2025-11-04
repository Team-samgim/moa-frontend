import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchPivotFields, fetchValues, runPivotQuery } from '@/api/pivot'
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

const stableKey = (obj) => JSON.stringify(obj ?? null)

export function useDistinctValues({ layer, field, time, filters, order = 'asc', enabled = true }) {
  return useQuery({
    queryKey: ['pivot-distinct', layer, field, order, stableKey(time), stableKey(filters)],
    queryFn: () =>
      fetchValues({
        layer,
        field,
        time,
        filters,
        order,
      }),
    enabled: !!layer && !!field && enabled,
    staleTime: 30_000,
  })
}
