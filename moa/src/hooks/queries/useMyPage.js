import { useQuery } from '@tanstack/react-query'
import { fetchMyProfile } from '@/api/mypage'

// 프로필
export function useMyProfile() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMyProfile, staleTime: 60_000 })
}
