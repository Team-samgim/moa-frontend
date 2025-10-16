import { useMemo, useState } from 'react'
import ErrorIcon from '@/assets/icons/error-msg.svg?react'
import logo from '@/assets/images/moa.webp'

function LoginScreen() {
  const [step, setStep] = useState('login')
  const translate = useMemo(
    () => (step === 'login' ? 'translateX(0%)' : 'translateX(-50%)'),
    [step],
  )
  const [login, setLogin] = useState({ id: '', password: '' })
  const [error, setError] = useState('')
  const [join, setJoin] = useState({
    id: '',
    email: '',
    password: '',
    password2: '',
    name: '',
  })

  const handleLogin = () => {
    if (!login.id || !login.password) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }
    // TODO: 로그인 로직 추가
    setError('')
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <div className='relative w-full max-w-5xl bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.08)] overflow-hidden'>
        <div
          className='w-[200%] flex transition-transform duration-500 ease-out'
          style={{ transform: translate }}
        >
          <section className='w-1/2 flex'>
            <div className='w-1/2 p-10 md:p-16 flex flex-col justify-center'>
              <div className='mx-auto w-full max-w-md'>
                <div className='flex justify-center'>
                  <img src={logo} alt='moa logo' className='h-24 md:h-28 object-contain' />
                </div>

                <div className='mt-10 space-y-8'>
                  <div>
                    <label className='block text-sm text-gray-700 mb-2'>아이디</label>
                    <input
                      value={login.id}
                      onChange={(e) => setLogin((s) => ({ ...s, id: e.target.value }))}
                      className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                    />
                  </div>

                  <div>
                    <label className='block text-sm text-gray-700 mb-2'>비밀번호</label>
                    <input
                      type='password'
                      value={login.password}
                      onChange={(e) => setLogin((s) => ({ ...s, password: e.target.value }))}
                      className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                    />
                  </div>

                  {error && (
                    <div className='flex items-center gap-2 text-[#FF5B35] text-sm mt-[-4px]'>
                      <ErrorIcon className='w-4 h-4 text-[#FF5B35]' />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type='button'
                    onClick={handleLogin}
                    className='w-full mt-2 rounded-md bg-[var(--color-blue)] text-white py-3 text-[15px] shadow-md hover:opacity-95 active:scale-[0.99]'
                  >
                    로그인
                  </button>

                  <div className='flex justify-end gap-4 text-xs text-gray-500'>
                    <button type='button'>아이디 찾기</button>
                    <span aria-hidden={true}>|</span>
                    <button type='button'>비밀번호 찾기</button>
                  </div>
                </div>
              </div>
            </div>

            <div className='w-1/2 relative'>
              <div className='absolute inset-0 bg-[var(--color-blue)] rounded-bl-[200px] lg:rounded-bl-[200px] 2xl:rounded-bl-[200px] z-0' />
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

          <section className='w-1/2 flex'>
            <div className='w-1/2 relative'>
              <div className='absolute inset-0 bg-[var(--color-blue)] rounded-br-[200px] lg:rounded-br-[200px] 2xl:rounded-br-[200px] z-0' />
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

            <div className='w-1/2 p-10 md:p-16 flex flex-col justify-center'>
              <form
                className='mx-auto w-full max-w-md space-y-7'
                onSubmit={(e) => e.preventDefault()}
              >
                <div>
                  <label className='block text-sm text-gray-700 mb-2'>아이디</label>
                  <div className='flex items-center gap-3'>
                    <input
                      value={join.id}
                      onChange={(e) => setJoin((s) => ({ ...s, id: e.target.value }))}
                      className='flex-1 border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                    />
                    <button
                      type='button'
                      className='shrink-0 rounded-md border border-[var(--color-blue)] text-[var(--color-blue)] px-3 py-1.5 text-sm hover:bg-[var(--color-blue)]/5'
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>비밀번호</label>
                  <input
                    type='password'
                    value={join.password}
                    onChange={(e) => setJoin((s) => ({ ...s, password: e.target.value }))}
                    className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                  />
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>비밀번호 확인</label>
                  <input
                    type='password'
                    value={join.password2}
                    onChange={(e) => setJoin((s) => ({ ...s, password2: e.target.value }))}
                    className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                  />
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>이메일</label>
                  <div className='flex items-center gap-3'>
                    <input
                      value={join.email}
                      onChange={(e) => setJoin((s) => ({ ...s, email: e.target.value }))}
                      className='flex-1 border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                    />
                    <button
                      type='button'
                      className='shrink-0 rounded-md border border-[var(--color-blue)] text-[var(--color-blue)] px-3 py-1.5 text-sm hover:bg-[var(--color-blue)]/5'
                    >
                      중복확인
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm text-gray-700 mb-2'>이름</label>
                  <input
                    value={join.name}
                    onChange={(e) => setJoin((s) => ({ ...s, name: e.target.value }))}
                    className='w-full border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
                  />
                </div>

                <button
                  type='submit'
                  className='w-full mt-2 rounded-md bg-[var(--color-blue)] text-white py-3 text-[15px] shadow-md hover:opacity-95 active:scale-[0.99]'
                >
                  회원가입
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

export default LoginScreen
