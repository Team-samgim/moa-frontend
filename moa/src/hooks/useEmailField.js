// 작성자: 최이서
import { useState } from 'react'
import { useCheckEmailDuplicate } from '@/hooks/queries/useAuth'
import { isValidEmail } from '@/utils/validators'

function useEmailField() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('idle')
  const [msg, setMsg] = useState('')

  const { mutate: _checkEmail } = useCheckEmailDuplicate({
    onSuccess: (data) => {
      if (data?.success) {
        setStatus('valid')
        setMsg('')
      } else {
        setStatus('invalid')
        setMsg(data?.message || '이미 사용 중인 이메일입니다.')
      }
    },
    onError: () => {
      setStatus('invalid')
      setMsg('이메일 중복확인 중 오류가 발생했습니다.')
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
      setMsg('이메일을 입력해주세요.')
      return
    }
    if (!isValidEmail(value)) {
      setStatus('invalid')
      setMsg('올바른 이메일 형식이 아닙니다.')
      return
    }
    setStatus('checking')
    setMsg('')

    // TODO: 임시코드 추후 삭제
    setStatus('valid')
    setMsg('사용할 수 있는 이메일입니다.')
    // 임시코드 --------------------------------

    // TODO: 이메일 중복 확인 api 연결
    // checkEmail(value)
  }

  return { value, onChange, status, msg, runCheck }
}

export default useEmailField
