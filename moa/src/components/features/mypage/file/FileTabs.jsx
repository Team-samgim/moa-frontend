/**
 * FileTabs
 *
 * 내보낸 파일(GRID / PIVOT / CHART)의 타입을 전환하는 탭 컴포넌트.
 *
 * 기능:
 * - 키보드 네비게이션(좌/우 방향키)
 * - 탭 선택 시 부모(onChange)에 key 전달
 * - 현재 탭 아래에 인디케이터(underline) 애니메이션 표시
 *
 * Props:
 * - active: 현재 선택된 탭(GRID | PIVOT | CHART)
 * - onChange: 탭 변경 콜백(key => void)
 * - className: 외부 wrapper에 추가할 클래스
 *
 * AUTHOR: 방대혁
 */

import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { cx } from '@/utils/misc'

// 탭 목록 정의
const TABS = [
  { key: 'GRID', label: '검색 CSV', panelId: 'tabpanel-grid' },
  { key: 'PIVOT', label: '피벗 CSV', panelId: 'tabpanel-pivot' },
  { key: 'CHART', label: '차트 이미지', panelId: 'tabpanel-chart' },
]

const FileTabs = ({ active, onChange, className }) => {
  const activeIndex = TABS.findIndex((t) => t.key === active)

  /**
   * 인디케이터 위치/너비 상태
   * 탭 변경 시 active 탭의 offsetLeft/offsetWidth로 갱신
   */
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // 각 탭 DOM을 저장
  const tabRefs = useRef([])

  /**
   * activeIndex 변경 → 인디케이터 애니메이션 갱신
   */
  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex]
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      })
    }
  }, [activeIndex])

  /**
   * 방향키로 탭 이동
   */
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
        {/* 인디케이터(선택된 탭 하단 라인) */}
        <div
          className='absolute bottom-0 h-[3px] bg-linear-to-r from-[#5c6db9] to-[#4c5ca2] rounded-full transition-all duration-300 ease-out'
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {/* 탭 버튼 렌더링 */}
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
