import axiosInstance from '@/api/axios'

// 무한 스크롤용 알림 목록 조회
// pageParam === cursor (첫 요청은 null/undefined)
export async function fetchNotifications({ pageParam = null, pageSize = 20 }) {
  const params = { size: pageSize }
  if (pageParam) {
    params.cursor = pageParam
  }

  const res = await axiosInstance.get('/notifications', { params })
  const data = res.data

  // 백엔드 응답 예시 가정:
  // {
  //   items: [...],
  //   nextCursor: 123,     // 없으면 null
  //   hasNext: true/false,
  //   unreadCount: 3
  // }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextCursor: data.nextCursor ?? null,
    hasNextPage: Boolean(data.hasNext),
    unreadCount: data.unreadCount ?? 0,
  }
}

// 단건 읽음 처리
export async function markNotificationRead(notificationId) {
  await axiosInstance.patch(`/notifications/${notificationId}/read`)
  return true
}

// 전체 읽음 처리
export async function markAllNotificationsRead() {
  await axiosInstance.post('/notifications/read-all')
  return true
}

// 안 읽은 개수만 따로 조회 (필요 시)
export async function fetchUnreadCount() {
  const res = await axiosInstance.get('/notifications/unread-count')
  // 숫자만 내려준다고 가정
  return res.data
}
