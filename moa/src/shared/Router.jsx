import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import Layout from './Layout'
import ProtectedRoute from './ProtedtedRoute'

import { reissueApi } from '@/api/auth'
import { loggedOutNavigations, userNavigations } from '@/constants/navigations'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import LandingPage from '@/pages/landing/LandingPage'
import FileManagementPage from '@/pages/mypage/FileManagementPage'
import MyPage from '@/pages/mypage/MyPage'
import PresetPage from '@/pages/mypage/PresetPage'
import PivotPage from '@/pages/pivot/PivotPage'
import SearchPage from '@/pages/search/SearchPage'
import TestPage from '@/pages/test/TestPage'
import TestPage2 from '@/pages/test/TestPage2'
import { useAuthStore } from '@/stores/authStore'

const AuthBootstrap = () => {
  const navigate = useNavigate()
  const { accessToken, refreshToken, setTokens, clearTokens } = useAuthStore()

  useEffect(() => {
    const run = async () => {
      if (!accessToken && !refreshToken) {
        clearTokens()
        navigate(loggedOutNavigations.LANDING, { replace: true })
        return
      }

      try {
        if (refreshToken) {
          const { accessToken: newAccess, refreshToken: newRefresh } =
            await reissueApi(refreshToken)

          setTokens({
            accessToken: newAccess,
            refreshToken: newRefresh,
          })
        }

        navigate(userNavigations.DASHBOARD, { replace: true })
      } catch (e) {
        console.error(e)
        clearTokens()
        navigate(loggedOutNavigations.LANDING, { replace: true })
      }
    }

    run()
  }, [accessToken, refreshToken, clearTokens, navigate, setTokens])
  return null
}

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* 비로그인 상태 */}
          <Route path='/' element={<AuthBootstrap />} />
          <Route path={loggedOutNavigations.LANDING} element={<LandingPage />} />
          <Route path={loggedOutNavigations.LOGIN} element={<LoginPage />} />
          <Route path={loggedOutNavigations.TEST} element={<TestPage />} />
          <Route path={loggedOutNavigations.TEST_2} element={<TestPage2 />} />

          {/* 로그인 상태: 보호 영역 */}
          <Route element={<ProtectedRoute />}>
            <Route path={userNavigations.DASHBOARD} element={<DashboardPage />} />
            <Route path={userNavigations.SEARCH} element={<SearchPage />} />
            <Route path={userNavigations.PIVOT} element={<PivotPage />} />
            <Route path={userNavigations.FILE_MANAGEMENT} element={<FileManagementPage />} />
            <Route path={userNavigations.PRESET} element={<PresetPage />} />
            <Route path={userNavigations.MY_PAGE} element={<MyPage />} />
            {/* <Route path={userNavigations.GRID} element={<GridPage />} /> */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
