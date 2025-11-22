import { useEffect } from 'react'
import { allowScroll, preventScroll } from '@/utils/modal'

const PivotFieldModalShell = ({
  title,
  // headerRight, // e.g. "3/11", "선택한 필드: src_ip"
  tokensArea, // 위쪽 선택된 토큰 영역 (행, 값에서만)
  onApply,
  onClose,
  children, // 필드 리스트 영역
  searchValue,
  onSearchChange,
}) => {
  useEffect(() => {
    const prevScrollY = preventScroll()
    return () => {
      allowScroll(prevScrollY)
    }
  }, [])

  return (
    <div className='fixed inset-0 z-999 flex items-center justify-center bg-black/50'>
      <div className='h-[80vh] w-[680px] 4xl:w-[800px] 4xl:h-[75vh] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-start justify-between p-6'>
          <div className='text-lg font-semibold text-gray-900'>{title}</div>
          <div className='flex gap-2'>
            <button
              onClick={onApply}
              className='rounded bg-blue-light px-5 py-1.5 text-sm font-medium text-white hover:bg-blue-dark'
            >
              적용
            </button>
            <button
              onClick={onClose}
              className='rounded border border-gray-300 bg-white px-5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              취소
            </button>
          </div>
        </div>

        {/* 선택된 필드 토큰 */}
        {tokensArea && <div className='px-6'>{tokensArea}</div>}

        {/* 검색 */}
        <div className='px-6 pt-4'>
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='필드 검색'
            className='w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none'
          />
        </div>

        {/* 스크롤 영역 */}
        <div className='mt-4 flex-1 overflow-y-auto px-6 pb-4'>{children}</div>
      </div>
    </div>
  )
}

export default PivotFieldModalShell
