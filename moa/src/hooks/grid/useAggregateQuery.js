// hooks/grid/useAggregateQuery.js
import { useQuery } from '@tanstack/react-query'
import { fetchAggregates } from '@/api/grid'

const stableHash = (obj) => JSON.stringify(obj ?? {}, Object.keys(obj ?? {}).sort())

export default function useAggregateQuery({ layer, filterModel, columns }) {
  const metrics = (columns || []).reduce((acc, col) => {
    const field = col?.field
    const type = col?.filterParams?.type
    if (!field) return acc
    if (type === 'date') return acc

    if (type === 'number') {
      acc[field] = { type: 'number', ops: ['count', 'sum', 'avg', 'min', 'max'] }
    } else {
      // 문자열/IP/MAC → Top3까지
      // 서버가 배열형(top) 지원하면 {ops:['count','distinct',{top:3}]}도 OK
      acc[field] = { type: 'string', ops: ['count', 'distinct', 'top1', 'top2', 'top3'] }
    }
    return acc
  }, {})

  return useQuery({
    queryKey: ['grid', 'aggregates', layer, stableHash(filterModel), Object.keys(metrics).length],
    queryFn: () => fetchAggregates({ layer, filterModel, metrics }),
    enabled: !!layer && Object.keys(metrics).length > 0,
    staleTime: 30_000,
  })
}
