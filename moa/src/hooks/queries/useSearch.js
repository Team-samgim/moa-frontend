import { useQuery, useMutation } from '@tanstack/react-query'
import { searchMetaApi, executeSearchApi } from '@/api/search'

// queryKey: layer/source 별 캐시 분리
const keys = {
  meta: (layer, source) => ['search', 'meta', layer, source],
}

// layer별 기본 source 테이블 매핑
const defaultSourceByLayer = (layer) => {
  if (!layer) return 'page_sample'
  const L = String(layer).toUpperCase()
  if (L === 'HTTP_PAGE') return 'http_page_sample'
  if (L === 'ETHERNET') return 'ethernet_sample'
  return 'page_sample'
}

const canonicalLayer = (layer) => {
  if (!layer) return undefined
  return String(layer)
    .trim()
    .replace(/\s+/g, '_') // 공백 → 언더스코어
    .replace(/-+/g, '_') // 대시 → 언더스코어
    .toUpperCase()
}

/**
 * 계층별 메타(필드/연산자) 조회 훅
 * - 같은 layer/source면 캐시 재사용
 * - staleTime 기본 Infinity로 “재호출 방지”
 * - 탭 전환 시 layer에 따라 기본 source를 자동 매핑(HTTP_PAGE→http_page_sample, ETHERNET→ethernet_sample)
 */
export function useSearchMeta({
  layer,
  source,
  enabled = true,
  staleTime = Infinity, // 한 번 받으면 신선함 무한
  gcTime = 60 * 60 * 1000, // 1시간 뒤 가비지 컬렉션
} = {}) {
  const resolvedLayer = canonicalLayer(layer)
  const resolvedSource = source ?? defaultSourceByLayer(resolvedLayer)
  return useQuery({
    queryKey: keys.meta(resolvedLayer, resolvedSource),
    queryFn: () => searchMetaApi(resolvedLayer, resolvedSource),
    enabled: !!resolvedLayer && enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: undefined,
    select: (data) => {
      const raw = data?.fields ?? data ?? []
      const fields = raw.map((f) => ({
        key: f.fieldKey ?? f.key,
        label: f.label ?? f.labelKo ?? f.label_ko ?? f.fieldKey ?? f.key,
        dataType: f.dataType,
        orderNo: f.orderNo ?? f.order_no ?? 999,
        operators: (f.operators ?? []).map((o) => ({
          opCode: o.opCode ?? o.code ?? o.op_code,
          label: o.label ?? o.labelKo ?? o.label_ko ?? o.opCode ?? o.code,
          valueArity: o.valueArity ?? o.value_arity ?? 1, // 0 | 1 | 2 | -1
          orderNo: o.orderNo ?? o.order_no ?? 100,
          isDefault: o.isDefault ?? o.is_default ?? false,
        })),
      }))
      return { fields: fields.sort((a, b) => a.orderNo - b.orderNo) }
    },
  })
}

/** 검색 실행 (버튼 클릭 시) */
export function useExecuteSearch(options = {}) {
  return useMutation({
    mutationFn: executeSearchApi,
    ...options,
  })
}
