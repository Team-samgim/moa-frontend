import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchExportFiles,
  deleteExportFile,
  fetchExportPreview,
  getExportDownloadUrl,
} from '@/api/files'

export function useExportFiles({ type, page, size }) {
  return useQuery({
    queryKey: ['exportFiles', { type, page, size }],
    queryFn: () => fetchExportFiles({ type, page, size }),
    keepPreviousData: true,
  })
}

export function useExportPreview({ fileId, limit = 20, enabled = false }) {
  return useQuery({
    queryKey: ['exportPreview', { fileId, limit }],
    queryFn: () => fetchExportPreview({ fileId, limit }),
    enabled: !!fileId && enabled,
  })
}

// 차트 이미지 URL용 훅 (다운로드 대신 미리보기)
export function useExportImageUrl({ fileId, enabled = false }) {
  return useQuery({
    queryKey: ['exportImageUrl', fileId],
    queryFn: () => getExportDownloadUrl(fileId), // presigned URL 그대로 사용
    enabled: !!fileId && enabled,
  })
}

export function useDeleteExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileId) => deleteExportFile(fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exportFiles'] }),
  })
}

export function useDownloadExport() {
  return useMutation({
    mutationFn: async (fileId) => {
      const url = await getExportDownloadUrl(fileId)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return url
    },
  })
}
