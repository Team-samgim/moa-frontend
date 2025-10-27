import axiosInstance from './axios'

// 레이어별 필드 목록 조회
export const fetchPivotFields = async (layer) => {
  const res = await axiosInstance.get('/pivot/fields', {
    params: { layer },
  })
  return res.data
}

// 피벗 쿼리 실행
export const runPivotQuery = async (payload) => {
  const res = await axiosInstance.post('/pivot/query', payload)
  console.log(res.data)
  return res.data
}
