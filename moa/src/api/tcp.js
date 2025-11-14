import axiosInstance from '@/api/axios'

export const fetchTcpMetrics = async (rowKey, signal) => {
  const { data } = await axiosInstance.get(`/details/tcp/${encodeURIComponent(rowKey)}`, {
    signal,
  })
  return data
}
