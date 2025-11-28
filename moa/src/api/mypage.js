/**
 * MyPage API 모듈
 * 기능:
 * 사용자 프로필/통계 조회
 * Preset 목록 조회/즐겨찾기/이름 변경/삭제
 * AUTHOR : 방대혁
 */
import api from '@/api/axios'

/* ===============================================================
 *  통계 조회
 * =============================================================== */

/**
 * 내 통계 조회
 * GET /mypage/stats
 *
 * 반환:
 * {
 *   totalPresets: number,
 *   favoritePresets: number,
 *   totalExports: number
 * }
 */
export async function fetchMyStats() {
  const { data } = await api.get('/mypage/stats')
  return data
}

/* ===============================================================
 *  프로필 조회
 * =============================================================== */

/**
 * 내 프로필 조회
 * GET /members/me
 *
 * 반환:
 * {
 *   id,
 *   nickname,
 *   email,
 *   createdAt,
 *   ...
 * }
 */
export async function fetchMyProfile() {
  const { data } = await api.get('/members/me')
  return data
}

/* ===============================================================
 *  프리셋(Preset)
 * =============================================================== */

/**
 * 내 프리셋 목록 조회
 * GET /mypage/presets
 *
 * 파라미터:
 *  - page: number (기본 0)
 *  - size: number (기본 50)
 *  - type?: SEARCH | PIVOT | CHART
 *  - origin?: USER | EXPORT
 *
 * 반환:
 * {
 *   items: [...],
 *   page,
 *   size,
 *   totalPages,
 *   totalItems
 * }
 */
export async function fetchMyPresets({ page = 0, size = 50, type, origin } = {}) {
  const params = { page, size }
  if (type) params.type = type
  if (origin) params.origin = origin

  const { data } = await api.get('/mypage/presets', { params })
  return data
}

/**
 * 프리셋 즐겨찾기 설정/해제
 * PATCH /mypage/presets/{presetId}/favorite
 *
 * body:
 * {
 *   favorite: boolean
 * }
 */
export async function toggleFavoritePreset(presetId, favorite) {
  const { data } = await api.patch(`/mypage/presets/${presetId}/favorite`, { favorite })
  return data
}

/**
 * 프리셋 이름 변경
 * PATCH /mypage/presets/{presetId}/name
 *
 * body:
 * {
 *   presetName: string
 * }
 */
export async function renamePreset(presetId, presetName) {
  const { data } = await api.patch(`/mypage/presets/${presetId}/name`, { presetName })
  return data
}

/**
 * 프리셋 삭제
 * DELETE /mypage/presets/{presetId}
 *
 * 반환:
 *  성공: { ... } 또는 빈값 → null 처리
 */
export async function deletePreset(presetId) {
  const { data } = await api.delete(`/mypage/presets/${presetId}`)
  return data ?? null
}
