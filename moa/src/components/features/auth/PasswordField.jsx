// 작성자: 최이서
// 비밀번호 입력 및 유효성 검사를 표시하는 필드 컴포넌트

import { useState } from 'react'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import EyeIcon from '@/assets/icons/eye.svg?react'
import { isValidPwLength, hasLetterAndNumber } from '@/utils/validators'

const PasswordField = ({ value, onChange }) => {
  const [show, setShow] = useState(false)
  const lenOk = isValidPwLength(value)
  const mixOk = hasLetterAndNumber(value)

  return (
    <div>
      <label className='block text-sm text-gray-700 mb-2'>비밀번호</label>
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

      <div className='flex gap-4 mt-2 text-[13px]'>
        <div className='flex items-center gap-1.5' style={{ color: lenOk ? '#079500' : '#ccc' }}>
          <CheckIcon className='w-3.5 h-3.5' />
          <span>8-20자 이내</span>
        </div>
        <div className='flex items-center gap-1.5' style={{ color: mixOk ? '#079500' : '#ccc' }}>
          <CheckIcon className='w-3.5 h-3.5' />
          <span>영문자, 숫자 포함</span>
        </div>
      </div>
    </div>
  )
}

export default PasswordField
