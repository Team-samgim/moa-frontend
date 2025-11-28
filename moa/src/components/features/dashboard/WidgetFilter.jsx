/**
 * 작성자: 정소영
 */
import React, { useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

const WidgetFilter = ({
  widgetId,
  title = '위젯 필터',
  description = '선택한 조건으로 이 위젯만 갱신됩니다.',
  icon: Icon,
  badgeCount = 0,
  renderTrigger, // (open,setOpen) => ReactNode (선택)
  size = 'xl', // sm|md|lg|xl (모달 가로폭 프리셋)
  onApply,
  onOpenChange,
  onCancel,
  children, // render-prop: ({ register, close }) => ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const getPayloadRef = useRef(() => undefined)

  const register = (getter) => {
    // Body가 현재 값을 반환하는 함수를 등록
    if (typeof getter === 'function') {
      getPayloadRef.current = getter
    }
  }

  const openModal = () => {
    setOpen(true)
    onOpenChange?.(true)
  }
  const close = () => {
    setOpen(false)
    onOpenChange?.(false)
  }

  const apply = () => {
    const payload = getPayloadRef.current?.()
    onApply?.(payload)
    setOpen(false)
  }

  const widthClass = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md':
        return 'max-w-xl'
      case 'lg':
        return 'max-w-2xl'
      default:
      case 'xl':
        return 'max-w-4xl'
    }
  }, [size])

  return (
    <>
      {/* Trigger */}
      {renderTrigger ? (
        renderTrigger(open, setOpen)
      ) : (
        <button
          type='button'
          onClick={openModal}
          className='relative rounded-full p-2 hover:bg-gray-100'
          title='필터'
        >
          {Icon ? <Icon className='h-4 w-4' /> : <span className='text-sm'>🔎</span>}
          {badgeCount > 0 && (
            <span className='absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white'>
              {badgeCount}
            </span>
          )}
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className='fixed inset-0 z-[100]'>
          <div className='absolute inset-0 bg-black/40' onClick={close} />
          <div
            className={`absolute left-1/2 top-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 ${widthClass} rounded-2xl bg-white shadow-xl`}
          >
            {/* Header */}
            <div className='px-6 pb-4 pt-6'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <div className='flex items-center gap-2 text-xl font-semibold'>
                    {Icon ? <Icon className='h-5 w-5' /> : null} {title}
                  </div>
                  {description && <p className='mt-1 text-[13px] text-gray-500'>{description}</p>}
                </div>
                {/* 배지 */}
                <div className='flex items-center gap-2'>
                  <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700'>
                    위젯: {widgetId}
                  </span>
                  {badgeCount > 0 && (
                    <span className='rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700'>
                      조건 {badgeCount}개
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className='h-px w-full bg-gray-200' />

            {/* Body (scroll) */}
            <div className='max-h-[65vh] overflow-auto px-6 py-5'>
              {typeof children === 'function' ? children({ register, close }) : children}
            </div>
            <div className='h-px w-full bg-gray-200' />

            {/* Footer */}
            <div className='flex items-center justify-end gap-2 px-6 py-4'>
              <button
                type='button'
                className='rounded-md border px-3 py-2 text-sm hover:bg-gray-50'
                onClick={() => {
                  onCancel?.()
                  close()
                }}
              >
                취소
              </button>
              <button
                type='button'
                className='rounded-md bg-[#3877BE] px-3 py-2 text-sm font-medium text-white hover:brightness-95 '
                onClick={apply}
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

WidgetFilter.propTypes = {
  widgetId: PropTypes.string.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  badgeCount: PropTypes.number,
  renderTrigger: PropTypes.func,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  onApply: PropTypes.func,
  onOpenChange: PropTypes.func,
  onCancel: PropTypes.func,
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
}

export default WidgetFilter
