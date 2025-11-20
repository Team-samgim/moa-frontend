import { useEffect, useRef } from 'react'
import useNotificationList from '@/hooks/notification/useNotificationList'

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const NotificationDropdown = ({ open, onClose }) => {
  const panelRef = useRef(null)

  const {
    notifications,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    markAsRead,
  } = useNotificationList()

  // 열릴 때마다 최신 데이터 한번 리프레시
  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  // 무한 스크롤
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 40

    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleItemClick = (item) => {
    // 읽음 처리
    if (!item.isRead) {
      markAsRead(item.id)
    }

    // TODO: 해당 알림에 연결된 검색/상세 페이지로 이동시키고 싶으면 여기서 처리
    // navigate(`/search?rowKey=${item.raw.row_key}`) 같은 느낌으로

    // 알림창 닫고 싶으면 주석 해제
    // onClose?.()
  }

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className='absolute right-0 top-11 w-[360px] max-h-[480px] bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden z-[60]'
    >
      {/* 헤더 */}
      <div className='px-4 py-3 border-b border-gray-300 bg-gray-50 flex items-center justify-between'>
        <div className='text-[13px] font-semibold text-gray-800'>알림 센터</div>
        {/* 전체 읽음 처리 추가할거면 여기에 버튼 */}
      </div>

      {/* 리스트 영역 */}
      <div className='max-h-[400px] overflow-y-auto' onScroll={handleScroll}>
        {isLoading && <div className='py-8 text-center text-xs'>알림을 불러오는 중...</div>}

        {isError && <div className='py-8 text-center text-xs'>알림을 불러오지 못했습니다.</div>}

        {!isLoading && !isError && notifications.length === 0 && (
          <div className='py-10 text-center text-xs'>알림이 없습니다.</div>
        )}

        <ul className='divide-y divide-gray-100'>
          {notifications.map((n) => (
            <li
              key={n.id}
              className={[
                'px-4 py-3 text-[13px] cursor-pointer transition bg-white hover:bg-gray-50',
                !n.isRead ? 'bg-blue-50/50' : '',
              ].join(' ')}
              onClick={() => handleItemClick(n)}
            >
              <div className='flex items-start gap-2'>
                {/* 읽음 여부 점 */}
                <span
                  className={[
                    'mt-1 w-2 h-2 rounded-full flex-shrink-0',
                    !n.isRead ? 'bg-[var(--color-blue,#1c4fd7)]' : 'bg-gray-300',
                  ].join(' ')}
                />
                <div className='flex-1 min-w-0'>
                  <div
                    className={[
                      'truncate',
                      !n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700',
                    ].join(' ')}
                  >
                    {n.title}
                  </div>
                  <div className='mt-1 text-[12px] text-gray-500 line-clamp-2'>{n.content}</div>
                  <div className='mt-1 text-[11px] text-gray-400'>{formatTime(n.createdAt)}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {isFetchingNextPage && (
          <div className='py-3 text-center text-[12px] text-gray-400'>불러오는 중...</div>
        )}

        {!isFetchingNextPage && !hasNextPage && notifications.length > 0 && (
          <div className='py-3 text-center text-[11px] text-gray-400'>
            모든 알림을 확인했습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationDropdown
