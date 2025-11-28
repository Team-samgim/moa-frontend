// 작성자: 최이서
import { useState } from 'react'
import { isValidPwLength, hasLetterAndNumber } from '@/utils/validators'

function usePasswordMatch() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  const lenOk = isValidPwLength(password)
  const mixOk = hasLetterAndNumber(password)
  const mismatch = password2 && password2 !== password

  return {
    password,
    setPassword,
    password2,
    setPassword2,
    lenOk,
    mixOk,
    mismatch,
  }
}

export default usePasswordMatch
