import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import LoginScreen from '@/pages/auth/LoginScreen'
import SignupScreen from '@/pages/signup/SignupScreen'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<LoginScreen />} />
          <Route path='login' element={<LoginScreen />} />
          <Route path='signup' element={<SignupScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
