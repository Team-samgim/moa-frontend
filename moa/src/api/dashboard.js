import axiosInstance from './axios'

// 대시보드 통합 호출: 모든 위젯 데이터 한 번에
const fetchDashboardApi = (payload) =>
  axiosInstance.post('/dashboard', payload).then((res) => res.data)

export { fetchDashboardApi }
