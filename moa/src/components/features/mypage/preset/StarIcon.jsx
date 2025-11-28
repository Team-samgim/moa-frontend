/**
 * StarIcon
 *
 * 즐겨찾기(Star) 표시용 아이콘 컴포넌트.
 * 활성(active=true)일 경우 노란색(#FFD053)으로 표시되고,
 * 비활성(active=false)일 경우 회색(#CAC9C9)으로 표시된다.
 *
 * 사용처:
 * - 프리셋 목록에서 즐겨찾기 여부 표현
 * - 버튼 내부에서 상태 토글용 UI 아이콘
 *
 * Props:
 * - active: boolean — 즐겨찾기 여부 (기본값: false)
 *
 * AUTHOR: 방대혁
 */

import { memo } from 'react'
import Star from '@/assets/icons/star.svg?react'
import { cx } from '@/utils/misc'

const StarIcon = ({ active = false }) => (
  <Star
    className={cx(
      'w-4 h-4',
      active ? 'text-[#FFD053]' : 'text-[#CAC9C9]', // 활성: 노란색, 비활성: 회색
    )}
  />
)

export default memo(StarIcon)
