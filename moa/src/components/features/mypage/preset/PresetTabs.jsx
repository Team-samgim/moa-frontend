import { memo, useCallback } from 'react'
import { cx } from '@/utils/misc'

const TABS = [
  { key: 'SEARCH', label: '검색 프리셋', panelId: 'tabpanel-search' },
  { key: 'PIVOT', label: '피벗 프리셋', panelId: 'tabpanel-pivot' },
]

const PresetTabs = ({ active, onChange, className }) => {
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
      className={cx('mb-4', className)}
      role='tablist'
      aria-label='프리셋 종류'
      onKeyDown={handleKeyDown}
    >
      <nav className='flex gap-6'>
        {TABS.map((t) => {
          const isActive = active === t.key
          return (
            <button
              key={t.key}
              type='button'
              role='tab'
              aria-selected={isActive}
              aria-controls={t.panelId}
              onClick={() => onChange(t.key)}
              className={cx(
                'px-0 pb-2 -mb-[1px] text-sm transition-colors border-b-2',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3877BE]',
                isActive
                  ? 'font-semibold text-gray-900 border-[#3877BE]'
                  : 'text-gray-400 hover:text-gray-600 border-transparent',
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default memo(PresetTabs)
