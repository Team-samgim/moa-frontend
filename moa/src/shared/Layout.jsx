import { Outlet } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

const Layout = () => {
  return (
    <div>
      <Header />
      <main className='pt-[130px]'>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
