import { useQuery } from '@tanstack/react-query'
import { fetchFilterValues } from '@/api/grid'

/**
 * toHash
 *
 * 객체를 안정적으로 직렬화하여 queryKey로 사용할 문자열 생성.
 * - key 정렬 후 JSON.stringify → 동일 객체 내용이면 항상 동일 결과
 *
 * AUTHOR: 방대혁
 */
const toHash = (obj) => JSON.stringify(obj ?? {}, Object.keys(obj ?? {}).sort())

/**
 * useFilterValuesQuery
 *
 * 목적:
 * - 특정 컬럼(field)의 "필터 후보값"을 서버에서 가져오는 React Query 훅.
 * - filterModel 이 변경되면 자동으로 refetch.
 *
 * 특징:
 * - queryKey에 filterModel hash 포함 → 캐싱 및 반응성 보장
 * - enabled: layer와 field가 존재할 때만 요청
 * - staleTime: 60초 (필터 후보값은 다른 메트릭보다 변동 빈도 낮음)
 *
 * 입력:
 * - layer: 조회 레이어
 * - field: 필터 대상 컬럼
 * - filterModel: 현재 필터 상태
 *
 * 반환:
 * - React Query 객체 (data, isLoading, error, ... 사용 가능)
 *
 * AUTHOR: 방대혁
 */
export default function useFilterValuesQuery({ layer, field, filterModel }) {
  const hash = toHash(filterModel)

  return useQuery({
    queryKey: ['grid', 'filterValues', layer, field, hash],
    queryFn: () => fetchFilterValues({ layer, field, filterModel }),
    enabled: !!layer && !!field,
    staleTime: 60_000,
  })
}
