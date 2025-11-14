import { useState, useEffect } from 'react'

const LAYER_OPTIONS = [
  { key: 'HTTP_PAGE', label: 'HTTP PAGE' },
  { key: 'HTTP_URI', label: 'HTTP URI' },
  { key: 'TCP', label: 'TCP' },
  { key: 'ETHERNET', label: 'Ethernet' },
]

/**
 * props
 * - active: 현재 선택된 계층 키(HTTP_PAGE | HTTP_URI | TCP | ETHERNET)
 * - onChange: (opt) => void  // opt = { key, label, table? }
 */
const LayerBar = ({ active, onChange }) => {
  // uncontrolled fallback
  const [inner, setInner] = useState(active ?? 'HTTP_PAGE')
  const current = active ?? inner

  useEffect(() => {
    if (active === null) return
    setInner(active)
  }, [active])

  const handleClick = (opt) => {
    if (!onChange) setInner(opt.key) // 부모가 제어하지 않으면 내부 상태로 하이라이트 유지
    onChange?.(opt) // 부모가 제어하는 경우는 부모가 active를 내려줘야 하이라이트 유지
  }

  return (
    <div className='section card'>
      <div className='flex items-center gap-4'>
        <div className='text-base font-medium'>조회 계층</div>
        <div className='flex items-center gap-3'>
          {LAYER_OPTIONS.map((opt) => {
            const isActive = current === opt.key
            return (
              <button
                key={opt.key}
                type='button'
                onClick={() => handleClick(opt)}
                className={[
                  'px-4 py-2 rounded-lg border text-sm transition-colors',
                  isActive
                    ? 'bg-[#3877BE] text-white border-[#3877BE]'
                    : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100',
                  'cursor-pointer',
                ].join(' ')}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

LayerBar.OPTIONS = LAYER_OPTIONS
export default LayerBar
