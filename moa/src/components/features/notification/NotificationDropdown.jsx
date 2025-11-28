/**
 * NotificationDropdown
 *
 * 알림 센터 드롭다운 컴포넌트.
 * - 알림 목록 조회 (무한 스크롤)
 * - 읽음 처리
 * - 외부 클릭 시 닫힘
 * - 열릴 때마다 refetch로 최신 상태 유지
 *
 * AUTHOR: 방대혁
 */

import { useEffect, useRef } from 'react'
import useNotificationList from '@/hooks/notification/useNotificationList'

// 시간 포맷터
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

  // 알림 비동기 데이터 훅
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

  /**
   * 드롭다운 열릴 때마다 최신 알림 다시 요청
   */
  useEffect(() => {
    if (open) {
      refetch()
    }
  }, [open, refetch])

  /**
   * 드롭다운 외부 클릭 → 닫힘 처리
   */
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

  /**
   * 리스트 하단 근처 스크롤 시 → 다음 페이지 로드
   */
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 40

    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  /**
   * 알림 클릭 → 읽음 처리 + 필요 시 이동 로직 추가 가능
   */
  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id)
    }

    // TODO: 알림 연결 페이지 이동 가능
    // navigate(`/search?rowKey=${item.raw.row_key}`)

    // 드롭다운 닫고 싶으면:
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
        <div className='flex items-center gap-2'>
          <div className='text-[13px] font-semibold text-gray-800'>알림 센터</div>
        </div>
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
                {/* 읽음 여부 표시 점 */}
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

        {/* 로딩 / 마지막 페이지 */}
        {isFetchingNextPage && (
          <div className='py-3 text-center text-[12px] text-gray-400'>불러오는 중...</div>
        )}

        {!isFetchingNextPage && !hasNextPage && notifications.length > 0 && (
          <div className='py-3 text-center text-[11px] text-gray-400'>
            모든 알림을 불러왔습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationDropdown
