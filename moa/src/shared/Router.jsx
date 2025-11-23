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

const LandingWithAuth = () => {
  const navigate = useNavigate()
  const { accessToken, refreshToken, setTokens, clearTokens } = useAuthStore()

  useEffect(() => {
    const run = async () => {
      // 토큰이 없으면 그냥 랜딩 페이지 표시
      if (!accessToken && !refreshToken) {
        return
      }

      // 토큰이 있으면 재발급 시도 후 대시보드로 이동
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
        // 에러 발생 시 토큰 제거하고 랜딩 페이지 유지
      }
    }

    run()
  }, [accessToken, refreshToken, clearTokens, navigate, setTokens])

  return <LandingPage />
}

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* 비로그인 상태 */}
          <Route path='/' element={<LandingWithAuth />} />
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
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
