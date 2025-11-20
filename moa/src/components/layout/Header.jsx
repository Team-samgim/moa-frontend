import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import bell from '@/assets/icons/bell.svg'
import logo from '@/assets/images/moa.webp'
import NotificationDropdown from '@/components/features/notification/NotificationDropdown'
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

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
        w-full flex justify-center items-end bg-transparent h-[90px]
        fixed top-0 left-0 right-0 z-50
        pl-6 lg:pl-8
        pr-[calc(1.5rem+var(--scrollbar-comp,0px))]
        lg:pr-[calc(2rem+var(--scrollbar-comp,0px))]
      '
    >
      <div
        className={`
          flex w-full items-center justify-between gap-4
          rounded-full bg-white
          px-6 mx-20 lg:px-8 h-[68px]
          shadow-[0_6px_8px_rgba(0,103,255,0.06),0_8px_10px_rgba(0,103,255,0.1)]
          transition-transform duration-600 ease-out
          ${isScrolled ? '-translate-y-23' : 'translate-y-0'}
        `}
      >
        <div className='flex items-center gap-3 shrink-0'>
          <Link to='/' className='flex flex-col leading-none select-none'>
            <div className='flex justify-center'>
              <img src={logo} alt='moa logo' className='h-13 object-contain' />
            </div>
          </Link>
        </div>

        <nav className='flex items-center gap-4 lg:gap-8 text-[14px] lg:text-[15.5px] font-medium flex-shrink-0'>
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

        <div className='flex items-center gap-2 lg:gap-3 flex-shrink-0'>
          {isLogin ? (
            <>
              <div className='relative'>
                <button
                  type='button'
                  aria-label='알림'
                  className='
                    relative flex items-center justify-center
                    w-9 h-9 rounded-full border border-gray-200 bg-white
                    text-gray-600
                    hover:bg-gray-50 hover:border-[var(--color-blue,#1c4fd7)]
                    hover:text-[var(--color-blue,#1c4fd7)]
                    active:scale-[0.97]
                    transition
                  '
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                >
                  <img src={bell} alt='알림' className='w-4 h-4' />
                  {/* 나중에 안읽은 개수 뱃지 달고 싶으면 여기서 unreadCount 써도 됨 */}
                </button>

                <NotificationDropdown
                  open={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>

              <button
                type='button'
                className='
                  text-white text-[13px] lg:text-[14px] font-semibold
                  bg-[var(--color-blue,#1c4fd7)]
                  hover:brightness-95 active:scale-[0.98]
                  rounded-full h-[37px] px-4 lg:px-6
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
                  text-[var(--color-blue,#1c4fd7)] text-[13px] lg:text-[14px] font-semibold
                  bg-transparent border border-[var(--color-blue,#1c4fd7)]
                  hover:bg-[var(--color-blue,#1c4fd7)] hover:text-white
                  active:scale-[0.98]
                  rounded-full h-[37px] px-4 lg:px-6
                  transition whitespace-nowrap
                '
                onClick={() => navigate(userNavigations.MY_PAGE)}
              >
                마이페이지
              </button>
            </>
          ) : (
            <>
              <button
                type='button'
                className='
                  text-white text-[13px] lg:text-[14px] font-semibold
                  bg-[var(--color-blue,#1c4fd7)]
                  hover:brightness-95 active:scale-[0.98]
                  rounded-full h-[37px] px-4 lg:px-6
                  transition whitespace-nowrap
                '
                onClick={() => navigate(loggedOutNavigations.LOGIN)}
              >
                로그인
              </button>

              <button
                type='button'
                className='
                  text-[var(--color-blue,#1c4fd7)] text-[13px] lg:text-[14px] font-semibold
                  bg-transparent border border-[var(--color-blue,#1c4fd7)]
                  hover:bg-[var(--color-blue,#1c4fd7)] hover:text-white
                  active:scale-[0.98]
                  rounded-full h-[37px] px-4 lg:px-6
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
