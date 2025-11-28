// 작성자: 최이서
import { Outlet, useLocation } from 'react-router-dom'
import GradientBackground from '@/components/landing/GradientBackground'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { loggedOutNavigations } from '@/constants/navigations'

const Layout = () => {
  const location = useLocation()
  const isOnboarding = location.pathname === loggedOutNavigations.LANDING

  return (
    <div className={isOnboarding ? 'relative min-h-screen overflow-hidden' : 'min-h-screen'}>
      {isOnboarding && (
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <GradientBackground />
        </div>
      )}

      <div className='relative z-10'>
        <Header />
        <main className={isOnboarding ? '' : 'pt-[130px] 4xl:pt-[140px]'}>
          <Outlet />
        </main>

        {!isOnboarding && <Footer />}
      </div>
    </div>
  )
}

export default Layout
