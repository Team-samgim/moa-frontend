import { useRef, useState } from 'react'
import { fetchFilterValues as apiFetchFilterValues } from '@/api/grid'
import makeSignature from '@/utils/makeSignature'
import pickWithout from '@/utils/pickWithout'

export default function useFilterData({
  layer,
  field,
  context,
  pageLimit = 200,
  debounceMs = 250,
}) {
  const [values, setValues] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const inflightRef = useRef(null)
  const lastSigRef = useRef('')
  const nextOffsetRef = useRef(0)
  const restoredRef = useRef(false)
  const searchTimer = useRef(0)

  const getAF = () => context?.getActiveFilters?.() || {}

  const load = async ({ reset = false, afOverride } = {}) => {
    const af = afOverride ?? getAF()
    const includeSelf = !!af[field]
    const sig = makeSignature({
      layer,
      field,
      search,
      filters: includeSelf ? af : pickWithout(af, field),
      includeSelf,
    })

    if (!reset && lastSigRef.current === sig && values.length > 0 && !hasMore) return

    inflightRef.current?.abort()
    const controller = new AbortController()
    inflightRef.current = controller

    try {
      setLoading(true)
      setError('')
      const offset = reset ? 0 : (nextOffsetRef.current ?? 0)

      const data = await apiFetchFilterValues({
        layer,
        field,
        filterModel: af,
        search,
        offset,
        limit: pageLimit,
        signal: controller.signal,
        includeSelf,
      })

      const page = data?.values || []
      setValues(reset ? page : (prev) => [...prev, ...page])
      setHasMore(!!data?.hasMore)
      nextOffsetRef.current = data?.nextOffset ?? null

      if (reset) lastSigRef.current = sig
    } catch (e) {
      if (e.name !== 'CanceledError' && e.message !== 'canceled')
        setError('필터 후보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
      inflightRef.current = null
    }
  }

  const reloadAll = (afOverride) => {
    nextOffsetRef.current = 0
    setValues([])
    setHasMore(false)
    return load({ reset: true, afOverride })
  }

  const loadMore = () => load({ reset: false })

  // 검색 디바운스
  const onChangeSearch = (v) => {
    setSearch(v ?? '')
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => reloadAll(), debounceMs)
  }

  const restoreSelected = (activeFilters, setSelected, setConditions, setLogicOps) => {
    if (restoredRef.current || values.length === 0) return
    const prev = activeFilters?.[field]
    if (prev?.mode === 'checkbox') {
      const s = new Set(values)
      setSelected((prev.values || prev)?.values?.filter?.((x) => s.has(x)) ?? prev.values ?? [])
    } else if (prev?.mode === 'condition') {
      setConditions(prev.conditions || [{ op: 'contains', val: '' }])
      setLogicOps(prev.logicOps || [])
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
