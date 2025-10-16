import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import LoginScreen from '@/pages/auth/LoginScreen'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<LoginScreen />} />
          <Route path='login' element={<LoginScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
