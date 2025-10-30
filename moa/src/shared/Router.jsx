import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import ProtectedRoute from './ProtedtedRoute'

import { loggedOutNavigations, userNavigations } from '@/constants/navigations'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import PivotPage from '@/pages/pivot/PivotPage'
import SearchPage from '@/pages/search/SearchPage'
import TestPage from '@/pages/test/TestPage'
import TestPage2 from '@/pages/test/TestPage2'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* 비로그인 상태 */}
          <Route path='/' element={<LoginPage />} />
          <Route path={loggedOutNavigations.LOGIN} element={<LoginPage />} />
          <Route path={loggedOutNavigations.TEST} element={<TestPage />} />
          <Route path={loggedOutNavigations.TEST_2} element={<TestPage2 />} />

          {/* 로그인 상태: 보호 영역 */}
          <Route element={<ProtectedRoute />}>
            <Route path={userNavigations.DASHBOARD} element={<DashboardPage />} />
            <Route path={userNavigations.SEARCH} element={<SearchPage />} />
            <Route path={userNavigations.PIVOT} element={<PivotPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
