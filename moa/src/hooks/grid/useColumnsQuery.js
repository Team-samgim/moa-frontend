import { useQuery } from '@tanstack/react-query'
import { fetchColumns } from '@/api/grid'

/**
 * useColumnsQuery
 *
 * 목적:
 * 특정 layer의 컬럼 정보를 서버에서 가져오는 React Query 훅.
 *
 * 특징:
 * - offset=0, limit=1 → 실제 데이터가 아닌 “컬럼 스키마만” 조회하는 API 패턴
 * - enabled: layer 존재할 때만 실행
 * - select: 응답 중 columns만 추출하여 반환
 * - staleTime: 60초 동안 캐시 유지 (짧은 빈도 요청 방지)
 *
 * 매개변수:
 * @param {string} layer - 조회 대상 레이어 이름
 *
 * 반환:
 * - columns 배열 또는 빈 배열
 * - React Query 기본 상태값(isLoading, isError 등)
 *
 * AUTHOR: 방대혁
 */
export default function useColumnsQuery(layer) {
  return useQuery({
    queryKey: ['grid', 'columns', layer], // 레이어별 캐시 구분
    queryFn: () => fetchColumns({ layer, offset: 0, limit: 1 }), // 컬럼만 조회
    enabled: !!layer, // layer 없으면 요청 수행 안 함
    select: (res) => res?.columns || [], // 컬럼만 반환
    staleTime: 60_000, // 1분 캐싱
  })
}
