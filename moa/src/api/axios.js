import axios from 'axios'
import { reissueApi } from './auth'
import { useAuthStore } from '@/stores/authStore'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let isRefreshing = false
let queue = []

function flushQueue(error, newAccessToken) {
  queue.forEach(({ resolve, reject, originalRequest }) => {
    if (error) {
      reject(error)
    } else {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      resolve(axiosInstance(originalRequest))
    }
  })
  queue = []
}

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error.config

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const { refreshToken, setTokens, clearTokens } = useAuthStore.getState()

      if (!refreshToken) {
        clearTokens()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject, originalRequest })
        })
      }

      isRefreshing = true
      try {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          await reissueApi(refreshToken)

        setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })

        isRefreshing = false
        flushQueue(null, newAccessToken)

        // 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosInstance(originalRequest)
      } catch (err) {
        isRefreshing = false
        flushQueue(err)
        clearTokens()
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
