import { memo } from 'react'
import { useExportImageUrl } from '@/hooks/queries/useFiles'

const ChartPreview = ({ fileId }) => {
  const { data: url, isLoading, error } = useExportImageUrl({ fileId, enabled: !!fileId })

  return (
    <div>
      <div className='px-4 py-3 text-[16px] font-semibold text-gray-800'>차트 미리보기</div>

      {isLoading && (
        <div className='px-4 py-12 text-center'>
          <div className='inline-flex items-center gap-2 text-blue-600'>
            <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <span className='text-sm font-medium'>불러오는 중…</span>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <div className='text-4xl mb-3'>⚠️</div>
            <p className='text-sm font-medium text-red-500'>
              차트 미리보기를 불러오는 중 오류가 발생했습니다.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && !url && (
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <div className='text-4xl mb-3'>🖼️</div>
            <p className='text-sm font-medium text-gray-600'>이미지 URL을 가져오지 못했습니다.</p>
          </div>
        </div>
      )}

      {!isLoading && !error && url && (
        <div className='px-4 pb-4 flex justify-center'>
          <img
            src={url}
            alt='차트 미리보기'
            className='max-h-[360px] rounded-lg border border-gray-200 object-contain shadow-sm'
          />
        </div>
      )}
    </div>
  )
}

export default memo(ChartPreview)
