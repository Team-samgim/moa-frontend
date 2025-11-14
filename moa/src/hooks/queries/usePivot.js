import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { fetchPivotFields, fetchRowGroupItems, fetchValues, runPivotQuery } from '@/api/pivot'
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

export function useInfiniteDistinctValues({
  layer,
  field,
  time,
  filters,
  order = 'asc',
  enabled = true,
  limit = 50,
}) {
  return useInfiniteQuery({
    queryKey: [
      'pivot-distinct',
      'infinite',
      layer,
      field,
      order,
      limit,
      stableKey(time),
      stableKey(filters),
    ],
    queryFn: ({ pageParam }) =>
      fetchValues({
        layer,
        field,
        time,
        filters,
        order,
        cursor: pageParam ?? null,
        limit,
      }),
    enabled: !!layer && !!field && enabled,
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 30_000,
  })
}

export function useRowGroupItems(options = {}) {
  return useMutation({
    mutationFn: (payload) => fetchRowGroupItems(payload),
    ...options,
  })
}

export function useRowGroupItemsInfinite({
  layer,
  rowField,
  time,
  column,
  values,
  filters,
  sort,
  enabled = false,
}) {
  return useInfiniteQuery({
    queryKey: [
      'row-group-items-infinite',
      layer,
      rowField,
      stableKey(time),
      stableKey(column),
      stableKey(values),
      stableKey(filters),
      stableKey(sort),
    ],
    queryFn: ({ pageParam }) =>
      fetchRowGroupItems({
        layer,
        rowField,
        time,
        column,
        values,
        filters,
        sort,
        cursor: pageParam,
        limit: 50,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
