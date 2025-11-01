import React from 'react'

const GridToolbar = ({ currentLayer, onReset, onPivot }) => {
  return (
    <div className='mb-4 flex items-center justify-between'>
      <div className='rounded-md bg-[#3877BE] px-3 py-1.5 font-medium text-white'>
        {currentLayer}
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={onReset}
          className='rounded-md border border-[#3877BE] px-3 py-1.5 text-[#3877BE] bg-white hover:bg-blue-50 transition'
        >
          필터 초기화
        </button>
        {onPivot && (
          <button
            onClick={onPivot}
            className='rounded-md bg-[#3877BE] px-3 py-1.5 text-white shadow-sm hover:shadow transition'
          >
            피벗 모드
          </button>
        )}
      </div>
    </div>
  )
}

export default GridToolbar
