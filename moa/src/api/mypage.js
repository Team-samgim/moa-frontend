import axiosInstance from '@/api/axios'

// 프로필
export async function fetchMyProfile() {
  const { data } = await axiosInstance.get('/members/me')
  return data // { id, name, email, avatarUrl, createdAt, ... }
}
