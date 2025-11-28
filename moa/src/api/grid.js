/**
 * Filtering / Aggregation / Grid API 모듈
 *
 * 제공 기능:
 * - 필터 값 자동완성(fetchFilterValues)
 * - 집계 데이터 조회(fetchAggregates)
 * - 그리드 Export(exportGrid)
 * - 검색 스펙 기반 Grid 조회(fetchGridBySearchSpec)
 * - Rows 페이징 조회(fetchRows)
 *
 * AUTHOR        : 방대혁
 */

import axiosInstance from '@/api/axios'

/* ---------------------------------------------
 * Helper: 객체 → JSON 문자열 변환 (GET query safe)
 * ------------------------------------------- */
const toJsonParam = (v) => {
  if (v === null) return undefined
  return typeof v === 'string' ? v : JSON.stringify(v)
}

/* ---------------------------------------------
 * 필터링 자동완성 값 조회
 *
 * 요청: GET /filtering
 * params:
 *   layer: string
 *   field: string
 *   filterModel: JSON string
 *   baseSpec: JSON string
 *   search: string
 *   offset: number
 *   limit: number
 *   includeSelf: boolean
 *   orderBy: string
 *   order: ASC|DESC
 *
 * 응답 예시:
 *   [{ label, value, count }, ...]
 * ------------------------------------------- */
export const fetchFilterValues = async ({
  layer,
  field,
  filterModel,
  baseSpec,
  search = '',
  offset = 0,
  limit = 200,
  signal,
  includeSelf = false,
  orderBy,
  order,
}) => {
  const { data } = await axiosInstance.get('/filtering', {
    params: {
      layer,
      field,
      filterModel: toJsonParam(filterModel) ?? '{}',
      baseSpec: toJsonParam(baseSpec),
      search,
      offset,
      limit,
      includeSelf,
      orderBy,
      order,
      __ts: Date.now(), // 캐시 방지
    },
    signal,
  })
  return data
}

/* ---------------------------------------------
 * Helper: POST body용 JSON 변환
 * ------------------------------------------- */
const toJsonBody = (v) => {
  if (v === null) return null
  return typeof v === 'string' ? v : JSON.stringify(v)
}

/* ---------------------------------------------
 * Aggregation 조회
 *
 * 요청: POST /aggregate
 * body:
 *   {
 *     layer,
 *     filterModel: JSON string,
 *     baseSpecJson: JSON string,
 *     metrics: [...]
 *   }
 *
 * 응답 예시:
 *   { field: { count: 123, avg: 0.12 }, ... }
 * ------------------------------------------- */
export const fetchAggregates = async ({ layer, filterModel, metrics, baseSpec }) => {
  const { data } = await axiosInstance.post('/aggregate', {
    layer,
    filterModel: toJsonBody(filterModel) ?? '{}',
    baseSpecJson: toJsonBody(baseSpec),
    metrics,
  })
  return data
}

/* ---------------------------------------------
 * Grid Export 요청
 *
 * 요청: POST /exports/grid
 * body: payload (layer, columns, filterModel, baseSpec, metrics 등)
 *
 * 응답 예시:
 *   { fileId, fileName, httpUrl? }
 * ------------------------------------------- */
export const exportGrid = async (payload, signal) => {
  const { data } = await axiosInstance.post('/exports/grid', payload, { signal })
  return data
}

/* ---------------------------------------------
 * 검색 스펙 기반 Grid 조회
 *
 * 요청: POST /grid/search
 * body: { layer, columns, conditions, ... }
 *
 * 응답 예시:
 *   {
 *     layer,
 *     columns: [{ name, type, labelKo }],
 *     rows: [...]
 *   }
 * ------------------------------------------- */
export const fetchGridBySearchSpec = async (payload) => {
  const { data } = await axiosInstance.post('/grid/search', payload)
  return data
}

/* ---------------------------------------------
 * Rows 페이징 조회
 *
 * 요청: POST /grid/search
 *
 * input:
 *   layer              string
 *   offset             number
 *   limit              number
 *   sortField          string
 *   sortDirection      ASC|DESC
 *   filterModel        object
 *
 * 기본 정렬 필드: ts_server_nsec (최근 1시간 데이터)
 *
 * 응답 예시:
 *   {
 *     columns: [...],
 *     rows: [...],
 *     layer: ...
 *   }
 * ------------------------------------------- */
export const fetchRows = async ({
  layer,
  offset = 0,
  limit = 100,
  sortField,
  sortDirection,
  filterModel,
}) => {
  const orderBy = sortField || 'ts_server_nsec'
  const order = (sortDirection || 'DESC').toUpperCase()

  const { data } = await axiosInstance.post('/grid/search', {
    layer,
    columns: [],
    time: {
      field: 'ts_server_nsec',
      fromEpoch: Math.floor(Date.now() / 1000) - 3600, // 최근 1시간
      toEpoch: Math.floor(Date.now() / 1000),
    },
    conditions: [], // TODO: filterModel 변환 시 조건 생성 지원
    options: {
      orderBy,
      order,
      limit,
      offset,
    },
    filterModel: filterModel || {},
  })

  return data
}
