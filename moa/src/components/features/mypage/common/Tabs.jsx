/**
 * Tabs
 *
 * 내보내기 유형을 선택하는 탭 컴포넌트.
 * 현재 선택된 key(value)에 따라 활성 탭 UI를 표시하고 onChange 이벤트로 상위에 선택값을 전달한다.
 *
 * 구조:
 * - GRID: 검색 CSV
 * - PIVOT: 피벗 CSV
 * - CHART: 차트 이미지
 *
 * Props:
 * - value: 현재 선택된 탭 key ('GRID' | 'PIVOT' | 'CHART')
 * - onChange(newKey): 탭 변경 시 호출되는 콜백
 *
 * 특징:
 * - role="tablist" + role="tab"을 사용한 접근성 준수
 * - 활성 탭은 BRAND 컬러(border-bottom)로 표시
 * - useMemo로 탭 정의 메모이제이션
 * - memo로 렌더링 최적화
 *
 * AUTHOR: 방대혁
 */
import { memo, useMemo } from 'react'
import { TOKENS } from '@/constants/tokens'

const Tabs = ({ value, onChange }) => {
  // 탭 정의 메모이제이션
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
              // 활성 탭은 BRAND 컬러 보더
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
