// 작성자: 최이서
import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/member'
import { useAuthStore } from '@/stores/authStore'

export function useMember() {
  const { isLogin } = useAuthStore()

  return useQuery({
    queryKey: ['member', 'me'],
    queryFn: getMe,
    enabled: isLogin,
    staleTime: 1000 * 60,
  })
}
