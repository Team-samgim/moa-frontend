import axiosInstance from './axios'

const checkIdDuplicate = async (userId) => {
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

const signup = async (payload) => {
  try {
    const res = await axiosInstance.post('/auth/signup', payload)
    return res.data
  } catch (error) {
    console.error('회원가입 실패:', error)
    throw error
  }
}

const loginApi = async ({ loginId, password }) => {
  const res = await axiosInstance.post('/auth/login', { loginId, password })
  return res.data
}

const reissueApi = async (refreshToken) => {
  const res = await axiosInstance.post('/auth/reissue', {
    refreshToken,
  })
  return res.data
}

export { checkIdDuplicate, signup, loginApi, reissueApi }
