import axiosInstance from './axios'

// 레이어별 필드 목록 조회
const fetchPivotFields = async (layer) => {
  const res = await axiosInstance.get('/pivot/fields', {
    params: { layer },
  })
  return res.data
}

// 피벗 쿼리 실행
const runPivotQuery = async (payload) => {
  const res = await axiosInstance.post('/pivot/query', payload)
  // console.log(res.data)
  return res.data
}

// 필드 별 value 리스트 조회
const fetchValues = async (payload) => {
  const res = await axiosInstance.post('/pivot/values', payload)
  // console.log(`fetch values`)
  // console.log(res.data)
  return res.data
}

// row group의 subRows 조회
const fetchRowGroupItems = async (payload) => {
  const res = await axiosInstance.post('/pivot/row-group/items', payload)
  return res.data
}

// 피벗 차트 데이터 조회
const runPivotChart = async (payload) => {
  // console.log(payload)
  const res = await axiosInstance.post('/chart', payload)
  // console.log('pivot chart result', res.data)
  return res.data
}

// 피벗 히트맵 테이블 데이터 조회
const runPivotHeatmapTable = async (payload) => {
  // console.log(payload)
  const res = await axiosInstance.post('/chart/heatmap-table', payload)
  // console.log('pivot heatmap table result', res.data)
  return res.data
}

// 피벗 프리셋 불러오기
const fetchPivotPresets = async ({ page = 0, size = 50, type } = {}) => {
  const { data } = await axiosInstance.get('/mypage/presets/pivot', {
    params: { page, size, ...(type ? { type } : {}) },
  })
  return data
}

// 피벗 드릴다운 시계열 조회
const runDrilldownTimeSeries = async (payload) => {
  console.log('pivot drilldown payload', payload)
  const res = await axiosInstance.post('/chart/drilldown-time-series', payload)
  console.log('pivot drilldown result', res.data)
  return res.data
}

export {
  fetchPivotFields,
  runPivotQuery,
  fetchValues,
  fetchRowGroupItems,
  runPivotChart,
  runPivotHeatmapTable,
  fetchPivotPresets,
  runDrilldownTimeSeries,
}
