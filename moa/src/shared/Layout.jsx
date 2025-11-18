import { Outlet, useLocation } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import GradientBackground from '@/components/onboarding/GradientBackground'
import { loggedOutNavigations } from '@/constants/navigations'

const Layout = () => {
  const location = useLocation()
  const isOnboarding = location.pathname === loggedOutNavigations.ONBOARDING

  return (
    <div className={isOnboarding ? 'relative min-h-screen overflow-hidden' : 'min-h-screen'}>
      {isOnboarding && (
        <div className='pointer-events-none absolute inset-0 -z-10'>
          <GradientBackground />
        </div>
      )}

      <div className='relative z-10'>
        <Header />

        <main className='pt-[130px]'>
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default Layout
