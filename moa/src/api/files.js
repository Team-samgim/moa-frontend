/**
 * EXPORT 파일 API 모듈
 *
 * 제공 기능:
 * - 파일 목록 조회
 * - 파일 삭제
 * - 파일 다운로드 URL 조회 (Presigned URL or Proxy)
 * - CSV 미리보기 요청
 *
 * AUTHOR        : 방대혁
 */

import axiosInstance from '@/api/axios'

/**
 * 파일 목록 조회
 *
 * 요청:
 *   GET /files/exports
 *   params: { type, page, size }
 *
 * 응답 예시:
 * {
 *   items: [{ fileId, fileName, layer, createdAt, config?, httpUrl? }],
 *   page,
 *   size,
 *   totalPages,
 *   totalItems
 * }
 */
export async function fetchExportFiles({ type = 'GRID', page = 0, size = 10 }) {
  const { data } = await axiosInstance.get('/files/exports', {
    params: { type, page, size },
  })
  return data
}

/**
 * 파일 삭제
 *
 * 요청:
 *   DELETE /files/exports/{fileId}
 *
 * 응답:
 *   성공 시 서버 응답 반환
 */
export async function deleteExportFile(fileId) {
  const { data } = await axiosInstance.delete(`/files/exports/${fileId}`)
  return data
}

/**
 * 다운로드 URL 조회
 *
 * 요청:
 *   GET /files/exports/{fileId}/download
 *
 * 응답 형식:
 * {
 *   httpUrl: "https://..."  // 사전 서명 URL 또는 프록시 경로
 * }
 *
 * 반환:
 *   URL 문자열 또는 undefined
 */
export async function getExportDownloadUrl(fileId) {
  const { data } = await axiosInstance.get(`/files/exports/${fileId}/download`)
  return data?.httpUrl
}

/**
 * CSV 미리보기 (상위 N건)
 *
 * 요청:
 *   GET /files/exports/{fileId}/preview?limit=N
 *
 * 응답 예시:
 * {
 *   rows: [{...}, {...}],
 *   columns?: ["col1", "col2"]
 * }
 *
 * columns가 제공되지 않으면, rows[0]의 key로 UI에서 추론 가능
 */
export async function fetchExportPreview({ fileId, limit = 20 }) {
  const { data } = await axiosInstance.get(`/files/exports/${fileId}/preview`, {
    params: { limit },
  })
  return data
}
