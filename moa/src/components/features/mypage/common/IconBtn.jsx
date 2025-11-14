import { memo } from 'react'

const IconBtn = ({ src, label, onClick, disabled }) => (
  <button
    className='inline-flex h-10 w-5 items-center justify-center bg-white cursor-pointer disabled:opacity-40'
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
  >
    <img src={src} alt='' className='h-8 w-8' />
    <span className='sr-only'>{label}</span>
  </button>
)

export default memo(IconBtn)
