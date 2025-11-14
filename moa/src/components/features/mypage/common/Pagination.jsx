import { memo, useMemo } from 'react'
import doubleLeft from '@/assets/icons/double-left.svg'
import doubleRight from '@/assets/icons/double-right.svg'
import leftIcon from '@/assets/icons/left.svg'
import rightIcon from '@/assets/icons/right.svg'
import IconBtn from '@/components/features/mypage/common/IconBtn'
import { cx } from '@/utils/misc'

const Pagination = ({ page, totalPages, onChange }) => {
  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i), [totalPages])
  if (!totalPages || totalPages <= 1) return null

  return (
    <div className='mt-4 flex items-center justify-center gap-1.5'>
      <IconBtn
        src={doubleLeft}
        label='첫 페이지'
        onClick={() => onChange(0)}
        disabled={page === 0}
      />
      <IconBtn
        src={leftIcon}
        label='이전 페이지'
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
      />
      {pages.map((p) => {
        const isActive = p === page
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`${p + 1} 페이지`}
            title={`${p + 1} 페이지`}
            className={cx(
              'inline-flex h-8 w-8 items-center justify-center rounded border text-sm border-[#cccccc]',
              isActive ? 'bg-[#EEF5FE] text-[#6B6B6B]' : 'bg-transparent text-[#888888]',
            )}
          >
            {p + 1}
          </button>
        )
      })}
      <IconBtn
        src={rightIcon}
        label='다음 페이지'
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
      />
      <IconBtn
        src={doubleRight}
        label='마지막 페이지'
        onClick={() => onChange(totalPages - 1)}
        disabled={page >= totalPages - 1}
      />
    </div>
  )
}

export default memo(Pagination)
