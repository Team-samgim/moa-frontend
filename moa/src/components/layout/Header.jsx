import { Link, NavLink } from 'react-router-dom'
import logo from '@/assets/images/moa.webp'

const navItems = [
  { label: '대시보드', to: '/dashboard' },
  { label: '검색', to: '/search' },
  { label: '피벗 테이블', to: '/pivot' },
  { label: '프리셋', to: '/' },
  { label: '파일 관리', to: '/' },
]

const Header = () => {
  return (
    <header className='w-full flex justify-center py-4 px-4 bg-transparent'>
      <div
        className='
          flex w-full max-w-[1200px] items-center justify-between
          rounded-full border border-gray-200 bg-white
          shadow-[0_10px_30px_rgba(0,103,255,0.06)]
          px-5 sm:px-6 md:px-8 h-[60px]
        '
      >
        <div className='flex items-center gap-3 min-w-[80px]'>
          <Link to='/' className='flex flex-col leading-none select-none'>
            <div className='flex justify-center'>
              <img src={logo} alt='moa logo' className='h-12 md:h-12 object-contain' />
            </div>
          </Link>
        </div>

        <nav className='hidden md:flex items-center gap-8 text-[14px]'>
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  'transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-[var(--color-blue,#1c4fd7)] font-medium'
                    : 'text-gray-700 hover:text-gray-900',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className='flex items-center gap-3 sm:gap-4'>
          <button
            type='button'
            className='
              text-white text-[14px] font-medium
              bg-[var(--color-blue,#1c4fd7)]
              hover:brightness-95 active:scale-[0.98]
              rounded-full h-[38px] px-4
              shadow-[0_4px_10px_rgba(0,103,255,0.3)]
              transition
            '
            onClick={() => {
              // TODO: 로그아웃 API 연동
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
