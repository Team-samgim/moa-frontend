import axiosInstance from '@/api/axios'

// 무한 스크롤용 알림 목록 조회
export async function fetchNotifications({ pageParam = null, pageSize = 20 }) {
  const params = { size: pageSize }
  if (pageParam) {
    params.cursor = pageParam
  }

  const res = await axiosInstance.get('/notifications', { params })
  const data = res.data

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

// 안 읽은 개수만 따로 조회
export async function fetchUnreadCount() {
  const res = await axiosInstance.get('/notifications/unread-count')

  console.log('🔍 Raw API response:', res.data)

  // 백엔드가 {"unreadCount": 3} 형태로 반환
  const data = res.data

  // 중첩된 경우 처리: {"unreadCount": {"unreadCount": 3}}
  if (data && typeof data === 'object' && 'unreadCount' in data) {
    const count = data.unreadCount

    // 한번 더 중첩된 경우
    if (typeof count === 'object' && count !== null && 'unreadCount' in count) {
      console.log('✅ Nested object detected, extracting:', count.unreadCount)
      return count.unreadCount
    }

    // 정상적인 경우
    if (typeof count === 'number') {
      console.log('✅ Direct number:', count)
      return count
    }
  }

  // 혹시 숫자만 반환하는 경우
  if (typeof data === 'number') {
    console.log('✅ Raw number:', data)
    return data
  }

  console.warn('⚠️ Unexpected response format:', data)
  return 0
}

// 알림 생성 함수
export async function createNotification(notificationData) {
  const res = await axiosInstance.post('/notifications', notificationData)

  return res.data
}
