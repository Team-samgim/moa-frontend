import axiosInstance from './axios'

const getMe = async () => {
  const res = await axiosInstance.get('/members/me')
  return res.data
}

export { getMe }
