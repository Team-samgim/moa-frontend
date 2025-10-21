import { useState } from 'react'
import EyeIcon from '@/assets/icons/eye.svg?react'
import MsgRow from '@/components/common/MsgRow'

const PasswordConfirmField = ({ value, onChange, original }) => {
  const [show, setShow] = useState(false)
  const mismatch = value && value !== original

  return (
    <div>
      <label className='block text-sm text-gray-700 mb-2'>비밀번호 확인</label>
      <div className='relative'>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2 pr-8'
        />
        <button
          type='button'
          aria-label='비밀번호 표시'
          className='absolute right-0 bottom-2 p-1'
          onClick={() => setShow((v) => !v)}
        >
          <EyeIcon className='w-4 h-4 text-gray-400' />
        </button>
      </div>

      {mismatch && <MsgRow type='error'>비밀번호가 일치하지 않습니다.</MsgRow>}
    </div>
  )
}

export default PasswordConfirmField
