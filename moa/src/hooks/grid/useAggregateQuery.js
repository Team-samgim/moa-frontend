import { useQuery } from '@tanstack/react-query'
import { fetchAggregates } from '@/api/grid'

const stableHash = (obj) => JSON.stringify(obj ?? {}, Object.keys(obj ?? {}).sort())

export default function useAggregateQuery({ layer, filterModel, columns, baseSpec }) {
  const metrics = (columns || []).reduce((acc, col) => {
    const field = col?.field || col?.name
    const rawType = col?.filterParams?.type || col?.type || 'string'
    const type = rawType.toLowerCase()

    if (!field) return acc
    if (type === 'date') return acc

    if (type === 'number') {
      acc[field] = { type: 'number', ops: ['count', 'sum', 'avg', 'min', 'max'] }
    } else {
      // string / ip / mac / port 등
      acc[field] = { type: 'string', ops: ['count', 'distinct', 'top1', 'top2', 'top3'] }
    }
    return acc
  }, {})

  return useQuery({
    queryKey: [
      'grid',
      'aggregates',
      layer,
      stableHash(filterModel),
      stableHash(baseSpec),
      Object.keys(metrics).length,
    ],
    queryFn: () => fetchAggregates({ layer, filterModel, metrics, baseSpec }),
    enabled: !!layer && !!baseSpec && Object.keys(metrics).length > 0,
    staleTime: 30_000,
  })
}
