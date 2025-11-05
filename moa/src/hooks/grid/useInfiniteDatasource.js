// import { useMemo } from 'react'
// import { fetchRows } from '@/api/grid'
// import { makeFilterModel } from '@/utils/makeFilterModel'

// export default function useInfiniteDatasource({ currentLayer, activeFiltersRef }) {
//   return useMemo(
//     () => ({
//       getRows: async (params) => {
//         const { startRow, endRow, sortModel } = params
//         const offset = startRow
//         const limit = endRow - startRow
//         const sortField = sortModel?.[0]?.colId?.split('-')[0] || null
//         const sortDirection = sortModel?.[0]?.sort || null

//         try {
//           const filterModel = makeFilterModel(activeFiltersRef.current || {})
//           const data = await fetchRows({
//             layer: currentLayer,
//             offset,
//             limit,
//             sortField,
//             sortDirection,
//             filterModel,
//           })
//           const rows = data.rows || []
//           const lastRow = rows.length < limit ? offset + rows.length : -1
//           params.successCallback(rows, lastRow)
//         } catch (err) {
//           console.error('데이터 로드 실패:', err)
//           params.failCallback()
//         }
//       },
//     }),
//     [currentLayer, activeFiltersRef],
//   )
// }
