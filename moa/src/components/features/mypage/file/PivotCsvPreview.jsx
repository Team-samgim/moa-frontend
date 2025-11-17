import { memo, useMemo } from 'react'
import { useExportPreview } from '@/hooks/queries/useFiles'

const PivotCsvPreview = ({ fileId, pivotConfig }) => {
  const { data, isLoading, error } = useExportPreview({
    fileId,
    limit: 500, // 필요하면 조정
    enabled: !!fileId,
  })

  const columns = data?.columns || []
  const rows = data?.rows || []

  const hasData = columns.length > 0 && rows.length > 0

  // CSV 구조: 앞 3개("#", rowFieldName, rowFieldValue) + 나머지(피벗 컬럼들)
  const metaCols = useMemo(() => columns.slice(0, 3), [columns])
  const valueCols = useMemo(() => columns.slice(3), [columns])

  // 첫 행은 metric alias ("개수: dst_ip" 같은거)
  const aliasRow = hasData ? rows[0] : null
  const dataRows = hasData ? rows.slice(1) : []

  const columnFieldName = pivotConfig?.column?.field || ''

  return (
    <div>
      <div className='px-4 py-3 text-sm font-medium text-gray-700'>피벗 미리보기</div>

      {isLoading && <div className='px-4 py-8 text-center text-sm text-gray-500'>불러오는 중…</div>}

      {!isLoading && error && (
        <div className='px-4 py-6 text-center text-sm text-red-500'>
          피벗 미리보기를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {!isLoading && !error && !hasData && (
        <div className='px-4 py-6 text-center text-sm text-gray-500'>데이터가 없습니다.</div>
      )}

      {!isLoading && !error && hasData && (
        <div className='rounded-lg border overflow-hidden border-gray-300'>
          <div className='overflow-x-auto w-full'>
            <div className='max-h-160 overflow-y-auto'>
              <table className='min-w-max border-collapse text-sm text-gray-800 w-full'>
                <thead
                  className='bg-gray-50 text-gray-700 text-left align-bottom sticky top-0 z-10'
                  style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                >
                  {/* 1줄째 헤더: 컬럼 이름들 */}
                  <tr
                    className='border-b border-gray-200'
                    style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                  >
                    {metaCols.map((col, idx) => (
                      <th
                        key={col}
                        rowSpan={2}
                        className='px-3 py-2 font-medium text-gray-700 align-middle border-r border-b border-gray-200 whitespace-nowrap text-left bg-gray-50'
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
                        className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50'
                      >
                        {/* 컬럼 헤더: http_content_type 값들 */}
                        {col}
                      </th>
                    ))}
                  </tr>

                  {/* 2줄째 헤더: metric alias ("개수: dst_ip") */}
                  <tr
                    className='border-b border-gray-200'
                    style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                  >
                    {valueCols.map((col) => (
                      <th
                        key={col}
                        className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50'
                      >
                        {aliasRow?.[col] ?? ''}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className='bg-white'>
                  {dataRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className='border-b border-gray-200 text-gray-800'>
                      {/* meta: "#", rowFieldName, rowFieldValue */}
                      {metaCols.map((col) => (
                        <td
                          key={col}
                          className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100 whitespace-nowrap'
                        >
                          {row[col]}
                        </td>
                      ))}

                      {/* 값 셀들 */}
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

          {/* 필요하면 요약 텍스트 추가 가능 */}
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
