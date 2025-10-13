import { Outlet } from 'react-router-dom'

function Header() {
  return <h1>Header</h1>
}

function Footer() {
  return <h1>Footer</h1>
}

function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

export default Layout
