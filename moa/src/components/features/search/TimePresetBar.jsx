import { useMemo, useRef, useState } from 'react'

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
    // 일부 브라우저는 showPicker 지원
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
 */
const TimePresetBar = ({ value, onChange, onRefresh, onApplyCustom }) => {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(() => new Date(Date.now() - 60 * 60 * 1000)) // 기본 1시간 전
  const [to, setTo] = useState(() => new Date())

  const handlePreset = (key) => {
    setOpen(false)
    onChange?.(key)
  }

  const handleCustomToggle = () => {
    // ✅ 수정: state 업데이트를 분리
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      // ✅ setTimeout으로 다음 렌더링 사이클로 미룸
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
    // 부모가 별도 리셋 로직을 갖고 있다면 호출
    onRefresh?.()
  }

  return (
    <div className='section card'>
      <div className='flex items-center justify-between'>
        {/* Left: label + pills */}
        <div className='flex items-center gap-4'>
          <div className='text-base font-medium'>조회 기간</div>
          <div className='flex items-center gap-3'>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type='button'
                onClick={() => handlePreset(p.key)}
                className={[
                  'px-4 py-2 rounded-lg border text-sm transition-colors',
                  value === p.key
                    ? 'bg-[#3877BE] text-white border-[#3877BE]'
                    : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}

            {/* Custom preset button */}
            <button
              type='button'
              onClick={handleCustomToggle}
              className={[
                'px-4 py-2 rounded-lg border text-sm inline-flex items-center gap-1',
                open
                  ? 'bg-[#3877BE] text-white border-[#3877BE]'
                  : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100',
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

        {/* Right: refresh */}
        <button
          type='button'
          onClick={resetToDefault}
          className='w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center'
          title='초기화'
        >
          <span className='text-base opacity-70'>↻</span>
          <span className='sr-only'>새로고침</span>
        </button>
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
