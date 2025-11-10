import { memo, useMemo } from 'react'
import { TOKENS } from '@/constants/tokens'

const Tabs = ({ value, onChange }) => {
  const tabs = useMemo(
    () => [
      { key: 'GRID', label: '검색 CSV' },
      { key: 'PIVOT', label: '피벗 CSV' },
      { key: 'CHART', label: '차트 이미지' },
    ],
    [],
  )
  return (
    <div className='mb-4' role='tablist' aria-label='내보내기 종류'>
      <nav className='flex gap-6'>
        {tabs.map((t) => {
          const active = value === t.key
          return (
            <button
              key={t.key}
              role='tab'
              aria-selected={active}
              onClick={() => onChange(t.key)}
              className={[
                'px-0 pb-2 -mb-[1px] text-sm transition-colors border-b-2',
                active ? 'font-semibold text-gray-900' : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
              style={active ? { borderColor: TOKENS.BRAND } : { borderColor: 'transparent' }}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default memo(Tabs)
