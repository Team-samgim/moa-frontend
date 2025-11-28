/**
 * IconBtn
 *
 * 아이콘 이미지를 표시하는 단순 버튼 컴포넌트.
 * 접근성 확보를 위해 aria-label과 sr-only 텍스트를 포함하며,
 * memo를 사용해 불필요한 리렌더링을 방지한다.
 *
 * Props:
 * - src: 아이콘 이미지 경로
 * - label: 버튼 설명(aria-label 및 title용)
 * - onClick: 버튼 클릭 핸들러
 * - disabled: 버튼 비활성화 여부
 *
 * 특징:
 * - 시각적으로는 아이콘만 표시되고 텍스트는 화면에서는 숨김 처리(sr-only)
 * - disabled 시 opacity 감소
 * - inline-flex 기반 아이콘 정렬
 * - memo() 적용으로 렌더 최적화
 *
 * AUTHOR: 방대혁
 */
import { memo } from 'react'

const IconBtn = ({ src, label, onClick, disabled }) => (
  <button
    /* 버튼 스타일 및 접근성 설정 */
    className='inline-flex h-10 w-5 items-center justify-center bg-white cursor-pointer disabled:opacity-40'
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
  >
    {/* 시각적 아이콘 이미지 */}
    <img src={src} alt='' className='h-8 w-8' />

    {/* 스크린 리더용 텍스트 */}
    <span className='sr-only'>{label}</span>
  </button>
)

export default memo(IconBtn)
