import CheckIcon from '@/assets/icons/check-msg.svg?react'
import ErrorIcon from '@/assets/icons/error-msg.svg?react'

const MsgRow = ({ type = 'error', children }) => {
  const isError = type === 'error'
  const color = isError ? '#FF5B35' : '#079500'
  const Icon = isError ? ErrorIcon : CheckIcon
  return (
    <div className='flex items-center gap-1.5 text-[13px] mt-2' style={{ color }}>
      <Icon className='w-3.5 h-3.5' />
      <span>{children}</span>
    </div>
  )
}

export default MsgRow
