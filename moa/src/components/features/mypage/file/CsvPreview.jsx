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
      <div className='px-4 py-3 text-sm font-medium text-gray-700'>CSV 미리보기</div>
      {isLoading ? (
        <div className='px-4 py-8 text-center text-sm text-gray-500'>불러오는 중…</div>
      ) : rows.length === 0 ? (
        <div className='px-4 py-6 text-center text-sm text-gray-500'>데이터가 없습니다.</div>
      ) : (
        <PreviewGrid rows={rows} columns={columns} height={360} />
      )}
    </div>
  )
}

export default memo(CsvPreview)
