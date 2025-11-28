// 작성자: 최이서
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const ProtectedRoute = () => {
  const isLogin = useAuthStore((s) => s.isLogin)

  if (!isLogin) {
    return <Navigate to='/login' replace={true} />
  }

  return <Outlet />
}

export default ProtectedRoute
