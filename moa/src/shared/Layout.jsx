import { Outlet } from 'react-router-dom'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

const Layout = () => {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

export default Layout
