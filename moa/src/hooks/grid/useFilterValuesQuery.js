import { useQuery } from '@tanstack/react-query'
import { fetchFilterValues } from '@/api/grid'

const toHash = (obj) => JSON.stringify(obj ?? {}, Object.keys(obj ?? {}).sort())

export default function useFilterValuesQuery({ layer, field, filterModel }) {
  const hash = toHash(filterModel)
  return useQuery({
    queryKey: ['grid', 'filterValues', layer, field, hash],
    queryFn: () => fetchFilterValues({ layer, field, filterModel }),
    enabled: !!layer && !!field,
    staleTime: 60_000,
  })
}
