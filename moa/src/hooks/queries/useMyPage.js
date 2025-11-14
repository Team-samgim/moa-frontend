import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyProfile,
  fetchMyPresets,
  toggleFavoritePreset,
  renamePreset,
  deletePreset,
} from '@/api/mypage'

/* ===== 프로필 ===== */
export function useMyProfile() {
  return useQuery({ queryKey: ['me'], queryFn: fetchMyProfile, staleTime: 60_000 })
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
