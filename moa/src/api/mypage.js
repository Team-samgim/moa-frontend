// src/api/mypage.js
import api from '@/api/axios'

/** ========= 프로필 ========= **/
export async function fetchMyProfile() {
  const { data } = await api.get('/members/me') // baseURL이 .../api 라면 OK
  return data // { id, nickname, email, ... }
}

/** ========= 프리셋 ========= **/
// 프리셋 목록
export async function fetchMyPresets({ page = 0, size = 50, type } = {}) {
  const { data } = await api.get('/mypage/presets', {
    params: { page, size, ...(type ? { type } : {}) }, // type: 'SEARCH' | 'PIVOT' (옵션)
  })
  // 기대 응답: { items: [...], total, ... }
  return data
}

// 프리셋 즐겨찾기 토글
export async function toggleFavoritePreset(presetId, favorite) {
  const { data } = await api.patch(`/mypage/presets/${presetId}/favorite`, { favorite })
  return data
}

// 프리셋 이름 변경
export async function renamePreset(presetId, presetName) {
  const { data } = await api.patch(`/mypage/presets/${presetId}/name`, { presetName })
  return data
}

// 프리셋 삭제
export async function deletePreset(presetId) {
  const { data } = await api.delete(`/mypage/presets/${presetId}`)
  return data ?? null
}
