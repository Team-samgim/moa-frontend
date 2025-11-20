export async function fetchNotifications({ pageParam = 0, pageSize = 20 }) {
  const res = await fetch(`/api/notifications?page=${pageParam}&size=${pageSize}`, {
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error('알림을 불러오지 못했습니다.')
  }

  const data = await res.json()

  // 백엔드가
  // 1) Spring Pageable: { content: [...], last: boolean, ... }
  // 2) 그냥 배열: [...]
  // 3) 직접 커스텀: { items: [...], hasNext: true }
  // 중 어떤 형태든 아래에서 매핑만 맞춰주면 됨
  const items = data.content ?? data.items ?? data
  const pageSizeFromServer = data.size ?? pageSize

  const lastBySpring = data.last
  const lastByCount = Array.isArray(items) && items.length < pageSizeFromServer

  const isLast = typeof lastBySpring === 'boolean' ? lastBySpring : lastByCount

  return {
    items: Array.isArray(items) ? items : [],
    nextPage: isLast ? undefined : pageParam + 1,
    hasNextPage: !isLast,
  }
}

export async function markNotificationRead(notificationId) {
  const res = await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error('알림을 읽음 처리하지 못했습니다.')
  }

  return true
}
