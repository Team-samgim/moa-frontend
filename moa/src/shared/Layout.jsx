import { Outlet } from 'react-router-dom'

const Header = () => {
  return <h1>Header</h1>
}

const Footer = () => {
  return <h1>Footer</h1>
}

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
