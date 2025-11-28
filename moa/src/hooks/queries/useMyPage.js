/**
 * MyPage Hooks
 *
 * - 통계 조회(useMyStats)
 * - 프로필 조회(useMyProfile)
 * - 프리셋 목록 조회(useMyPresets)
 * - 프리셋 즐겨찾기 토글(useToggleFavoritePreset)
 * - 프리셋 이름 변경(useRenamePreset)
 * - 프리셋 삭제(useDeletePreset)
 *
 * AUTHOR: 방대혁
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyProfile,
  fetchMyPresets,
  toggleFavoritePreset,
  renamePreset,
  deletePreset,
  fetchMyStats,
} from '@/api/mypage'

/* ===== 통계 ===== */
export function useMyStats() {
  return useQuery({
    queryKey: ['mypage', 'stats'],
    queryFn: fetchMyStats,
    staleTime: 30_000,
  })
}

/* ===== 프로필 ===== */
export function useMyProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMyProfile,
    staleTime: 60_000,
  })
}

/* ===== 프리셋 ===== */
// 프리셋 목록
export function useMyPresets(params = { page: 0, size: 50 }) {
  return useQuery({
    queryKey: ['mypage', 'presets', params],
    queryFn: () => fetchMyPresets(params),
    staleTime: 10_000,
    keepPreviousData: true,
  })
}

// 즐겨찾기 토글
export function useToggleFavoritePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ presetId, favorite }) => toggleFavoritePreset(presetId, favorite),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mypage', 'presets'] })
    },
  })
}

// 이름 변경
export function useRenamePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ presetId, presetName }) => renamePreset(presetId, presetName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mypage', 'presets'] })
    },
  })
}

// 삭제
export function useDeletePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (presetId) => deletePreset(presetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mypage', 'presets'] })
    },
  })
}
