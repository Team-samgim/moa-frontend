import { useState, useEffect } from 'react'

// Layer → table/source 매핑 (백엔드 호출 시 사용)
const LAYER_OPTIONS = [
  {
    key: 'HTTP_PAGE',
    label: 'HTTP PAGE',
    table: 'http_page_sample',
    source: 'page_sample',
    disabled: false,
  },
  {
    key: 'HTTP_URI',
    label: 'HTTP URI',
    table: 'http_uri_sample',
    source: 'uri_sample',
    disabled: true,
  }, // 테이블 준비되면 disabled: false 로
  {
    key: 'TCP',
    label: 'TCP',
    table: 'tcp_sample',
    source: 'tcp_sample',
    disabled: true,
  }, // 테이블 준비되면 disabled: false 로
  {
    key: 'ETHERNET',
    label: 'Ethernet',
    table: 'ethernet',
    source: 'ethernet',
    disabled: false,
  },
]

/**
 * props
 * - active: 현재 선택된 계층 키(HTTP_PAGE | HTTP_URI | TCP | ETHERNET)
 * - onChange: (opt) => void  // opt = {key,label,table,source,disabled}
 */
const LayerBar = ({ active, onChange }) => {
  // uncontrolled fallback
  const [inner, setInner] = useState(active ?? 'HTTP_PAGE')
  const current = active ?? inner

  useEffect(() => {
    if (typeof active === 'undefined' || active === null) return
    setInner(active)
  }, [active])

  const handleClick = (opt) => {
    if (opt.disabled) return
    if (!onChange) setInner(opt.key)
    onChange?.(opt)
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
                disabled={opt.disabled}
                onClick={() => handleClick(opt)}
                className={[
                  'px-4 py-2 rounded-lg border text-sm transition-colors',
                  isActive
                    ? 'bg-[#3877BE] text-white border-[#3877BE]'
                    : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100',
                  opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
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
