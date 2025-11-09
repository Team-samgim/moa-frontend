import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchMyProfile,
  fetchMyPresets,
  toggleFavoritePreset,
  renamePreset,
  deletePreset,
  fetchMyExports,
  deleteExport,
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

/* ===== 문서(내보내기) ===== */
export function useMyExports({ page = 0, size = 50 } = {}) {
  return useQuery({
    queryKey: ['exports', page, size],
    queryFn: () => fetchMyExports({ page, size }),
    staleTime: 30_000,
  })
}
export function useDeleteExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteExport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exports'] }),
  })
}
