import React from 'react'
import PropTypes from 'prop-types'

/**
 * 위젯 설명 모달
 * - 위젯별 상세 설명, 활용 방법, 파악 가능한 부분 표시
 */
const WidgetInfoModal = ({ isOpen, onClose, title, description, sections }) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* 배경 오버레이 */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* 모달 컨텐츠 */}
      <div className='relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-blue-100'>
              <svg
                className='w-5 h-5 text-blue-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>{title}</h2>
              {description && <p className='text-sm text-gray-500 mt-1'>{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            aria-label='닫기'
          >
            <svg className='w-6 h-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* 본문 - 스크롤 가능 */}
        <div className='flex-1 overflow-y-auto p-6'>
          {sections.map((section, idx) => (
            <div key={idx} className='mb-6 last:mb-0'>
              {/* 섹션 제목 */}
              <div className='flex items-center gap-2 mb-3'>
                <span className='text-2xl'>{section.icon}</span>
                <h3 className='text-lg font-semibold text-gray-900'>{section.title}</h3>
              </div>

              {/* 섹션 내용 */}
              <ul className='space-y-2 ml-9'>
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className='flex items-start gap-2 text-gray-700'>
                    <span className='text-blue-600 mt-1.5 flex-shrink-0'>●</span>
                    <span className='text-sm leading-relaxed'>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className='p-4 border-t border-gray-200 bg-gray-50'>
          <button
            onClick={onClose}
            className='w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

WidgetInfoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
}

export default WidgetInfoModal
