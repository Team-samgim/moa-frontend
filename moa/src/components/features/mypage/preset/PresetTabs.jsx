/**
 * PresetTabs
 *
 * 프리셋 페이지 상단에서 "검색 프리셋 / 피벗 프리셋" 탭을 전환하는 역할을 하는 컴포넌트.
 * 탭 클릭, 키보드 화살표 이동(← →) 기능을 제공하고,
 * 현재 활성 탭 위치를 기반으로 하단 인디케이터(UI Bar)가 애니메이션되며 이동한다.
 *
 * Props:
 * - active: 현재 활성 탭 key ('SEARCH' | 'PIVOT')
 * - onChange: 탭 변경 시 호출되는 함수 → (key: string) => void
 * - className: 부모에서 전달하는 추가 스타일 클래스
 *
 * AUTHOR: 방대혁
 */

import { memo, useCallback, useRef, useEffect, useState } from 'react'
import { cx } from '@/utils/misc'

/**
 * TABS 정의:
 * key: 고유 식별자
 * label: UI에 보일 텍스트
 * panelId: aria-controls 로 연결되는 패널 id
 */
const TABS = [
  { key: 'SEARCH', label: '검색 프리셋', panelId: 'tabpanel-search' },
  { key: 'PIVOT', label: '피벗 프리셋', panelId: 'tabpanel-pivot' },
]

const PresetTabs = ({ active, onChange, className }) => {
  // 현재 활성 탭의 인덱스
  const activeIndex = TABS.findIndex((t) => t.key === active)

  /**
   * indicatorStyle:
   *   left: 활성 탭의 offsetLeft
   *   width: 활성 탭의 width
   *
   * 이 값을 통해 하단 인디케이터(UI bar)의 위치와 크기를 갱신한다.
   */
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  /**
   * 각 탭 button DOM 요소를 저장하기 위한 ref
   * 탭 위치 계산에 필요하다.
   */
  const tabRefs = useRef([])

  /**
   * activeIndex 변경 시 인디케이터를 이동
   * offsetLeft / offsetWidth 를 읽어서 스타일 업데이트
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
   * 키보드 네비게이션
   * ArrowRight → 다음 탭
   * ArrowLeft  → 이전 탭
   */
  const handleKeyDown = useCallback(
    (e) => {
      const i = TABS.findIndex((t) => t.key === active)
      if (i === -1) return

      if (e.key === 'ArrowRight') {
        onChange(TABS[(i + 1) % TABS.length].key)
      }

      if (e.key === 'ArrowLeft') {
        onChange(TABS[(i - 1 + TABS.length) % TABS.length].key)
      }
    },
    [active, onChange],
  )

  return (
    <div
      className={cx('mb-8', className)}
      role='tablist'
      aria-label='프리셋 종류'
      onKeyDown={handleKeyDown}
    >
      <nav className='relative flex gap-8 border-b border-gray-200'>
        {/* 인디케이터 (활성 탭 아래에서 애니메이션 이동) */}
        <div
          className='absolute bottom-0 h-[3px] bg-linear-to-r from-[#5c6db9] to-[#4c5ca2] rounded-full transition-all duration-300 ease-out'
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
          }}
        />

        {/* 각 탭 버튼 렌더링 */}
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

export default memo(PresetTabs)
