import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { cx } from '@/utils/misc'

const TABS = [
  { key: 'GRID', label: '검색 CSV', panelId: 'tabpanel-grid' },
  { key: 'PIVOT', label: '피벗 CSV', panelId: 'tabpanel-pivot' },
  { key: 'CHART', label: '차트 이미지', panelId: 'tabpanel-chart' },
]

const FileTabs = ({ active, onChange, className }) => {
  const activeIndex = TABS.findIndex((t) => t.key === active)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const tabRefs = useRef([])

  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex]
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      })
    }
  }, [activeIndex])

  const handleKeyDown = useCallback(
    (e) => {
      const i = TABS.findIndex((t) => t.key === active)
      if (i === -1) return
      if (e.key === 'ArrowRight') onChange(TABS[(i + 1) % TABS.length].key)
      if (e.key === 'ArrowLeft') onChange(TABS[(i - 1 + TABS.length) % TABS.length].key)
    },
    [active, onChange],
  )

  return (
    <div
      className={cx('mb-8', className)}
      role='tablist'
      aria-label='파일 종류'
      onKeyDown={handleKeyDown}
    >
      <nav className='relative flex gap-8 border-b border-gray-200'>
        {/* 애니메이션 인디케이터 */}
        <div
          className='absolute bottom-0 h-[3px] bg-linear-to-r from-[#5c6db9] to-[#4c5ca2] rounded-full transition-all duration-300 ease-out'
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {TABS.map((t, idx) => {
          const isActive = active === t.key
          return (
            <button
              key={t.key}
              ref={(el) => (tabRefs.current[idx] = el)}
              type='button'
              role='tab'
              aria-selected={isActive}
              aria-controls={t.panelId}
              onClick={() => onChange(t.key)}
              className={cx(
                'relative px-4 pb-4 text-[15px] font-medium transition-all duration-300',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:blue',
                isActive
                  ? 'text-[#5765a0] scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:scale-102',
              )}
            >
              <span className='relative z-10'>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default memo(FileTabs)
