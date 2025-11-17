import { useQuery } from '@tanstack/react-query'

const WORLD_MAP_URL =
  'https://cdn.jsdelivr.net/gh/apache/echarts-www@master/asset/map/json/world.json'

export default function useWorldMap() {
  return useQuery({
    queryKey: ['world-map'],
    queryFn: async () => {
      const res = await fetch(WORLD_MAP_URL)
      if (!res.ok) {
        throw new Error('세계 지도 데이터를 불러오지 못했습니다.')
      }
      return res.json()
    },
    staleTime: Infinity, // 항상 캐시 재사용
    cacheTime: Infinity,
  })
}
