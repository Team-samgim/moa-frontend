import { useEffect, useMemo, useRef, useState } from 'react'
import ResetIcon from '@/assets/icons/reset.svg?react'
import { LAYER_ACTIVE_STYLES } from '@/constants/colors'

const PRESETS = [
  { key: '1H', label: '1시간' },
  { key: '2H', label: '2시간' },
  { key: '24H', label: '24시간' },
  { key: '7D', label: '1주일' },
]

function formatKoDisplay(d) {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  const date = dt
    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replaceAll('.', '')
    .trim()
  const [y, m, day] = date.split(' ').filter(Boolean)
  const time = dt
    .toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
    .replace(':', ':')
  return `${y} - ${m} - ${day} ${time}`
}

// datetime-local value: 2025-10-08T03:12
function toLocalInputValue(d) {
  if (!d) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const h = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${y}-${m}-${day}T${h}:${min}`
}

const DateTimeField = ({ label, value, onChange }) => {
  const hiddenRef = useRef(null)
  const display = useMemo(() => formatKoDisplay(value), [value])

  const openPicker = () => {
    if (!hiddenRef.current) return
    if (hiddenRef.current.showPicker) hiddenRef.current.showPicker()
    else hiddenRef.current.click()
  }

  const handleHidden = (e) => {
    const v = e.target.value // yyyy-mm-ddThh:mm
    if (!v) return
    const next = new Date(v)
    onChange?.(next)
  }

  return (
    <div className='space-y-1'>
      <div className='text-sm text-gray-600'>{label}</div>
      <div className='relative'>
        {/* 표시용 input */}
        <input
          className='input pr-10 bg-white'
          readOnly={true}
          value={display}
          placeholder='YYYY - MM - DD 오전/오후 HH:MM'
        />
        {/* 달력 아이콘 버튼 */}
        <button
          type='button'
          onClick={openPicker}
          className='absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center'
          aria-label='달력 열기'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='w-4 h-4 opacity-70'
          >
            <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
            <line x1='16' y1='2' x2='16' y2='6'></line>
            <line x1='8' y1='2' x2='8' y2='6'></line>
            <line x1='3' y1='10' x2='21' y2='10'></line>
          </svg>
        </button>
        {/* 실제 피커 */}
        <input
          ref={hiddenRef}
          type='datetime-local'
          className='sr-only'
          value={value ? toLocalInputValue(value) : ''}
          onChange={handleHidden}
        />
      </div>
    </div>
  )
}

/**
 * props
 * - value: 현재 선택된 preset 키('1H' | '2H' | '24H' | '7D' | 'CUSTOM')
 * - onChange: (key) => void
 * - onRefresh?: () => void
 * - onApplyCustom?: ({ from: Date, to: Date }) => void
 * - customRange?: { from?: Date, to?: Date, fromEpoch?: number, toEpoch?: number }
 * - autoOpenOnCustom?: boolean
 * - onClearCustom?: () => void
 * - layerKey?: 'HTTP_PAGE' | 'HTTP_URI' | 'TCP' | 'ETHERNET'
 */
const TimePresetBar = ({
  value,
  onChange,
  onRefresh,
  onApplyCustom,
  customRange,
  autoOpenOnCustom = false,
  onClearCustom,
  layerKey,
}) => {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(() => new Date(Date.now() - 60 * 60 * 1000)) // 기본 1시간 전
  const [to, setTo] = useState(() => new Date())

  const getActiveButtonClass = () => {
    const layerStyle =
      (layerKey && LAYER_ACTIVE_STYLES[layerKey]) || 'bg-[#3877BE] text-white border-[#3877BE]' // fallback

    return `${layerStyle} font-semibold`
  }

  const inactiveButtonClass = 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 font-medium'

  useEffect(() => {
    if (value !== 'CUSTOM' || !customRange) return
    const epochToDate = (sec) => (Number.isFinite(sec) ? new Date(sec * 1000) : null)
    const f = customRange.from || epochToDate(customRange.fromEpoch)
    const t = customRange.to || epochToDate(customRange.toEpoch)
    if (f && t) {
      setFrom(new Date(f))
      setTo(new Date(t))
      if (autoOpenOnCustom) setOpen(true)
    }
  }, [
    value,
    customRange?.from,
    customRange?.to,
    customRange?.fromEpoch,
    customRange?.toEpoch,
    autoOpenOnCustom,
  ])

  const handlePreset = (key) => {
    setOpen(false)
    onChange?.(key)
    if (key !== 'CUSTOM') onClearCustom?.()
  }

  const handleCustomToggle = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      setTimeout(() => {
        onChange?.('CUSTOM')
      }, 0)
    }
  }

  const applyCustom = () => {
    onChange?.('CUSTOM')
    onApplyCustom?.({ from, to })
  }

  // 초기화 핸들러: 1시간 preset, 패널 닫기, 1시간 범위로 from/to 세팅
  const resetToDefault = () => {
    setOpen(false)
    const now = new Date()
    setTo(now)
    setFrom(new Date(now.getTime() - 60 * 60 * 1000))
    onChange?.('1H')
    onRefresh?.()
    onClearCustom?.()
  }

  const isCustomActive = value === 'CUSTOM'

  return (
    <div className='section card flex-2'>
      <div className='flex items-center justify-between'>
        {/* Left: label + pills */}
        <div className='flex-col w-full items-center gap-4'>
          <div className='flex justify-between mb-2'>
            <div className='text-sm font-medium text-gray-800'>조회 기간</div>
            <button
              className='rounded border border-gray-300 bg-white p-1 hover:bg-gray-50 disabled:opacity-40'
              title='시간 새로고침'
              onClick={resetToDefault}
            >
              <ResetIcon className='h-3.5 w-3.5 text-gray-500' />
            </button>
          </div>

          {/* 프리셋 + 직접 설정 버튼 줄 */}
          <div className='flex w-full gap-2'>
            {PRESETS.map((p) => {
              const isActive = value === p.key
              const baseClass =
                'flex-1 px-4 py-2 rounded border text-xs transition-colors text-center'

              return (
                <button
                  key={p.key}
                  type='button'
                  onClick={() => handlePreset(p.key)}
                  className={[
                    baseClass,
                    isActive ? getActiveButtonClass() : inactiveButtonClass,
                  ].join(' ')}
                >
                  {p.label}
                </button>
              )
            })}

            {/* Custom preset button */}
            <button
              type='button'
              onClick={handleCustomToggle}
              className={[
                'flex-4 px-4 py-2 rounded border text-xs transition-colors inline-flex items-center justify-between gap-1.5',
                isCustomActive ? getActiveButtonClass() : inactiveButtonClass,
              ].join(' ')}
            >
              <span>직접설정</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                className='w-3.5 h-3.5 opacity-70'
              >
                <path d='M6 9l6 6 6-6' />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Range Panel */}
      {open && (
        <div className='mt-4 rounded-xl border border-blue-100 bg-gray-50 p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <DateTimeField label='시작일시' value={from} onChange={setFrom} />
            <DateTimeField label='종료일시' value={to} onChange={setTo} />
          </div>
          <div className='mt-6 flex justify-end'>
            <button type='button' onClick={applyCustom} className='btn btn-primary'>
              적용하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimePresetBar
