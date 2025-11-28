/**
 * GridPresetDetail
 *
 * 검색 CSV(GRID) 내보내기의 검색 조건을 요약해서 보여주는 상세 패널.
 *
 * 주요 표시 항목:
 * - 조회 기간(절대/상대)
 * - 조회 필드(columns)
 * - 조건 리스트(field, operator, values)
 * - global NOT 여부
 *
 * 신/구 config 구조를 모두 안정적으로 처리:
 *   payload = { search: {...} } 또는 payload 자체를 search로 간주
 *
 * AUTHOR: 방대혁
 */
import { memo, useMemo } from 'react'
import { useExportPreview } from '@/hooks/queries/useFiles'

const PivotCsvPreview = ({ fileId, pivotConfig }) => {
  const { data, isLoading, error } = useExportPreview({
    fileId,
    limit: 500,
    enabled: !!fileId,
  })

  const columns = data?.columns || []
  const rows = data?.rows || []

  const hasData = columns.length > 0 && rows.length > 0

  const metaCols = useMemo(() => columns.slice(0, 3), [columns])
  const valueCols = useMemo(() => columns.slice(3), [columns])

  const aliasRow = hasData ? rows[0] : null
  const dataRows = hasData ? rows.slice(1) : []

  const columnFieldName = pivotConfig?.column?.field || ''

  return (
    <div>
      <div className='px-4 py-3 text-[16px] font-semibold text-gray-800'>피벗 미리보기</div>

      {isLoading && (
        <div className='px-4 py-12 text-center'>
          <div className='inline-flex items-center gap-2 text-blue-600'>
            <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <span className='text-sm font-medium'>불러오는 중...</span>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className='px-4 py-12 text-center text-sm text-red-500'>
          피벗 미리보기를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {!isLoading && !error && !hasData && (
        <div className='px-4 py-12 text-center text-sm text-gray-600'>데이터가 없습니다.</div>
      )}

      {!isLoading && !error && hasData && (
        <div className='rounded-lg border overflow-hidden border-gray-300 shadow-sm'>
          <div className='overflow-x-auto w-full'>
            <div className='max-h-160 overflow-y-auto'>
              <table className='min-w-max border-collapse text-sm text-gray-800 w-full'>
                <thead
                  className='bg-gray-50 text-gray-700 text-left align-bottom sticky top-0 z-10'
                  style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                >
                  <tr
                    className='border-b border-gray-200'
                    style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                  >
                    {metaCols.map((col, idx) => (
                      <th
                        key={col}
                        rowSpan={2}
                        className='px-3 py-2 font-medium align-middle border-r border-b border-gray-200 whitespace-nowrap text-left bg-gray-50'
                        style={
                          idx === 0 ? { width: '60px' } : { width: '200px', minWidth: '200px' }
                        }
                      >
                        {col}
                      </th>
                    ))}

                    {valueCols.map((col) => (
                      <th
                        key={col}
                        className='px-3 py-2 font-medium align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50'
                      >
                        {col}
                      </th>
                    ))}
                  </tr>

                  <tr
                    className='border-b border-gray-200'
                    style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                  >
                    {valueCols.map((col) => (
                      <th
                        key={col}
                        className='px-3 py-2 font-medium align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50'
                      >
                        {aliasRow?.[col] ?? ''}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className='bg-white'>
                  {dataRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className='border-b border-gray-200 text-gray-800 hover:bg-blue-50/30 transition-colors duration-150'
                    >
                      {metaCols.map((col) => (
                        <td
                          key={col}
                          className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100 whitespace-nowrap'
                        >
                          {row[col]}
                        </td>
                      ))}

                      {valueCols.map((col) => (
                        <td
                          key={col}
                          className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100 whitespace-nowrap text-right'
                        >
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {columnFieldName && (
            <div className='border-t border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600'>
              열 기준 필드: <span className='font-medium'>{columnFieldName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(PivotCsvPreview)
