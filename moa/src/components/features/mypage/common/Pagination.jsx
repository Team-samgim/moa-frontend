/**
 * Pagination
 *
 * 페이지 번호 리스트 + 이전/다음 + 처음/마지막 이동 버튼으로 구성된 페이지네이션 컴포넌트.
 *
 * 동작:
 * - page: 현재 페이지 인덱스(0 기반)
 * - totalPages: 전체 페이지 수
 * - onChange: 페이지 변경 핸들러
 *
 * 기능:
 * 1) 처음/이전/다음/마지막 이동 버튼 제공 (IconBtn 사용)
 * 2) 페이지 번호 직접 이동 (0-based → 사용자에게는 1부터 표시)
 * 3) 현재 페이지는 aria-current="page" 및 강조 스타일 적용
 * 4) totalPages가 1 이하이면 null 반환(표시 안 함)
 *
 * Props:
 * - page: number (현재 페이지)
 * - totalPages: number (전체 페이지 수)
 * - onChange(newPage): 페이지 이동 콜백
 *
 * 최적화:
 * - useMemo로 pages 배열 생성
 * - memo로 리렌더 최소화
 *
 * AUTHOR: 방대혁
 */
import { memo, useMemo } from 'react'
import doubleLeft from '@/assets/icons/double-left.svg'
import doubleRight from '@/assets/icons/double-right.svg'
import leftIcon from '@/assets/icons/left.svg'
import rightIcon from '@/assets/icons/right.svg'
import IconBtn from '@/components/features/mypage/common/IconBtn'
import { cx } from '@/utils/misc'

const Pagination = ({ page, totalPages, onChange }) => {
  // 전체 페이지 목록(0 기반 인덱스 배열)
  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i), [totalPages])

  // 1페이지 이하이면 렌더링하지 않음
  if (!totalPages || totalPages <= 1) return null

  return (
    <div className='mt-4 flex items-center justify-center gap-1.5'>
      {/* 처음 페이지 이동 */}
      <IconBtn
        src={doubleLeft}
        label='첫 페이지'
        onClick={() => onChange(0)}
        disabled={page === 0}
      />

      {/* 이전 페이지 이동 */}
      <IconBtn
        src={leftIcon}
        label='이전 페이지'
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page === 0}
      />

      {/* 페이지 번호 목록 */}
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

      {/* 다음 페이지 이동 */}
      <IconBtn
        src={rightIcon}
        label='다음 페이지'
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
      />

      {/* 마지막 페이지 이동 */}
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
