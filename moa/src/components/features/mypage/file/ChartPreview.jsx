// src/components/features/mypage/file/ChartPreview.jsx
import { memo } from 'react'
import { useExportImageUrl } from '@/hooks/queries/useFiles'

const ChartPreview = ({ fileId }) => {
  const { data: url, isLoading, error } = useExportImageUrl({ fileId, enabled: !!fileId })

  return (
    <div>
      <div className='px-4 py-3 text-sm font-medium text-gray-700'>차트 미리보기</div>

      {isLoading && <div className='px-4 py-8 text-center text-sm text-gray-500'>불러오는 중…</div>}

      {!isLoading && error && (
        <div className='px-4 py-6 text-center text-sm text-red-500'>
          차트 미리보기를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {!isLoading && !error && !url && (
        <div className='px-4 py-6 text-center text-sm text-gray-500'>
          이미지 URL을 가져오지 못했습니다.
        </div>
      )}

      {!isLoading && !error && url && (
        <div className='px-4 pb-4 flex justify-center'>
          <img
            src={url}
            alt='차트 미리보기'
            className='max-h-[360px] rounded border object-contain'
          />
        </div>
      )}
    </div>
  )
}

export default memo(ChartPreview)
