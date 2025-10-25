import { useMember } from '@/hooks/queries/useMember'
import { useAuthStore } from '@/stores/authStore'

const DashboardPage = () => {
  const { isLogin } = useAuthStore()
  const { data, isLoading, isError } = useMember()

  if (!isLogin) {
    return (
      <div className='min-h-screen flex items-center justify-center text-gray-700'>
        <p>로그인이 필요합니다.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center text-gray-700'>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='min-h-screen flex items-center justify-center text-red-500'>
        <p>프로필 정보를 불러오지 못했어요.</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-6'>
      <div className='bg-white rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.06)] p-10 text-center max-w-sm w-full'>
        <p className='text-xl font-semibold text-gray-800'>{data.nickname}님 안녕하세요 👋</p>
        <p className='mt-3 text-sm text-gray-500'>아이디: {data.loginId}</p>
        <p className='text-sm text-gray-500'>이메일: {data.email}</p>
      </div>
    </div>
  )
}

export default DashboardPage
