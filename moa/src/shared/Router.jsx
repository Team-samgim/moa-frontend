import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import GridPage from '@/pages/grid/GridPage'
import PivotPage from '@/pages/pivot/PivotPage'
import SearchPage from '@/pages/search/SearchPage'
import TestPage from '@/pages/test/TestPage'
import TestPage2 from '@/pages/test/TestPage2'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path='/' element={<LoginPage />} />
          <Route path='login' element={<LoginPage />} />
          <Route path='dashboard' element={<DashboardPage />} />
          <Route path='search' element={<SearchPage />} />
          <Route path='pivot' element={<PivotPage />} />
          <Route path='test' element={<TestPage />} />
          <Route path='test2' element={<TestPage2 />} />
          <Route path='grid' element={<GridPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
