import axiosInstance from './axios'

// 메타 정보 조회 API (http_page 레이어 등 필드 조회)
const searchMetaApi = async (layer) => {
  try {
    // 인터셉터 미설정 대비: 토큰을 직접 헤더에 붙임
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('accessToken')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    if (import.meta.env.DEV) {
      console.log('[API] GET /search/field', { layer, auth: !!token })
    }

    const res = await axiosInstance.get('/search/field', {
      params: { layer: layer ?? 'HTTP_PAGE', view: 'byField' },
      headers,
    })
    return res.data
  } catch (error) {
    console.error('메타데이터 조회 실패:', error)
    throw error
  }
}

// 조건 실행 API: 실시간 쿼리(JSON DSL)를 백엔드로 전송하여 데이터 검색
// 백엔드에서 /api/search/execute 로 매핑해 주세요.
const executeSearchApi = async (payload) => {
  try {
    if (import.meta.env.DEV) {
      console.log('[API] POST /search/execute', payload)
    }
    const res = await axiosInstance.post('/search/execute', payload)
    return res.data
  } catch (error) {
    console.error('검색 실행 실패:', error)
    throw error
  }
}

export { searchMetaApi, executeSearchApi }
