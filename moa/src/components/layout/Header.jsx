import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import logo from '@/assets/images/moa.webp'
import { loggedOutNavigations, userNavigations } from '@/constants/navigations'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { label: '대시보드', to: userNavigations.DASHBOARD },
  { label: '검색', to: userNavigations.SEARCH },
  { label: '피벗 테이블', to: userNavigations.PIVOT },
  { label: '프리셋', to: userNavigations.PRESET },
  { label: '파일 관리', to: userNavigations.FILE_MANAGEMENT },
]

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isLogin = useAuthStore((s) => s.isLogin)
  const clearTokens = useAuthStore((s) => s.clearTokens)

  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  const handleProtectedNavClick = (to) => {
    if (isLogin) {
      navigate(to)
    } else {
      navigate(loggedOutNavigations.LOGIN)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 20) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header
      className='
        w-full flex justify-center items-end bg-transparent 
        h-[70px] sm:h-[75px] md:h-[80px] lg:h-[85px] xl:h-[88px] 2xl:h-[92px] 3xl:h-[100px] 4xl:h-[115px]
        fixed top-0 left-0 right-0 z-50
        pr-[calc(0.75rem+var(--scrollbar-comp,0px))]
        sm:pr-[calc(1rem+var(--scrollbar-comp,0px))]
        md:pr-[calc(1.5rem+var(--scrollbar-comp,0px))]
        lg:pr-[calc(2rem+var(--scrollbar-comp,0px))]
      '
    >
      <div
        className={`
          flex w-full items-center justify-between 
          gap-1.5 sm:gap-2 md:gap-3 lg:gap-4
          rounded-full bg-white
          mx-2 sm:mx-4 md:mx-8 lg:mx-12 xl:mx-20 2xl:mx-24 3xl:mx-26 4xl:mx-30
          px-3 sm:px-4 md:px-5 lg:px-6 xl:px-7 2xl:px-8 3xl:px-9 4xl:px-10
          h-[50px] sm:h-[56px] md:h-[62px] lg:h-[68px] xl:h-[72px] 2xl:h-[75px] 3xl:h-[78px] 4xl:h-[82px]
          shadow-[0_6px_8px_rgba(0,103,255,0.06),0_8px_10px_rgba(0,103,255,0.1)]
          transition-transform duration-600 ease-out
          ${isScrolled ? '-translate-y-18 sm:-translate-y-20 md:-translate-y-21 lg:-translate-y-22 xl:-translate-y-23 2xl:-translate-y-24 3xl:-translate-y-26 4xl:-translate-y-28' : 'translate-y-0'}
        `}
      >
        <div className='flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 shrink-0'>
          <Link to='/' className='flex flex-col leading-none select-none'>
            <div className='flex justify-center'>
              <img
                src={logo}
                alt='moa logo'
                className='h-8 sm:h-9 md:h-10 lg:h-11 xl:h-12 2xl:h-13 3xl:h-14 4xl:h-15 object-contain'
              />
            </div>
          </Link>
        </div>

        <nav className='hidden lg:flex items-center gap-3 xl:gap-4 2xl:gap-6 3xl:gap-8 4xl:gap-10 text-[13px] lg:text-[13.5px] xl:text-[14px] 2xl:text-[15px] 3xl:text-[16px] 4xl:text-[18px] font-medium flex-shrink-0'>
          {navItems.map((item) => {
            const active = location.pathname === item.to
            return (
              <button
                key={item.label}
                type='button'
                onClick={() => handleProtectedNavClick(item.to)}
                className={[
                  'transition-colors whitespace-nowrap',
                  active
                    ? 'text-[var(--color-blue,#1c4fd7)] font-semibold'
                    : 'text-gray-700 hover:text-gray-900',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* 태블릿용 간소화된 네비게이션 */}
        <nav className='hidden md:flex lg:hidden items-center gap-2 md:gap-2.5 text-[12px] md:text-[12.5px] font-medium flex-shrink-0'>
          {navItems.slice(0, 3).map((item) => {
            const active = location.pathname === item.to
            return (
              <button
                key={item.label}
                type='button'
                onClick={() => handleProtectedNavClick(item.to)}
                className={[
                  'transition-colors whitespace-nowrap',
                  active
                    ? 'text-[var(--color-blue,#1c4fd7)] font-semibold'
                    : 'text-gray-700 hover:text-gray-900',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className='flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 xl:gap-3 flex-shrink-0'>
          {isLogin ? (
            <>
              <button
                type='button'
                className='
                  text-white 
                  text-[11px] sm:text-[11.5px] md:text-[12px] lg:text-[12.5px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[15px] 4xl:text-[16px]
                  font-semibold
                  bg-[var(--color-blue,#1c4fd7)]
                  hover:brightness-95 active:scale-[0.98]
                  rounded-full 
                  h-[28px] sm:h-[30px] md:h-[33px] lg:h-[36px] xl:h-[38px] 2xl:h-[40px] 3xl:h-[42px] 4xl:h-[44px]
                  px-2.5 sm:px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 3xl:px-6.5 4xl:px-7
                  transition whitespace-nowrap
                '
                onClick={() => {
                  clearTokens()
                  navigate(loggedOutNavigations.LOGIN, { replace: true })
                }}
              >
                로그아웃
              </button>

              <button
                type='button'
                className='
                  text-[var(--color-blue,#1c4fd7)] 
                  text-[11px] sm:text-[11.5px] md:text-[12px] lg:text-[12.5px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[15px] 4xl:text-[16px]
                  font-semibold
                  bg-transparent border border-[var(--color-blue,#1c4fd7)]
                  hover:bg-[var(--color-blue,#1c4fd7)] hover:text-white
                  active:scale-[0.98]
                  rounded-full 
                  h-[28px] sm:h-[30px] md:h-[33px] lg:h-[36px] xl:h-[38px] 2xl:h-[40px] 3xl:h-[42px] 4xl:h-[44px]
                  px-2.5 sm:px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 3xl:px-6.5 4xl:px-7
                  transition whitespace-nowrap
                '
                onClick={() => navigate(userNavigations.MY_PAGE)}
              >
                <span className='hidden sm:inline'>마이페이지</span>
                <span className='sm:hidden'>MY</span>
              </button>
            </>
          ) : (
            <>
              <button
                type='button'
                className='
                  text-white 
                  text-[11px] sm:text-[11.5px] md:text-[12px] lg:text-[12.5px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[15px] 4xl:text-[16px]
                  font-semibold
                  bg-[var(--color-blue,#1c4fd7)]
                  hover:brightness-95 active:scale-[0.98]
                  rounded-full 
                  h-[28px] sm:h-[30px] md:h-[33px] lg:h-[36px] xl:h-[38px] 2xl:h-[40px] 3xl:h-[42px] 4xl:h-[44px]
                  px-2.5 sm:px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 3xl:px-6.5 4xl:px-7
                  transition whitespace-nowrap
                '
                onClick={() => navigate(loggedOutNavigations.LOGIN)}
              >
                로그인
              </button>

              <button
                type='button'
                className='
                  text-[var(--color-blue,#1c4fd7)] 
                  text-[11px] sm:text-[11.5px] md:text-[12px] lg:text-[12.5px] xl:text-[13px] 2xl:text-[14px] 3xl:text-[15px] 4xl:text-[16px]
                  font-semibold
                  bg-transparent border border-[var(--color-blue,#1c4fd7)]
                  hover:bg-[var(--color-blue,#1c4fd7)] hover:text-white
                  active:scale-[0.98]
                  rounded-full 
                  h-[28px] sm:h-[30px] md:h-[33px] lg:h-[36px] xl:h-[38px] 2xl:h-[40px] 3xl:h-[42px] 4xl:h-[44px]
                  px-2.5 sm:px-3 md:px-3.5 lg:px-4 xl:px-5 2xl:px-6 3xl:px-6.5 4xl:px-7
                  transition whitespace-nowrap
                '
                onClick={() => navigate(loggedOutNavigations.SIGNUP)}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
