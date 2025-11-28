import { useRef, useState } from 'react'
import { fetchFilterValues as apiFetchFilterValues } from '@/api/grid'
import makeSignature from '@/utils/makeSignature'
import pickWithout from '@/utils/pickWithout'

/**
 * useFilterData
 *
 * 목적:
 * - AG Grid 사이드바 필터의 "값 목록" UI를 관리하는 커스텀 훅.
 * - 검색, 무한 스크롤(loadMore), 디바운스, abortController, activeFilters 반영 등 포함.
 * - checkbox 모드 / condition 모드 모두 복원 지원.
 *
 * 입력:
 * - layer: 조회 레이어(데이터 소스)
 * - field: 필터 대상 컬럼
 * - context: grid context(activeFilters, order, baseSpec)
 * - pageLimit: 1회 요청당 가져올 아이템 수
 * - debounceMs: 검색 디바운스 간격
 *
 * 반환:
 * - values, hasMore, loading, error, search
 * - setSearch(v), reloadAll(), loadMore(), restoreSelected()
 *
 * AUTHOR: 방대혁
 */
export default function useFilterData({
  layer,
  field,
  context,
  pageLimit = 200,
  debounceMs = 250,
}) {
  /** 서버에서 가져온 값 목록 */
  const [values, setValues] = useState([])

  /** 무한 스크롤 가능 여부 */
  const [hasMore, setHasMore] = useState(false)

  /** 로딩 상태 */
  const [loading, setLoading] = useState(false)

  /** 에러 메시지 */
  const [error, setError] = useState('')

  /** 검색어 */
  const [search, setSearch] = useState('')

  /** 진행 중 요청 AbortController */
  const inflightRef = useRef(null)

  /** 동일 요청 중복 방지용 signature */
  const lastSigRef = useRef('')

  /** 다음 offset (무한 스크롤) */
  const nextOffsetRef = useRef(0)

  /** 체크박스·조건 복원 여부 (최초 1회만 동작) */
  const restoredRef = useRef(false)

  /** 검색 디바운스 timer */
  const searchTimer = useRef(0)

  /** gridContext에서 activeFilters 가져오기 */
  const getAF = () => context?.getActiveFilters?.() || {}

  /**
   * 필터 값 서버 요청
   * - reset: true → offset 0부터 재시작
   * - afOverride: 외부에서 activeFilters 강제 지정
   */
  const load = async ({ reset = false, afOverride } = {}) => {
    const af = afOverride ?? getAF()

    const includeSelf = !!af[field] // 현재 필드에 대한 필터 포함 여부
    const order = context?.getOrder?.() || {}
    const base = context?.getBasePayload?.() || null

    // includeSelf=false → 현재 필드 제외하고 필터 전달
    const filterModelForSend = includeSelf ? af : pickWithout(af, field)

    /** 요청 signature 생성 */
    const sig = makeSignature({
      layer,
      field,
      search,
      filters: filterModelForSend,
      includeSelf,
      order,
      base,
    })

    /** 이전 요청과 동일 + 결과 있음 + 더 불러올 것 없음 → 재요청 불필요 */
    if (!reset && lastSigRef.current === sig && values.length > 0 && !hasMore) return

    // 기존 요청 중단
    inflightRef.current?.abort()
    const controller = new AbortController()
    inflightRef.current = controller

    try {
      setLoading(true)
      setError('')

      const offset = reset ? 0 : (nextOffsetRef.current ?? 0)

      /** 서버 호출 */
      const data = await apiFetchFilterValues({
        layer,
        field,
        filterModel: includeSelf ? af : pickWithout(af, field),
        search,
        offset,
        limit: pageLimit,
        signal: controller.signal,
        includeSelf,
        orderBy: order.orderBy,
        order: order.order,
        baseSpec: base || undefined,
      })

      const page = data?.values || []

      setValues(reset ? page : (prev) => [...prev, ...page])
      setHasMore(!!data?.hasMore)
      nextOffsetRef.current = data?.nextOffset ?? null

      if (reset) lastSigRef.current = sig
    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled') {
        setError('필터 후보를 불러오지 못했습니다.')
      }
    } finally {
      setLoading(false)
      inflightRef.current = null
    }
  }

  /** 전체 새로 불러오기 (검색·필터 변경 시) */
  const reloadAll = (afOverride) => {
    nextOffsetRef.current = 0
    setValues([])
    setHasMore(false)
    return load({ reset: true, afOverride })
  }

  /** 추가 데이터 로딩(무한스크롤) */
  const loadMore = () => load({ reset: false })

  /** 검색어 입력 → 디바운스 → reload */
  const onChangeSearch = (v) => {
    setSearch(v ?? '')
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => reloadAll(), debounceMs)
  }

  /**
   * 필터 복원 (checkbox / condition)
   * - activeFilters[field] 기반 자동 복원
   */
  const restoreSelected = (activeFilters, setSelected, setConditions, setLogicOps) => {
    if (restoredRef.current || values.length === 0) return

    const prevFilter = activeFilters?.[field]

    /** checkbox 모드 */
    if (prevFilter?.mode === 'checkbox') {
      const valueSet = new Set(values)
      const restored = (prevFilter.values || []).filter((x) => valueSet.has(x))
      setSelected(restored)

      /** condition 모드 */
    } else if (prevFilter?.mode === 'condition') {
      setConditions(prevFilter.conditions || [{ op: 'contains', val: '' }])
      setLogicOps(prevFilter.logicOps || [])
    }

    restoredRef.current = true
  }

  return {
    values,
    hasMore,
    loading,
    error,
    search,
    setSearch: onChangeSearch,
    reloadAll,
    loadMore,
    restoreSelected,
  }
}
