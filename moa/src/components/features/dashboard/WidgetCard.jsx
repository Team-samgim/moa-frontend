import { memo } from 'react'
import PropTypes from 'prop-types'
import WidgetFilter from './WidgetFilter'
import CloseIcon from '@/assets/icons/delete.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'

/**
 * 공통 위젯 카드
 * - 상단 헤더(아이콘 + 제목 + 설명 + (옵션)설정/닫기 버튼)
 * - 본문(children)
 * - showSettings/showClose로 버튼 노출 제어 (true/false)
 * - headerRight로 우측 커스텀 영역 삽입 가능 (필터, 메뉴 등)
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

const WidgetCard = ({
  title,
  description,
  icon, // ReactNode | string(emoji)
  children,
  showSettings = true,
  showClose = true,
  onSettings,
  onClose,
  headerRight = null, // 우측 커스텀 영역
  // 필터 팝업 사용 시 전달 (선택)
  filterOptions = null, // { widgetId, title, description, badgeCount, size }
  renderFilterBody = null, // ({ register, close }) => ReactNode
  onApplyFilter = null,
}) => {
  return (
    <section>
      {/* 헤더 (타이틀, 설명, 설정, 닫기) */}
      <div className='flex items-start justify-between p-4'>
        <div className='flex items-start gap-3'>
          {icon ? (
            <div className='mt-0.5 text-xl'>
              {typeof icon === 'string' ? <span aria-hidden='true'>{icon}</span> : icon}
            </div>
          ) : null}
          <div>
            <h3 className='font-semibold leading-6'>{title}</h3>
            {description ? (
              <p className='mt-0.5 text-sm text-muted-foreground text-gray-400'>{description}</p>
            ) : null}
          </div>
        </div>

        <div className='flex items-center gap-1'>
          {headerRight}
          {showSettings &&
            (renderFilterBody ? (
              <WidgetFilter
                widgetId={filterOptions?.widgetId || title}
                title={filterOptions?.title || '위젯 필터'}
                description={filterOptions?.description || '선택한 조건만 이 위젯에 적용됩니다.'}
                badgeCount={filterOptions?.badgeCount || 0}
                size={filterOptions?.size || 'xl'}
                onApply={onApplyFilter}
                renderTrigger={(open, setOpen) => (
                  <IconButton label='설정' onClick={() => setOpen(true)}>
                    <SettingIcon />
                  </IconButton>
                )}
              >
                {renderFilterBody}
              </WidgetFilter>
            ) : (
              <IconButton label='설정' onClick={onSettings}>
                <SettingIcon />
              </IconButton>
            ))}
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
}

WidgetCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  children: PropTypes.node,
  showSettings: PropTypes.bool,
  showClose: PropTypes.bool,
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
}

export default memo(WidgetCard)
