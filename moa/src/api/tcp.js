import axiosInstance from '@/api/axios'

export const fetchTcpMetrics = async (rowKey, signal) => {
  const { data } = await axiosInstance.get(`/tcp/metrics/${encodeURIComponent(rowKey)}`, {
    signal,
  })
  return data
}
