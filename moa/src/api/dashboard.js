/**
 * 작성자: 정소영
 */
import axiosInstance from './axios'

// 대시보드 통합 호출: 모든 위젯 데이터 한 번에
const fetchDashboardApi = (payload) =>
  axiosInstance.post('/dashboard', payload).then((res) => res.data)

// 국가별 트래픽 위젯: 선택한 국가 + 시간 범위로 조회
const fetchTrafficByCountry = (payload) =>
  axiosInstance.post('/dashboard/widgets/traffic-by-country', payload).then((res) => res.data)

export { fetchDashboardApi, fetchTrafficByCountry }
