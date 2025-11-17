import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/images/moa.webp'
import MsgRow from '@/components/common/MsgRow'
import IdField from '@/components/features/auth/IdField'
import PasswordConfirmField from '@/components/features/auth/PasswordConfirmField'
import PasswordField from '@/components/features/auth/PasswordField'
import { userNavigations } from '@/constants/navigations'
import { useLogin, useSignup } from '@/hooks/queries/useAuth'
import useIdField from '@/hooks/useIdField'
import usePasswordMatch from '@/hooks/usePasswordMatch'
import { isValidEmail } from '@/utils/validators'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const searchParams = new URLSearchParams(location.search)
  const modeFromQuery = searchParams.get('mode') // 'signup' | 'login' | null

  const [step, setStep] = useState(modeFromQuery === 'signup' ? 'signup' : 'login')

  useEffect(() => {
    if (modeFromQuery === 'signup') {
      setStep('signup')
    } else {
      setStep('login')
    }
  }, [modeFromQuery])

  const translate = useMemo(
    () => (step === 'login' ? 'translateX(0%)' : 'translateX(-50%)'),
    [step],
  )

  const [login, setLogin] = useState({ id: '', password: '' })
  const [loginError, setLoginError] = useState('')

  const loginMutation = useLogin({
    onSuccess: () => {
      setLoginError('')
      navigate(userNavigations.DASHBOARD)
    },
    onError: () => {
      setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.')
    },
  })

  const handleLogin = () => {
    if (!login.id || !login.password) {
      setLoginError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    loginMutation.mutate({
      loginId: login.id,
      password: login.password,
    })
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    handleLogin()
  }

  const id = useIdField() // { value, onChange, status, msg, runCheck }
  const pw = usePasswordMatch() // { password, setPassword, password2, setPassword2, lenOk, mixOk, mismatch }

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ id: '', email: '', name: '' })

  const onChangeEmail = (v) => {
    setEmail(v)
    if (v.trim().length > 0 && fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: '' }))
    }
  }

  const onChangeName = (v) => {
    setName(v)
    if (v.trim().length > 0 && fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }))
    }
  }

  const signupMutation = useSignup({
    onSuccess: () => {
      alert('회원가입이 완료되었습니다.')
      setStep('login')
    },
    onError: (error) => {
      console.error(error)
      alert('회원가입에 실패했습니다. 다시 시도해주세요.')
    },
  })

  const handleJoinSubmit = (e) => {
    e.preventDefault()

    let hasError = false
    const next = { id: '', email: '', name: '' }

    if (id.status !== 'valid') {
      next.id = '아이디 중복확인을 완료해주세요.'
      hasError = true
    }

    if (!email.trim() || !isValidEmail(email)) {
      next.email = '올바른 이메일 형식이 아닙니다.'
      hasError = true
    }

    if (!name.trim()) {
      next.name = '이름을 입력해주세요.'
      hasError = true
    }

    if (!pw.password || !pw.password2 || pw.mismatch) {
      hasError = true
    }

    setFieldErrors(next)
    if (hasError) return

    const payload = {
      loginId: id.value,
      email,
      password: pw.password,
      nickname: name,
    }

    signupMutation.mutate(payload)
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='relative w-full max-w-5xl bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.08)] overflow-hidden'>
        {/* 슬라이드 영역 */}
        <div
          className='w-[200%] flex transition-transform duration-500 ease-out'
          style={{ transform: translate }}
        >
          {/* ------------------ 로그인 섹션 ------------------ */}
          <section className='w-1/2 flex'>
            {/* 왼쪽: 로그인 폼 */}
            <div className='w-1/2 p-10 md:p-16 flex flex-col justify-center'>
              <div className='mx-auto w-full max-w-md'>
                <div className='flex justify-center'>
                  <img src={logo} alt='moa logo' className='h-24 md:h-28 object-contain' />
                </div>

                <form onSubmit={handleLoginSubmit} className='mt-10 space-y-8'>
                  <div>
                    <label className='block text-sm text-gray-700 mb-2'>아이디</label>
                    <input
                      value={login.id}
                      onChange={(e) => setLogin((s) => ({ ...s, id: e.target.value }))}
                      className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                    />
                  </div>

                  <div className='relative'>
                    <label className='block text-sm text-gray-700 mb-2'>비밀번호</label>
                    <input
                      type='password'
                      value={login.password}
                      onChange={(e) => setLogin((s) => ({ ...s, password: e.target.value }))}
                      className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2 pr-8'
                    />
                  </div>

                  {loginError && <MsgRow type='error'>{loginError}</MsgRow>}

                  <button
                    type='submit'
                    className='w-full mt-2 rounded-md bg-[var(--color-blue)] text-white py-3 text-[15px] shadow-md hover:opacity-95 active:scale-[0.99]'
                    disabled={loginMutation.isLoading}
                  >
                    {loginMutation.isLoading ? '로그인 중...' : '로그인'}
                  </button>

                  <div className='flex justify-end gap-4 text-xs text-gray-500'>
                    <button type='button'>아이디 찾기</button>
                    <span aria-hidden={true}>|</span>
                    <button type='button'>비밀번호 찾기</button>
                  </div>
                </form>
              </div>
            </div>

            {/* 오른쪽: 회원가입 CTA */}
            <div className='w-1/2 relative'>
              <div className='absolute inset-0 bg-[var(--color-blue)] rounded-bl-[200px] z-0' />
              <div className='relative z-10 h-full flex flex-col items-center justify-center text-center px-6 text-white'>
                <h3 className='text-2xl font-semibold'>아직 회원이 아니신가요?</h3>
                <p className='mt-3 opacity-90 leading-relaxed max-w-sm'>
                  Lorem ipsum dolor sit amet consectetur.
                </p>
                <button
                  type='button'
                  onClick={() => setStep('signup')}
                  className='mt-8 rounded-md border border-white/90 text-white px-6 py-2 hover:bg-white/10'
                >
                  회원가입
                </button>
              </div>
            </div>
          </section>

          {/* ------------------ 회원가입 섹션 ------------------ */}
          <section className='w-1/2 flex'>
            {/* 왼쪽: 로그인으로 돌아가기 CTA */}
            <div className='w-1/2 relative'>
              <div className='absolute inset-0 bg-[var(--color-blue)] rounded-br-[200px] z-0' />
              <div className='relative z-10 h-full flex flex-col items-center justify-center text-center px-6 text-white'>
                <h3 className='text-2xl font-semibold'>이미 회원이신가요?</h3>
                <p className='mt-3 opacity-90 leading-relaxed max-w-sm'>
                  Lorem ipsum dolor sit amet consectetur.
                </p>
                <button
                  type='button'
                  onClick={() => setStep('login')}
                  className='mt-8 rounded-md bg-white text-[var(--color-blue)] px-6 py-2 hover:opacity-95'
                >
                  로그인
                </button>
              </div>
            </div>

            {/* 오른쪽: 회원가입 폼 */}
            <div className='w-1/2 p-10 md:p-16 flex flex-col justify-center'>
              <form className='mx-auto w-full max-w-md space-y-7' onSubmit={handleJoinSubmit}>
                {/* 아이디 */}
                <IdField
                  label='아이디'
                  value={id.value}
                  onChange={id.onChange}
                  onClickCheck={id.runCheck}
                  status={id.status}
                  inlineMsg={id.msg}
                  fieldError={fieldErrors.id}
                  successText='사용할 수 있는 아이디입니다.'
                />

                {/* 비밀번호 */}
                <PasswordField value={pw.password} onChange={pw.setPassword} />

                {/* 비밀번호 확인 */}
                <PasswordConfirmField
                  value={pw.password2}
                  onChange={pw.setPassword2}
                  original={pw.password}
                />

                {/* 이메일 */}
                <div>
                  <label className='block text-sm text-gray-700 mb-2'>이메일</label>
                  <input
                    value={email}
                    onChange={(e) => onChangeEmail(e.target.value)}
                    className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                  />
                  {fieldErrors.email && <MsgRow type='error'>{fieldErrors.email}</MsgRow>}
                </div>

                {/* 이름 */}
                <div>
                  <label className='block text-sm text-gray-700 mb-2'>이름</label>
                  <input
                    value={name}
                    onChange={(e) => onChangeName(e.target.value)}
                    className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                  />
                  {fieldErrors.name && <MsgRow type='error'>{fieldErrors.name}</MsgRow>}
                </div>

                <button
                  type='submit'
                  className='w-full mt-2 rounded-md bg-[var(--color-blue)] text-white py-3 text-[15px] shadow-md hover:opacity-95 active:scale-[0.99]'
                  disabled={signupMutation.isLoading}
                >
                  {signupMutation.isLoading ? '가입 중...' : '회원가입'}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className='pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5' />
      </div>
    </div>
  )
}

export default LoginPage
