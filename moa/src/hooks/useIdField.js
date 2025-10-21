import { useState } from 'react'
import { useCheckIdDuplicate } from '@/hooks/queries/useAuth'
import { isValidId } from '@/utils/validators'

function useIdField() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('idle') // idle | checking | valid | invalid
  const [msg, setMsg] = useState('')

  const { mutate: checkId } = useCheckIdDuplicate({
    onSuccess: (data) => {
      if (!data?.exists) {
        setStatus('valid')
        setMsg('')
      } else {
        setStatus('invalid')
        setMsg(data?.message || '이미 사용 중인 아이디입니다.')
      }
    },
    onError: () => {
      setStatus('invalid')
      setMsg('아이디 중복확인 중 오류가 발생했습니다.')
    },
  })

  const onChange = (v) => {
    setValue(v)
    setStatus('idle')
    setMsg('')
  }

  const runCheck = () => {
    if (!value) {
      setStatus('invalid')
      setMsg('아이디를 입력해주세요.')
      return
    }
    if (!isValidId(value)) {
      setStatus('invalid')
      setMsg('아이디는 5~20자 영문 소문자/숫자만 가능합니다.')
      return
    }
    setStatus('checking')
    setMsg('')
    checkId(value)
  }

  return { value, onChange, status, msg, runCheck }
}

export default useIdField
