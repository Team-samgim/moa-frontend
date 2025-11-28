/**
 * PivotCsvPreview
 *
 * 내보낸 PIVOT CSV 파일의 내용을 테이블 형태로 미리보기로 제공하는 컴포넌트.
 *
 * 구조 특징:
 * - export된 pivot CSV는 일반적으로 다음 형태를 가짐:
 *   1) 첫 번째 행: 메트릭(alias) 라인
 *   2) 이후 데이터 행들
 *   3) 컬럼 구조: ["#", rowFieldName, rowFieldValue, ...pivotColumnValues]
 *
 * 기능:
 * - useExportPreview 훅으로 CSV 일부를 가져와 렌더링
 * - 첫 row를 aliasRow로 분리하여 2단 헤더 구성
 * - 비어 있음 / 오류 / 로딩 상태를 명확히 표시
 *
 * Props:
 * - fileId: 서버에 저장된 export 파일 식별자
 * - pivotConfig: 피벗 설정(열 필드 이름 등 표시용)
 *
 * AUTHOR: 방대혁
 */

import { memo, useMemo } from 'react'
import { useExportPreview } from '@/hooks/queries/useFiles'

const PivotCsvPreview = ({ fileId, pivotConfig }) => {
  /**
   * fileId로 서버에서 CSV preview를 가져온다.
   * - limit: 최대 500행까지 미리보기
   */
  const { data, isLoading, error } = useExportPreview({
    fileId,
    limit: 500,
    enabled: !!fileId,
  })

  const columns = data?.columns || []
  const rows = data?.rows || []
  const hasData = columns.length > 0 && rows.length > 0

  /**
   * CSV 형식:
   * metaCols: ["#", rowFieldName, rowFieldValue]
   * valueCols: pivot 컬럼들
   */
  const metaCols = useMemo(() => columns.slice(0, 3), [columns])
  const valueCols = useMemo(() => columns.slice(3), [columns])

  /**
   * 첫 번째 row는 value alias들이 들어있는 메타 행
   */
  const aliasRow = hasData ? rows[0] : null
  const dataRows = hasData ? rows.slice(1) : []

  const columnFieldName = pivotConfig?.column?.field || ''

  return (
    <div>
      <div className='px-4 py-3 text-[16px] font-semibold text-gray-800'>피벗 미리보기</div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className='px-4 py-12 text-center'>
          <div className='inline-flex items-center gap-2 text-blue-600'>
            <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <span className='text-sm font-medium'>불러오는 중…</span>
          </div>
        </div>
      )}

      {/* 오류 상태 */}
      {!isLoading && error && (
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <p className='text-sm font-medium text-red-500'>
              피벗 미리보기를 불러오는 중 오류가 발생했습니다.
            </p>
          </div>
        </div>
      )}

      {/* 데이터 없음 */}
      {!isLoading && !error && !hasData && (
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <p className='text-sm font-medium text-gray-600'>데이터가 없습니다.</p>
          </div>
        </div>
      )}

      {/* 데이터 테이블 렌더링 */}
      {!isLoading && !error && hasData && (
        <div className='rounded-lg border overflow-hidden border-gray-300 shadow-sm'>
          <div className='overflow-x-auto w-full'>
            <div className='max-h-160 overflow-y-auto'>
              <table className='min-w-max border-collapse text-sm text-gray-800 w-full'>
                <thead
                  className='bg-gray-50 text-gray-700 text-left align-bottom sticky top-0 z-10'
                  style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                >
                  {/* 첫 번째 헤더: 컬럼 이름(메타 3개 + pivot 컬럼들) */}
                  <tr
                    className='border-b border-gray-200'
                    style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
                  >
                    {/* metaCols: "#", rowFieldName, rowFieldValue */}
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

                    {/* pivot columns */}
                    {valueCols.map((col) => (
                      <th
                        key={col}
                        className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50'
                      >
                        {col}
                      </th>
                    ))}
                  </tr>

                  {/* 두 번째 헤더: metric alias row */}
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

                {/* 데이터 바디 */}
                <tbody className='bg-white'>
                  {dataRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className='border-b border-gray-200 text-gray-800 hover:bg-blue-50/30 transition-colors duration-150'
                    >
                      {/* metaCols */}
                      {metaCols.map((col) => (
                        <td
                          key={col}
                          className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100 whitespace-nowrap'
                        >
                          {row[col]}
                        </td>
                      ))}

                      {/* pivot values */}
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

          {/* footer: pivot의 column 기준 값 */}
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
