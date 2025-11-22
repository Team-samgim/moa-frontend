import { useState, useEffect } from 'react'
import { LAYER_ACTIVE_STYLES } from '@/constants/colors'

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
    <div className='flex-[0.8] 4xl:flex-[0.5]'>
      <div className='flex-col h-full justify-between items-center align'>
        <div className='mb-3 text-sm 4xl:text-base font-medium text-gray-800'>조회 계층</div>
        <div className='flex w-full gap-2 4xl:gap-3'>
          {LAYER_OPTIONS.map((opt) => {
            const isActive = current === opt.key

            const baseClass =
              'flex-1 px-4.5 py-2 4xl:px-6 4xl:py-3 rounded 4xl:rounded-lg border text-xs 4xl:text-sm transition-colors'

            // LAYER_ACTIVE_STYLES 키가 key 기준인지 label 기준인지 섞여 있을 수 있어서 둘 다 시도
            const activeStyle =
              LAYER_ACTIVE_STYLES[opt.key] ??
              LAYER_ACTIVE_STYLES[opt.label] ??
              'bg-[#CDE2FA] text-[#003674] border-[#D1D1D6]'

            const activeClass = `${activeStyle} font-semibold`
            const inactiveClass =
              'bg-white text-gray-800 border-gray-200 hover:bg-gray-100 font-medium'

            return (
              <button
                key={opt.key}
                type='button'
                onClick={() => handleClick(opt)}
                className={[
                  baseClass,
                  isActive ? activeClass : inactiveClass,
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
