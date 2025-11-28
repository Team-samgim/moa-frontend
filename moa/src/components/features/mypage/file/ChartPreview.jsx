/**
 * ChartPreview
 *
 * 서버에서 export된 차트 이미지를 받아 미리보기로 보여주는 컴포넌트.
 * fileId를 기반으로 이미지 URL을 요청하며 로딩/에러/빈값/성공 상태를 구분해 렌더링한다.
 *
 * 기능:
 * - fileId 변경 시 useExportImageUrl 훅을 통해 이미지 URL 조회
 * - isLoading: 로딩 상태 표시
 * - error: 오류 메시지 표시
 * - url 없음: 이미지가 없을 때의 안내 출력
 * - url 있음: 차트 이미지 렌더링
 *
 * Props:
 * - fileId: 서버에 저장된 차트 이미지 파일 ID
 *
 * 특징:
 * - React.memo로 리렌더링 최적화
 * - object-contain으로 이미지 비율 유지
 *
 * AUTHOR: 방대혁
 */

import { memo } from 'react'
import { useExportImageUrl } from '@/hooks/queries/useFiles'

const ChartPreview = ({ fileId }) => {
  // 이미지 URL 조회 (fileId가 있을 때만 요청)
  const { data: url, isLoading, error } = useExportImageUrl({ fileId, enabled: !!fileId })

  return (
    <div>
      {/* 헤더 */}
      <div className='px-4 py-3 text-[16px] font-semibold text-gray-800'>차트 미리보기</div>

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
            <div className='text-4xl mb-3'>⚠️</div>
            <p className='text-sm font-medium text-red-500'>
              차트 미리보기를 불러오는 중 오류가 발생했습니다.
            </p>
          </div>
        </div>
      )}

      {/* URL 없음 */}
      {!isLoading && !error && !url && (
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <div className='text-4xl mb-3'>🖼️</div>
            <p className='text-sm font-medium text-gray-600'>이미지 URL을 가져오지 못했습니다.</p>
          </div>
        </div>
      )}

      {/* 정상 이미지 렌더링 */}
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
