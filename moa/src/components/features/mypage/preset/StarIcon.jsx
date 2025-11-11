import { memo } from 'react'
import Star from '@/assets/icons/star.svg?react'
import { cx } from '@/utils/misc'

const StarIcon = ({ active = false }) => (
  <Star className={cx('w-4 h-4', active ? 'text-[#FFD053]' : 'text-[#CAC9C9]')} />
)

export default memo(StarIcon)
