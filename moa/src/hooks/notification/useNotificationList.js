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

// 안 읽은 개수 - 캐시 설정 조정
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const count = await fetchUnreadCount()
      console.log('📊 [useUnreadNotificationCount] Fetched count:', count, typeof count)
      return count
    },
    staleTime: 5 * 1000, // 5초로 줄임
    gcTime: 10 * 1000, // 10초 (구 cacheTime)
    refetchInterval: 30 * 1000,
    refetchOnMount: true, // 마운트 시 항상 refetch
    refetchOnWindowFocus: true, // 포커스 시 refetch
  })
}

// 단건 읽음 처리
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (notificationId) => {
      // Optimistic update 전에 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY })

      // 현재 값 백업
      const previousCount = queryClient.getQueryData(UNREAD_COUNT_KEY)

      console.log('🔄 [markAsRead] Starting optimistic update:', {
        notificationId,
        previousCount,
      })

      // Optimistic update
      queryClient.setQueryData(UNREAD_COUNT_KEY, (old) => {
        const current = old ?? 0
        const newCount = current > 0 ? current - 1 : 0
        console.log('📉 [markAsRead] Count:', current, '→', newCount)
        return newCount
      })

      return { previousCount }
    },
    onSuccess: (_, notificationId) => {
      console.log('✅ [markAsRead] Success:', notificationId)

      // 리스트 캐시 업데이트
      queryClient.setQueryData(NOTIFICATION_LIST_KEY, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === notificationId ? { ...item, isRead: true } : item,
            ),
            unreadCount:
              page === oldData.pages[0] && page.unreadCount > 0
                ? page.unreadCount - 1
                : page.unreadCount,
          })),
        }
      })

      // 서버와 동기화
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
    onError: (error, notificationId, context) => {
      console.error('❌ [markAsRead] Error:', error)

      // Optimistic update 롤백
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount)
      }
    },
  })
}

// 전체 읽음 처리
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY })

      const previousCount = queryClient.getQueryData(UNREAD_COUNT_KEY)

      console.log('🔄 [markAllAsRead] Starting optimistic update')

      // Optimistic update
      queryClient.setQueryData(UNREAD_COUNT_KEY, 0)

      return { previousCount }
    },
    onSuccess: () => {
      console.log('✅ [markAllAsRead] Success')

      queryClient.setQueryData(NOTIFICATION_LIST_KEY, (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => ({ ...item, isRead: true })),
            unreadCount: 0,
          })),
        }
      })

      // 서버와 동기화
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },
    onError: (error, _, context) => {
      console.error('❌ [markAllAsRead] Error:', error)

      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount)
      }
    },
  })
}

/**
 * 🔔 NotificationDropdown 전용 래퍼 훅
 */
export function useNotificationList(pageSize = 20) {
  const infiniteQuery = useNotificationInfinite(pageSize)
  const { mutate: mutateMarkRead } = useMarkNotificationRead()

  const notifications = infiniteQuery.data?.pages.flatMap((page) => page.items) ?? []
  const unreadCount = infiniteQuery.data?.pages[0]?.unreadCount ?? 0

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
    unreadCount,
  }
}

export default useNotificationList
