import { useEffect, useState, useMemo, useRef } from 'react'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import ResetIcon from '@/assets/icons/reset.svg?react'
import { LAYER_ACTIVE_STYLES } from '@/constants/colors'
import { LAYER_OPTIONS, TIME_PRESETS } from '@/constants/pivot'
import { isoToSeoulInputValue, seoulInputValueToDate } from '@/utils/dateFormat'

const PivotConfigPanel = ({
  layer,
  timeRange,
  customRange,
  onChangeLayer,
  onSelectTimePreset,
  onApplyCustomRange,
  isFromGrid = false,
  onPresetLoad,
  onSavePreset,
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const customWrapperRef = useRef(null)

  const [startInput, setStartInput] = useState('')
  const [endInput, setEndInput] = useState('')

  useEffect(() => {
    setStartInput(isoToSeoulInputValue(customRange?.from))
    setEndInput(isoToSeoulInputValue(customRange?.to))
  }, [customRange])

  useEffect(() => {
    if (!isCustomOpen) return

    const handleClickOutside = (e) => {
      if (!customWrapperRef.current) return

      if (!customWrapperRef.current.contains(e.target)) {
        setIsCustomOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCustomOpen])

  const handleToggleCustom = () => {
    if (isFromGrid) return // 그리드에서 온 경우 직접설정 팝업 열리지 않음
    setIsCustomOpen((prev) => !prev)
  }

  const handleApplyClick = () => {
    const fromDate = seoulInputValueToDate(startInput)
    const toDate = seoulInputValueToDate(endInput)

    if (!fromDate || !toDate) {
      // TODO: "시작/종료 일시를 모두 입력해주세요" 안내
      return
    }

    if (onApplyCustomRange) {
      onApplyCustomRange(fromDate, toDate)
    }
    setIsCustomOpen(false)
  }

  const isPresetActive = timeRange?.type === 'preset' && timeRange?.value

  const customRangeLabel = useMemo(() => {
    if (timeRange?.type !== 'custom' || !customRange?.from || !customRange?.to) {
      return ''
    }

    const fromStr = isoToSeoulInputValue(customRange.from)?.replace('T', ' ')
    const toStr = isoToSeoulInputValue(customRange.to)?.replace('T', ' ')

    if (!fromStr || !toStr) return ''
    return `${fromStr} ~ ${toStr}`
  }, [timeRange, customRange])

  const getTimePresetActiveClass = () => {
    if (isFromGrid) {
      return 'bg-gray-200 text-gray-700 border-gray-300 font-semibold'
    }

    const layerStyle = LAYER_ACTIVE_STYLES[layer]

    if (layerStyle) {
      return `${layerStyle} font-semibold`
    }

    return 'bg-[#EAF1F9] text-gray-700 border-gray-300 font-semibold'
  }

  return (
    <div className='w-full max-w-sm 4xl:max-w-xl shrink-0 space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='text-base 4xl:text-lg font-semibold text-gray-900'>피벗 테이블 구성</div>

        <div className='flex flex-wrap items-center gap-3 text-xs 4xl:text-sm font-medium text-[#2263AC]'>
          <button className='hover:underline' onClick={onSavePreset}>
            프리셋 저장
          </button>
          <button onClick={onPresetLoad} className='hover:underline'>
            프리셋 불러오기
          </button>
        </div>
      </div>

      {/* 조회 계층 */}
      <div>
        {/* 조회 계층 */}
        <div className='mb-3 text-sm 4xl:text-base font-medium text-gray-800'>조회 계층</div>
        <div className='grid grid-cols-4 justify-between w-full gap-2 4xl:gap-2.5'>
          {LAYER_OPTIONS.map((opt) => {
            const isActive = layer === opt
            const disabled = isFromGrid && opt !== layer

            const baseClass =
              'rounded 4xl:rounded-lg border px-3 py-2 4xl:px-4 4xl:py-2.5 text-xs 4xl:text-sm transition-colors'
            let stateClass = ''

            if (isActive) {
              if (isFromGrid) {
                // fromGrid + active
                stateClass =
                  'bg-gray-200 text-gray-700 border-gray-300 cursor-default font-semibold'
              } else {
                // free 모드 + active → 레이어 색 + font-semibold
                const layerStyle =
                  LAYER_ACTIVE_STYLES[opt] ?? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                stateClass = `${layerStyle} font-semibold`
              }
            } else {
              // inactive
              if (disabled) {
                stateClass =
                  'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed font-medium'
              } else {
                stateClass = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium'
              }
            }

            return (
              <button
                key={opt}
                onClick={() => !disabled && onChangeLayer(opt)}
                disabled={disabled}
                className={[baseClass, stateClass].join(' ')}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {isFromGrid && (
          <p className='mt-1 text-[10px] 4xl:text-xs text-gray-400'>
            검색에서 선택한 계층으로 고정되어 있습니다.
          </p>
        )}
      </div>

      {/* 조회 기간 */}
      <div>
        <div className='mb-3 flex justify-between items-center gap-2 text-sm 4xl:text-base font-medium text-gray-800'>
          <span>조회 기간</span>
          <button
            className='rounded border border-gray-300 bg-white p-1 4xl:p-1.5 hover:bg-gray-50 disabled:opacity-40'
            title='시간 새로고침'
            onClick={() => {
              if (isFromGrid) return
              if (isPresetActive) {
                onSelectTimePreset(timeRange.value)
              }
            }}
            disabled={isFromGrid}
          >
            <ResetIcon className='h-3.5 w-3.5 4xl:h-4 4xl:w-4 text-gray-500' />
          </button>
        </div>

        {/* 프리셋 버튼 */}
        <div className='grid grid-cols-4 gap-2.5 4xl:gap-3 w-full'>
          {TIME_PRESETS.map((p) => {
            const isActive = timeRange?.type === 'preset' && timeRange?.value === p.value

            const baseClass =
              'rounded 4xl:rounded-lg border px-3 py-2 4xl:px-4 4xl:py-2.5 text-xs 4xl:text-sm transition-colors'
            const inactiveClass =
              'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium'

            return (
              <button
                key={p.value}
                onClick={() => !isFromGrid && onSelectTimePreset(p.value)}
                disabled={isFromGrid}
                className={[
                  baseClass,
                  isActive ? getTimePresetActiveClass() : inactiveClass,
                  isFromGrid ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* 직접 설정 버튼 */}
        <div className='mt-2 relative' ref={customWrapperRef}>
          <button
            onClick={handleToggleCustom}
            disabled={isFromGrid}
            className='flex w-full items-center justify-between rounded 4xl:rounded-lg border border-gray-300 bg-white px-4 py-2 4xl:px-5 4xl:py-2.5 text-left text-xs 4xl:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed'
          >
            <span className='flex flex-col items-start text-xs 4xl:text-sm gap-0.5'>
              <span>직접 설정</span>

              {customRangeLabel && (
                <span className='text-[10px] 4xl:text-xs font-normal text-gray-500 line-clamp-1'>
                  {customRangeLabel}
                </span>
              )}
            </span>

            <ArrowDownIcon
              className={[
                'h-3 w-3 4xl:h-4 4xl:w-4 text-gray-500 transition-transform',
                isCustomOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {isCustomOpen && (
            <div className='absolute right-0 top-full mt-2 w-[min(360px,100vw-2rem)] 4xl:w-[min(400px,100vw-2rem)] rounded-md border border-gray-200 bg-white px-3 py-3 4xl:px-4 4xl:py-4 space-y-3 4xl:space-y-4 shadow-lg z-20'>
              <div className='space-y-2'>
                <div className='text-[11px] 4xl:text-xs font-medium text-gray-700'>시작 일시</div>
                <input
                  type='datetime-local'
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className='w-full rounded border border-gray-300 bg-white px-2 py-1.5 4xl:px-3 4xl:py-2 text-xs 4xl:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2263AC] focus:border-[#2263AC]'
                />
              </div>

              <div className='space-y-2'>
                <div className='text-[11px] 4xl:text-xs font-medium text-gray-700'>종료 일시</div>
                <input
                  type='datetime-local'
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className='w-full rounded border border-gray-300 bg-white px-2 py-1.5 4xl:px-3 4xl:py-2 text-xs 4xl:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2263AC] focus:border-[#2263AC]'
                />
              </div>

              <div className='flex items-center justify-end gap-2 pt-1'>
                <button
                  type='button'
                  className='rounded border border-gray-300 bg-white px-3 py-1.5 4xl:px-4 4xl:py-2 text-[11px] 4xl:text-xs font-medium text-gray-700 hover:bg-gray-100'
                  onClick={() => {
                    setIsCustomOpen(false)
                  }}
                >
                  취소
                </button>
                <button
                  type='button'
                  className='rounded bg-[#2263AC] px-4 py-1.5 4xl:px-5 4xl:py-2 text-[11px] 4xl:text-xs font-semibold text-white hover:bg-[#1a4f8a]'
                  onClick={handleApplyClick}
                >
                  적용
                </button>
              </div>
            </div>
          )}

          {isFromGrid && customRangeLabel && (
            <p className='mt-1 text-[10px] 4xl:text-xs text-gray-400'>
              검색에서 설정한 기간: {customRangeLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PivotConfigPanel
