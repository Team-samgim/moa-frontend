/**
 * useTcpMetrics
 *
 * TCP 메트릭을 TanStack React Query로 조회하는 훅.
 *
 * 특징:
 * - enabled: rowKey 있을 때만 요청
 * - retry: 1회
 * - staleTime: 30초 (짧은 캐싱)
 * - gcTime: 5분 (비활성 캐시 정리)
 * - queryKey: ['tcpMetrics', rowKey]
 *
 * 옵션:
 * - options: React Query 옵션을 override 가능
 *
 * AUTHOR: 방대혁
 */

import { useQuery } from '@tanstack/react-query'
import { fetchTcpMetrics } from '@/api/tcp'

export default function useTcpMetrics(rowKey, options = {}) {
  return useQuery({
    queryKey: ['tcpMetrics', rowKey],
    queryFn: ({ signal }) => fetchTcpMetrics(rowKey, signal),
    enabled: !!rowKey,
    staleTime: 30_000, // 30초
    gcTime: 5 * 60_000, // 5분
    retry: 1,
    ...options,
  })
}
