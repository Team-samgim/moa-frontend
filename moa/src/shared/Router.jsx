import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import LoginPage from '@/pages/auth/LoginPage'
import TestPage from '@/pages/test/TestPage'
import TestPage2 from '@/pages/test/TestPage2'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<LoginPage />} />
          <Route path='login' element={<LoginPage />} />
          <Route path='test' element={<TestPage />} />
          <Route path='test2' element={<TestPage2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
