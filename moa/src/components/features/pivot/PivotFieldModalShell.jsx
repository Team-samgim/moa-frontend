const PivotFieldModalShell = ({
  title,
  // headerRight, // e.g. "3/11", "선택한 필드: src_ip"
  tokensArea, // 위쪽 선택된 토큰 영역 (행, 값에서만)
  onApply,
  onClose,
  children, // 필드 리스트 영역
  sortOrder,
  onSortChange,
  searchValue,
  onSearchChange,
}) => {
  return (
    <div className='fixed inset-0 z-[999] flex items-center justify-center bg-black/50'>
      <div className='max-h-[80vh] w-[680px] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-start justify-between p-4'>
          <div className='text-lg font-semibold text-gray-900'>{title}</div>
          <div className='flex gap-2'>
            <button
              onClick={onApply}
              className='rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              적용
            </button>
            <button
              onClick={onClose}
              className='rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              취소
            </button>
          </div>
        </div>

        {/* 이미 선택된 필드 토큰 영역 (필요 없으면 안 넘김) */}
        {tokensArea && <div className='px-4'>{tokensArea}</div>}

        {/* 검색 + 정렬 */}
        <div className='px-4 pt-4'>
          <div className='flex items-center gap-2'>
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='필드 검색'
              className='flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none'
            />
            <div className='flex items-center gap-1 text-xs'>
              <button
                onClick={() => onSortChange('asc')}
                className={`rounded border px-2 py-1 ${
                  sortOrder === 'asc'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                오름차순
              </button>
              <button
                onClick={() => onSortChange('desc')}
                className={`rounded border px-2 py-1 ${
                  sortOrder === 'desc'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                내림차순
              </button>
            </div>
          </div>
        </div>

        {/* 리스트 헤더 라인: 예를 들어 "전체 선택 3/11" / "선택한 필드: src_ip" 등을 여기 children 위에 그려도 되고,
           각 모달에서 따로 넣어도 돼. 지금은 children 쪽에서 그리게 할게. */}

        {/* 스크롤 영역 */}
        <div className='mt-4 flex-1 overflow-y-auto px-4 pb-4'>{children}</div>
      </div>
    </div>
  )
}

export default PivotFieldModalShell
