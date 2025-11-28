/**
 * Notification API 모듈
 *
 * 기능:
 * - 무한 스크롤 기반 알림 목록 조회
 * - 알림 읽음 처리(단건/전체)
 * - 안 읽은 알림 개수 조회
 * - 알림 생성
 *
 * AUTHOR : 방대혁
 */

import axiosInstance from '@/api/axios'

/* ===============================================================
 *  알림 목록 조회 (Infinite Query)
 * =============================================================== */

/**
 * 알림 목록 조회
 * GET /notifications
 *
 * params:
 *  - pageParam: 커서 기반 페이지네이션 값
 *  - pageSize: 조회 크기
 *
 * 반환:
 * {
 *   items: [...],
 *   nextCursor: string | null,
 *   hasNextPage: boolean,
 *   unreadCount: number
 * }
 */
export async function fetchNotifications({ pageParam = null, pageSize = 20 }) {
  const params = { size: pageSize }
  if (pageParam) params.cursor = pageParam

  const res = await axiosInstance.get('/notifications', { params })
  const data = res.data

  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor ?? null,
    hasNextPage: Boolean(data.hasNext),
    unreadCount: data.unreadCount ?? 0,
  }
}

/* ===============================================================
 *  읽음 처리
 * =============================================================== */

/**
 * 단건 읽음 처리
 * PATCH /notifications/{id}/read
 */
export async function markNotificationRead(notificationId) {
  await axiosInstance.patch(`/notifications/${notificationId}/read`)
  return true
}

/**
 * 전체 읽음 처리
 * POST /notifications/read-all
 */
export async function markAllNotificationsRead() {
  await axiosInstance.post('/notifications/read-all')
  return true
}

/* ===============================================================
 *  안 읽은 개수 조회
 * =============================================================== */

/**
 * 안 읽은 알림 개수 조회
 * GET /notifications/unread-count
 *
 * 백엔드 반환 형식:
 *  - { unreadCount: number }
 *  - { unreadCount: { unreadCount: number } }
 *  - 숫자 단독 반환 가능성도 대비
 */
export async function fetchUnreadCount() {
  const res = await axiosInstance.get('/notifications/unread-count')
  const data = res.data

  // { unreadCount: n }
  if (data && typeof data === 'object' && 'unreadCount' in data) {
    const count = data.unreadCount

    // { unreadCount: { unreadCount: n } }
    if (typeof count === 'object' && count !== null && 'unreadCount' in count) {
      return count.unreadCount
    }

    // 정상 값
    if (typeof count === 'number') {
      return count
    }
  }

  // 숫자만 오는 경우
  if (typeof data === 'number') {
    return data
  }

  // 예상하지 못한 포맷은 0 처리
  return 0
}

/* ===============================================================
 *  알림 생성
 * =============================================================== */

/**
 * 알림 생성
 * POST /notifications
 *
 * payload 예시:
 * {
 *   memberId: number,
 *   type: string,
 *   message: string,
 *   link: string | null
 * }
 */
export async function createNotification(notificationData) {
  const res = await axiosInstance.post('/notifications', notificationData)
  return res.data
}
