import { useQuery } from '@tanstack/react-query'
import { fetchAggregates } from '@/api/grid'

/**
 * stableHash
 *
 * 객체 키를 정렬한 상태로 JSON 문자열화하여
 * Query Key 안정성을 확보하는 함수.
 *
 * 목적:
 * - filterModel / baseSpec 등을 비교할 때
 * - 키 순서로 인한 캐시 불일치 문제를 방지
 *
 * AUTHOR: 방대혁
 */
const stableHash = (obj) => JSON.stringify(obj ?? {}, Object.keys(obj ?? {}).sort())

/**
 * useAggregateQuery
 *
 * 목적:
 * - 특정 layer + 필터 + 컬럼 목록을 기반으로
 *   서버에서 집계(Aggregate) 값들을 조회하는 React Query 훅.
 *
 * 집계 규칙:
 * - 숫자 컬럼  → count, sum, avg, min, max
 * - 문자열 컬럼 → count, distinct, top1~top3
 *
 * 매개변수:
 * - layer: 조회 대상 레이어(필수)
 * - filterModel: 필터모델(AG Grid filterModel 또는 사용자정의)
 * - columns: 현재 그리드 컬럼 정의 배열
 * - baseSpec: 서버로 전달해야 하는 기본 쿼리 스펙
 *
 * 반환:
 * - React Query 결과 (data, isLoading, isError 등)
 *
 * 특징:
 * - metrics 자동 구성
 * - Query Key에 stableHash 적용
 * - enabled 조건: layer, baseSpec, metrics 존재 시 실행
 * - staleTime: 30초
 *
 * AUTHOR: 방대혁
 */
export default function useAggregateQuery({ layer, filterModel, columns, baseSpec }) {
  /**
   * metrics 자동 생성
   *
   * 예:
   * {
   *   bytes: { type: 'number', ops: ['count','sum','avg','min','max'] },
   *   method: { type: 'string', ops: ['count','distinct','top1','top2','top3'] }
   * }
   */
  const metrics = (columns || []).reduce((acc, col) => {
    const field = col?.field || col?.name
    const rawType = col?.filterParams?.type || col?.type || 'string'
    const type = rawType.toLowerCase()

    if (!field) return acc
    if (type === 'date') return acc // 날짜는 집계 제외

    if (type === 'number') {
      acc[field] = { type: 'number', ops: ['count', 'sum', 'avg', 'min', 'max'] }
    } else {
      acc[field] = { type: 'string', ops: ['count', 'distinct', 'top1', 'top2', 'top3'] }
    }

    return acc
  }, {})

  /**
   * React Query 실행
   */
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
