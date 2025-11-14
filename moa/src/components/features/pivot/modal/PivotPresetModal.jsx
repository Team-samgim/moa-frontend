import { useCallback, useMemo, useState } from 'react'
import Pagination from '@/components/features/mypage/common/Pagination'
import { CLASSES } from '@/constants/tokens'
import { useMyPresets } from '@/hooks/queries/useMyPage'
import { normalizePresetConfig } from '@/utils/presetNormalizer'

const PivotPresetModal = ({ onClose, onSelect }) => {
  const [page, setPage] = useState(0)
  const size = 10

  const { data, isLoading } = useMyPresets({ page, size, type: 'PIVOT', origin: 'USER' })

  const tsOf = useCallback((row) => {
    const s = row?.createdAt || row?.created_at || row?.updatedAt || row?.updated_at
    return s ? new Date(s).getTime() : 0
  }, [])

  const sortByFavThenDate = useCallback(
    (a, b) => {
      if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1
      const diff = tsOf(b) - tsOf(a)
      if (diff) return diff
      return (a.presetName || '').localeCompare(b.presetName || '')
    },
    [tsOf],
  )

  const items = useMemo(() => {
    const list = data?.items || []
    const normalized = list.map((p) => ({
      ...p,
      config: normalizePresetConfig(p.config || {}),
    }))
    return normalized.sort(sortByFavThenDate)
  }, [data, sortByFavThenDate])

  const totalPages = useMemo(
    () =>
      (typeof data?.totalPages === 'number' && data.totalPages) ||
      (typeof data?.totalItems === 'number' && Math.max(1, Math.ceil(data.totalItems / size))) ||
      1,
    [data?.totalPages, data?.totalItems],
  )

  const formatDateTime = (s) => {
    if (!s) return '-'
    try {
      return new Date(s).toLocaleString()
    } catch {
      return s
    }
  }

  const handleSelect = (p) => {
    if (onSelect) onSelect(p)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='w-full max-w-4xl rounded-xl bg-white shadow-xl flex flex-col max-h-[80vh]'>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-5 py-3'>
          <h2 className='text-base font-semibold text-gray-900'>피벗 프리셋 불러오기</h2>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-sm'
          >
            ✕
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className='flex-1 overflow-auto px-5 py-4'>
          <table className='min-w-full table-fixed border-separate border-spacing-y-[8px] border-spacing-x-0'>
            <thead>
              <tr className='bg-[#F5F5F7] text-left text-[13px] text-gray-600'>
                <th className={['w-12', CLASSES.TH, 'first:rounded-l-md'].join(' ')}>No.</th>
                <th className={CLASSES.TH}>프리셋 이름</th>
                <th className={CLASSES.TH}>레이어</th>
                <th className={CLASSES.TH}>생성일</th>
                <th className={[CLASSES.TH, 'last:rounded-r-md w-[120px] text-center'].join(' ')}>
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-8 text-center text-sm text-gray-500 bg-white rounded-md'
                  >
                    불러오는 중…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-8 text-center text-sm text-gray-500 bg-white rounded-md'
                  >
                    저장된 피벗 프리셋이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((p, idx) => (
                  <tr key={p.presetId}>
                    <td className='px-3 py-2 text-center align-middle text-xs text-gray-600'>
                      {page * size + idx + 1}
                    </td>
                    <td className='px-3 py-2 text-sm text-gray-900 whitespace-nowrap bg-white rounded-l-md'>
                      {p.presetName}
                    </td>
                    <td className='px-3 py-2 text-xs text-gray-700 bg-white'>
                      {p.config?.pivot?.config?.layer || '-'}
                    </td>
                    <td className='px-3 py-2 text-xs text-gray-600 bg-white'>
                      {formatDateTime(p.createdAt || p.created_at)}
                    </td>
                    <td className='px-3 py-2 text-center bg-white rounded-r-md'>
                      <button
                        type='button'
                        onClick={() => handleSelect(p)}
                        className='inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50'
                      >
                        적용
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className='border-t border-gray-200 px-5 py-3'>
          <div className='flex items-center justify-between text-xs text-gray-500 mb-2'>
            <span>
              총{' '}
              <span className='font-semibold'>
                {typeof data?.totalItems === 'number'
                  ? data.totalItems.toLocaleString()
                  : data?.items?.length || 0}
              </span>{' '}
              개
            </span>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

export default PivotPresetModal
