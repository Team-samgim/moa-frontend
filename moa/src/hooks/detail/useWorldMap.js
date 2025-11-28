import { useQuery } from '@tanstack/react-query'

/**
 * 외부 CDN에서 제공되는 ECharts 세계 지도 GeoJSON URL
 */
const WORLD_MAP_URL =
  'https://cdn.jsdelivr.net/gh/apache/echarts-www@master/asset/map/json/world.json'

/**
 * useWorldMap
 *
 * ECharts에서 사용하는 세계 지도(GeoJSON)를 불러오는 React Query 훅.
 *
 * 특징:
 * - 외부 CDN에서 world.json을 한 번만 로드
 * - staleTime: Infinity → 항상 fresh 상태로 간주
 * - cacheTime: Infinity → 메모리에서 캐시 삭제되지 않음
 * - 최초 1회만 네트워크 요청 → 이후 전부 캐시 사용
 *
 * 반환값:
 * { data, isLoading, isError, error, refetch, ... }
 *
 * AUTHOR: 방대혁
 */
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
    staleTime: Infinity,
    cacheTime: Infinity,
  })
}
