import { useEffect, useState, useMemo, useRef } from 'react'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import ResetIcon from '@/assets/icons/reset.svg?react'
import { LAYER_OPTIONS, TIME_PRESETS } from '@/constants/pivot'
import { isoToSeoulInputValue, seoulInputValueToDate } from '@/utils/dateFormat'

const PivotConfigPanel = ({
  layer,
  timeRange,
  customRange,
  onChangeLayer,
  onSelectTimePreset,
  onApplyCustomRange,
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

  return (
    <div className='w-full max-w-xs shrink-0 space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='text-base font-semibold text-gray-900'>피벗 테이블 구성</div>

        <div className='flex flex-wrap items-center gap-3 text-xs font-medium text-[#2263AC]'>
          <button className='hover:underline'>프리셋 저장</button>
          <button className='hover:underline'>프리셋 불러오기</button>
        </div>
      </div>

      {/* 조회 계층 */}
      <div>
        <div className='mb-3 text-sm font-medium text-gray-800'>조회 계층</div>
        <div className='flex flex-wrap justify-between w-full'>
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onChangeLayer(opt)}
              className={[
                'rounded border px-3 py-2 text-xs font-medium',
                layer === opt
                  ? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                  : 'bg-[#F5F5F7] text-gray-700 border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 조회 기간 */}
      <div>
        <div className='mb-3 flex justify-between items-center gap-2 text-sm font-medium text-gray-800'>
          <span>조회 기간</span>
          <button
            className='rounded border border-gray-300 bg-white p-1 hover:bg-gray-50'
            title='시간 새로고침'
            onClick={() => {
              if (isPresetActive) {
                onSelectTimePreset(timeRange.value)
              }
            }}
          >
            <ResetIcon className='h-3.5 w-3.5 text-gray-500' />
          </button>
        </div>

        {/* 프리셋 버튼 */}
        <div className='grid grid-cols-4 gap-2.5 w-full'>
          {TIME_PRESETS.map((p) => {
            const isActive = timeRange?.type === 'preset' && timeRange?.value === p.value

            return (
              <button
                key={p.value}
                onClick={() => onSelectTimePreset(p.value)}
                className={[
                  'rounded border px-3 py-2 text-xs font-medium',
                  isActive
                    ? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                    : 'bg-[#F5F5F7] text-gray-700 border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className='mt-2 relative' ref={customWrapperRef}>
          <button
            onClick={handleToggleCustom}
            className='flex w-full items-center justify-between rounded border border-gray-300 bg-white px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50'
          >
            <span className='flex flex-col items-start text-xs gap-0.5'>
              <span>직접 설정</span>

              {customRangeLabel && (
                <span className='text-[10px] font-normal text-gray-500 line-clamp-1'>
                  {customRangeLabel}
                </span>
              )}
            </span>

            <ArrowDownIcon
              className={[
                'h-3 w-3 text-gray-500 transition-transform',
                isCustomOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {isCustomOpen && (
            <div className='absolute right-0 top-full mt-2 w-[min(360px,100vw-2rem)] rounded-md border border-gray-200 bg-white px-3 py-3 space-y-3 shadow-lg z-20'>
              <div className='space-y-2'>
                <div className='text-[11px] font-medium text-gray-700'>시작 일시</div>
                <input
                  type='datetime-local'
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value)}
                  className='w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2263AC] focus:border-[#2263AC]'
                />
              </div>

              <div className='space-y-2'>
                <div className='text-[11px] font-medium text-gray-700'>종료 일시</div>
                <input
                  type='datetime-local'
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  className='w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2263AC] focus:border-[#2263AC]'
                />
              </div>

              <div className='flex items-center justify-end gap-2 pt-1'>
                <button
                  type='button'
                  className='rounded border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100'
                  onClick={() => {
                    setIsCustomOpen(false)
                  }}
                >
                  취소
                </button>
                <button
                  type='button'
                  className='rounded bg-[#2263AC] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a4f8a]'
                  onClick={handleApplyClick}
                >
                  적용
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PivotConfigPanel
