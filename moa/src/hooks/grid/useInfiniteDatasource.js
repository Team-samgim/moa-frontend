import { useMemo } from 'react'
import { fetchGridPage } from '@/api/grid'
import { makeFilterModel } from '@/utils/makeFilterModel'

export default function useInfiniteSearchDatasource({
  basePayloadRef,
  activeFiltersRef,
  pageSize = 50,
}) {
  return useMemo(
    () => ({
      getRows: async (params) => {
        const { startRow, endRow, sortModel } = params
        const offset = startRow
        const limit = Math.max(1, endRow - startRow, pageSize)

        const sort =
          Array.isArray(sortModel) && sortModel.length
            ? sortModel.map((s) => ({
                field: s.colId.split('-')[0],
                direction: s.sort,
              }))
            : null

        const filterModel = makeFilterModel(activeFiltersRef.current || {})

        try {
          const data = await fetchGridPage({
            basePayload: basePayloadRef.current, // 검색조건 원본
            offset,
            limit,
            sort,
            filterModel,
          })

          const rows = Array.isArray(data?.rows) ? data.rows : []
          // total을 주면 정확히, 없으면 끝판 여부는 길이로 판단
          const lastRow =
            typeof data?.total === 'number'
              ? data.total
              : rows.length < limit
                ? offset + rows.length
                : -1

          params.successCallback(rows, lastRow)
        } catch (err) {
          console.error('데이터 로드 실패:', err)
          params.failCallback()
        }
      },
    }),
    [basePayloadRef, activeFiltersRef, pageSize],
  )
}
