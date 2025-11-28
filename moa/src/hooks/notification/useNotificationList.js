/**
 * Notification Hooks
 *
 * 알림(Notifications) 관련 React Query 기반 훅 모음.
 * - 무한 스크롤 목록(useNotificationInfinite)
 * - 안 읽은 알림 개수(useUnreadNotificationCount)
 * - 단건 읽음 처리(useMarkNotificationRead)
 * - 전체 읽음 처리(useMarkAllNotificationsRead)
 * - NotificationDropdown 전용 통합 훅(useNotificationList)
 *
 * AUTHOR: 방대혁
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  fetchUnreadCount,
} from '@/api/notification'

/** 캐싱 Key 정의 */
const NOTIFICATION_LIST_KEY = ['notifications', 'list']
const UNREAD_COUNT_KEY = ['notifications', 'unreadCount']

/**
 * useNotificationInfinite
 *
 * 무한스크롤 기반 알림 목록 조회 훅.
 * - pageParam을 nextCursor로 이어받는 구조
 * - TanStack Query의 useInfiniteQuery 사용
 *
 * @param {number} size - 페이지 당 아이템 수
 * @returns useInfiniteQuery 결과
 *
 * AUTHOR: 방대혁
 */
export function useNotificationInfinite(size = 20) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_LIST_KEY,
    queryFn: ({ pageParam = null }) => fetchNotifications({ pageParam, pageSize: size }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextCursor : undefined),
  })
}

/**
 * useUnreadNotificationCount
 *
 * 안 읽은 알림 개수 조회 훅.
 * - staleTime: 5초
 * - refetchInterval: 30초
 * - 포커스/마운트 시에도 refetch
 *
 * @returns useQuery 결과
 *
 * AUTHOR: 방대혁
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const count = await fetchUnreadCount()
      return count
    },
    staleTime: 5000,
    gcTime: 10000,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

/**
 * useMarkNotificationRead
 *
 * 단일 알림 읽음 처리 훅.
 * - Optimistic Update 적용
 * - 실패 시 롤백
 *
 * @returns useMutation 결과
 *
 * AUTHOR: 방대혁
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY })

      const previousCount = queryClient.getQueryData(UNREAD_COUNT_KEY)

      // 낙관적 업데이트
      queryClient.setQueryData(UNREAD_COUNT_KEY, (old) => {
        const current = old ?? 0
        return current > 0 ? current - 1 : 0
      })

      return { previousCount }
    },

    onSuccess: (_, notificationId) => {
      // 목록 캐시 업데이트
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

      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },

    onError: (_, __, context) => {
      // 롤백
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount)
      }
    },
  })
}

/**
 * useMarkAllNotificationsRead
 *
 * 전체 알림 읽음 처리 훅.
 * - Optimistic Update + invalidateQueries
 *
 * @returns useMutation 결과
 *
 * AUTHOR: 방대혁
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsRead,

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY })
      const previousCount = queryClient.getQueryData(UNREAD_COUNT_KEY)

      queryClient.setQueryData(UNREAD_COUNT_KEY, 0)
      return { previousCount }
    },

    onSuccess: () => {
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

      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
    },

    onError: (_, __, context) => {
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount)
      }
    },
  })
}

/**
 * useNotificationList
 *
 * NotificationDropdown 전용 통합 훅.
 *
 * 포함 기능:
 * - 무한스크롤 목록
 * - 단건 읽음 처리
 * - unreadCount 제공
 *
 * @param {number} pageSize
 * @returns Object
 *
 * AUTHOR: 방대혁
 */
export function useNotificationList(pageSize = 20) {
  const infiniteQuery = useNotificationInfinite(pageSize)
  const { mutate: mutateMarkRead } = useMarkNotificationRead()

  const notifications = infiniteQuery.data?.pages.flatMap((page) => page.items) ?? []
  const unreadCount = infiniteQuery.data?.pages[0]?.unreadCount ?? 0

  const markAsRead = (id) => mutateMarkRead(id)

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
