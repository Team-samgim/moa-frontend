import axiosInstance from '@/api/axios'

// 파일 목록 조회
export async function fetchExportFiles({ type = 'GRID', page = 0, size = 10 }) {
  const { data } = await axiosInstance.get('/files/exports', {
    params: { type, page, size },
  })
  // 기대 형식: { items:[{fileId, fileName, layer, createdAt, config?, httpUrl?}], page, size, totalPages, totalItems }
  return data
}

// 파일 삭제
export async function deleteExportFile(fileId) {
  const { data } = await axiosInstance.delete(`/files/exports/${fileId}`)
  return data
}

// 다운로드 URL (서버가 사전 서명 URL/프록시 제공한다고 가정)
export async function getExportDownloadUrl(fileId) {
  const { data } = await axiosInstance.get(`/files/exports/${fileId}/download`)
  // 기대 형식: { httpUrl }
  return data?.httpUrl
}

// CSV 미리보기(상위 N건)
export async function fetchExportPreview({ fileId, limit = 20 }) {
  const { data } = await axiosInstance.get(`/files/exports/${fileId}/preview`, {
    params: { limit },
  })
  // 기대 형식: { rows:[{...}], columns?:["a","b",...]}  (columns 없으면 rows[0]의 key로 유추)
  return data
}
