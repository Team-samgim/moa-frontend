import { memo, forwardRef } from 'react'
import PropTypes from 'prop-types'
import CloseIcon from '@/assets/icons/delete.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import { useDragHandle } from '@/components/features/dashboard/DragHandleContext'

/**
 * 공통 위젯 카드
 * - 상단 헤더(아이콘 + 제목 + 설명 + (옵션)설정/닫기 버튼)
 * - 본문(children)
 * - showSettings/showClose로 버튼 노출 제어 (true/false)
 * - headerRight로 우측 커스텀 영역 삽입 가능 (필터, 메뉴 등)
 * - widgetInfo로 제목 옆 정보 아이콘 및 호버 툴팁 제공
 */
const IconButton = ({ label, onClick, children }) => {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={label}
      title={label}
      className='inline-grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2'
    >
      {children}
    </button>
  )
}

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
}

const WidgetCard = forwardRef(
  (
    {
      title,
      description,
      icon, // ReactNode | string(emoji)
      children,
      showSettings = true,
      showClose = true,
      showInfo = false, // 정보 아이콘 표시 여부
      onSettings,
      onClose,
      headerRight = null, // 우측 커스텀 영역

      // 위젯 설명 정보
      widgetInfo = null, // { title, description, sections: [{ icon, title, items: [] }] }
    },
    ref,
  ) => {
    const { listeners, attributes } = useDragHandle()

    return (
      <section ref={ref}>
        {/* 헤더 (타이틀, 설명, 설정, 닫기) */}
        <div className='flex items-start justify-between p-4'>
          <div className='flex items-start gap-3'>
            {/* 드래그 핸들 아이콘 */}
            {listeners && attributes ? (
              <button
                {...attributes}
                {...listeners}
                type='button'
                className='mt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 rounded'
                aria-label='위젯 이동'
                title='위젯 이동'
              >
                <SideKickIcon className='h-5 w-5' />
              </button>
            ) : (
              <div className='mt-0.5 text-gray-400' aria-label='위젯 이동' title='위젯 이동'>
                <SideKickIcon className='h-5 w-5' />
              </div>
            )}

            {icon ? (
              <div className='mt-0.5 text-xl'>
                {typeof icon === 'string' ? <span aria-hidden='true'>{icon}</span> : icon}
              </div>
            ) : null}
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold leading-6'>{title}</h3>

                {/* 제목 옆 정보 아이콘 (호버시 툴팁) */}
                {showInfo && widgetInfo && (
                  <div className='relative group'>
                    <button
                      type='button'
                      className='inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors cursor-help'
                      aria-label='위젯 설명'
                    >
                      <svg className='w-full h-full' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>

                    {/* 툴팁 - 호버시만 표시 */}
                    <div className='absolute left-0 top-full mt-2 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] pointer-events-none'>
                      {/* 화살표 */}
                      <div className='absolute left-4 bottom-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white' />
                      <div className='absolute left-4 bottom-full mb-px w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-200' />

                      {/* 툴팁 내용 */}
                      <div className='space-y-3'>
                        {widgetInfo.sections.map((section, idx) => (
                          <div key={idx}>
                            <div className='flex items-center gap-2 mb-2'>
                              <span className='text-lg'>{section.icon}</span>
                              <h4 className='text-sm font-semibold text-gray-900'>
                                {section.title}
                              </h4>
                            </div>
                            <ul className='space-y-1 ml-7'>
                              {section.items.map((item, itemIdx) => (
                                <li
                                  key={itemIdx}
                                  className='flex items-start gap-2 text-xs text-gray-600'
                                >
                                  <span className='text-blue-600 mt-0.5 flex-shrink-0'>•</span>
                                  <span className='leading-relaxed'>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {description ? (
                <p className='mt-0.5 text-sm text-muted-foreground text-gray-400'>{description}</p>
              ) : null}
            </div>
          </div>

          <div className='flex items-center gap-1'>
            {headerRight}

            {showSettings && (
              <IconButton label='설정' onClick={onSettings}>
                <SettingIcon />
              </IconButton>
            )}
            {showClose && (
              <IconButton label='닫기' onClick={onClose}>
                <CloseIcon />
              </IconButton>
            )}
          </div>
        </div>

        {/* 그래프, 차트 등  */}
        <div className='px-4 pb-4'>{children}</div>
      </section>
    )
  },
)

WidgetCard.displayName = 'WidgetCard'

WidgetCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node,
  showSettings: PropTypes.bool,
  showClose: PropTypes.bool,
  showInfo: PropTypes.bool,
  onSettings: PropTypes.func,
  onClose: PropTypes.func,
  className: PropTypes.string,
  headerRight: PropTypes.node,
  filterOptions: PropTypes.shape({
    widgetId: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    badgeCount: PropTypes.number,
    size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  }),
  renderFilterBody: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  onApplyFilter: PropTypes.func,
  widgetInfo: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        icon: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(PropTypes.string).isRequired,
      }),
    ).isRequired,
  }),
}

export default memo(WidgetCard)
