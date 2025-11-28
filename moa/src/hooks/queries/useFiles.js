/**
 * Export File Hooks
 *
 * - 내보내기 파일 목록 조회(useExportFiles)
 * - 내보내기 파일 미리보기(useExportPreview)
 * - 이미지 파일 URL 조회(useExportImageUrl)
 * - 내보내기 파일 삭제(useDeleteExport)
 * - 내보내기 파일 다운로드(useDownloadExport)
 *
 * AUTHOR: 방대혁
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchExportFiles,
  deleteExportFile,
  fetchExportPreview,
  getExportDownloadUrl,
} from '@/api/files'

/**
 * 내보내기 파일 목록 조회
 */
export function useExportFiles({ type, page, size }) {
  return useQuery({
    queryKey: ['exportFiles', { type, page, size }],
    queryFn: () => fetchExportFiles({ type, page, size }),
    keepPreviousData: true,
  })
}

/**
 * 내보내기 파일 미리보기
 */
export function useExportPreview({ fileId, limit = 20, enabled = false }) {
  return useQuery({
    queryKey: ['exportPreview', { fileId, limit }],
    queryFn: () => fetchExportPreview({ fileId, limit }),
    enabled: !!fileId && enabled,
  })
}

/**
 * 이미지 URL 조회 (이미지 미리보기 전용)
 */
export function useExportImageUrl({ fileId, enabled = false }) {
  return useQuery({
    queryKey: ['exportImageUrl', fileId],
    queryFn: () => getExportDownloadUrl(fileId),
    enabled: !!fileId && enabled,
  })
}

/**
 * 내보내기 파일 삭제
 */
export function useDeleteExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => deleteExportFile(fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exportFiles'] }),
  })
}

/**
 * 내보내기 파일 다운로드
 */
export function useDownloadExport() {
  return useMutation({
    mutationFn: async (fileId) => {
      const url = await getExportDownloadUrl(fileId)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return url
    },
  })
}
