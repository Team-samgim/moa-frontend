import axiosInstance from './axios'

export const checkIdDuplicate = async (userId) => {
  try {
    const res = await axiosInstance.get(`/auth/exists/login-id`, {
      params: { value: userId },
    })
    return res.data
  } catch (error) {
    console.error('아이디 중복확인 실패:', error)
    throw error
  }
}

export const checkEmailDuplicate = async (email) => {
  try {
    const res = await axiosInstance.get(`/auth/check-email`, {
      params: { email },
    })
    return res.data
  } catch (error) {
    console.error('이메일 중복확인 실패:', error)
    throw error
  }
}
