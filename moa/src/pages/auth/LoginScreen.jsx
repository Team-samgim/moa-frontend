import { useNavigate } from 'react-router-dom'
import catImage from '@/assets/images/cat.jpg'
import { loggedOutNavigations } from '@/constants/navigations'

function LoginScreen() {
  const navigate = useNavigate()

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-sky-300'>
      <div className='bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center'>
        <img
          src={catImage}
          alt='고양이'
          className='w-32 h-32 mx-auto rounded-full object-cover mb-6 ring-4 ring-sky-300'
        />

        <h1 className='text-2xl font-bold text-gray-800 mb-2'>Welcome Back 🐾</h1>
        <p className='text-gray-500 mb-6'>로그인을 통해 냥이 세상으로 들어오세요.</p>

        <form className='flex flex-col gap-3'>
          <input
            type='email'
            placeholder='이메일'
            className='border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none'
            required={true}
          />
          <input
            type='password'
            placeholder='비밀번호'
            className='border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-400 outline-none'
            required={true}
          />
          <button
            type='submit'
            className='bg-sky-400 text-white py-2 rounded-lg hover:bg-sky-500 transition-all'
          >
            로그인
          </button>
          <button
            type='button'
            onClick={() => navigate(loggedOutNavigations.SIGNUP)}
            className='bg-sky-400 text-white py-2 rounded-lg hover:bg-sky-500 transition-all'
          >
            회원가입
          </button>
        </form>
      </div>
      <p className='mt-8 text-sm text-gray-600'>🐱 Tailwind 적용 테스트 중입니다.</p>
    </div>
  )
}

export default LoginScreen
