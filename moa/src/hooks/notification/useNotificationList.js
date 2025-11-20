import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchUnreadCount,
} from '@/api/notification'

const NOTIFICATION_LIST_KEY = ['notifications', 'list']
const UNREAD_COUNT_KEY = ['notifications', 'unreadCount']

// 무한스크롤 목록
export function useNotificationInfinite(size = 20) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_LIST_KEY,
    queryFn: ({ pageParam = null }) => fetchNotifications({ pageParam, pageSize: size }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextCursor : undefined),
  })
}

// 안 읽은 개수
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: fetchUnreadCount,
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  })
}

// 단건 읽음 처리
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_, notificationId) => {
      // 리스트 캐시에서 해당 알림 isRead = true 로 바꾸기
      queryClient.setQueryData(NOTIFICATION_LIST_KEY, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === notificationId ? { ...item, isRead: true } : item,
            ),
          })),
        }
      })

      // 안 읽은 개수 다시 가져오기
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

// 전체 읽음 처리
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(NOTIFICATION_LIST_KEY, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => ({ ...item, isRead: true })),
          })),
        }
      })

      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
  })
}

/**
 * 🔔 NotificationDropdown 전용 래퍼 훅
 * - 플랫한 notifications 배열
 * - 읽음 처리 함수(markAsRead)
 * - 무한스크롤 관련 값들 한 번에 반환
 */
export function useNotificationList(pageSize = 20) {
  const infiniteQuery = useNotificationInfinite(pageSize)
  const { mutate: mutateMarkRead } = useMarkNotificationRead()

  const notifications = infiniteQuery.data?.pages.flatMap((page) => page.items) ?? []

  const markAsRead = (id) => {
    mutateMarkRead(id)
  }

  return {
    notifications,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    refetch: infiniteQuery.refetch,
    markAsRead,
  }
}

export default useNotificationList
