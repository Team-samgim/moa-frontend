import { memo, useMemo } from 'react'
import PreviewGrid from '@/components/features/mypage/file/PreviewGrid'
import { useExportPreview } from '@/hooks/queries/useFiles'

const CsvPreview = ({ fileId }) => {
  const { data, isLoading } = useExportPreview({ fileId, limit: 20, enabled: !!fileId })
  const rows = data?.rows || []
  const columns = useMemo(() => {
    if (Array.isArray(data?.columns) && data.columns.length) return data.columns
    if (rows.length) return Object.keys(rows[0])
    return []
  }, [data, rows])

  return (
    <div>
      <div className='px-4 py-3 text-[16px] font-semibold text-gray-800'>CSV 미리보기</div>
      {isLoading ? (
        <div className='px-4 py-12 text-center'>
          <div className='inline-flex items-center gap-2 text-blue-600'>
            <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <span className='text-sm font-medium'>불러오는 중…</span>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <div className='text-4xl mb-3'>📄</div>
            <p className='text-sm font-medium text-gray-600'>데이터가 없습니다.</p>
          </div>
        </div>
      ) : (
        <PreviewGrid rows={rows} columns={columns} height={360} />
      )}
    </div>
  )
}

export default memo(CsvPreview)
