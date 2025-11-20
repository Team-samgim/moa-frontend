import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, markNotificationRead } from '@/api/notificationApi'

const QUERY_KEY = ['notifications']

const normalizeNotification = (n) => ({
  id: n.notification_id ?? n.id,
  title: n.title,
  content: n.content,
  isRead: n.is_read ?? n.isRead ?? false,
  createdAt: n.created_at ?? n.createdAt,
  raw: n,
})

const useNotificationList = () => {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ pageParam = 0 }) => fetchNotifications({ pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPage : undefined),
  })

  const mutation = useMutation({
    mutationFn: (notificationId) => markNotificationRead(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(QUERY_KEY, (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            items: page.items.map((n) =>
              (n.notification_id ?? n.id) === notificationId
                ? { ...n, is_read: true, isRead: true }
                : n,
            ),
          })),
        }
      })
    },
  })

  const notifications = query.data?.pages.flatMap((p) => p.items.map(normalizeNotification)) ?? []

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return {
    notifications,
    unreadCount,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    markAsRead: mutation.mutate,
  }
}

export default useNotificationList
