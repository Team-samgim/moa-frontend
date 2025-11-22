// PresetPage.jsx
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pagination from '@/components/features/mypage/common/Pagination'
import PresetRow from '@/components/features/mypage/preset/PresetRow'
import PresetTabs from '@/components/features/mypage/preset/PresetTabs'
import { userNavigations } from '@/constants/navigations'
import { CLASSES } from '@/constants/tokens'
import { useMyPresets, useToggleFavoritePreset, useDeletePreset } from '@/hooks/queries/useMyPage'
import { cx } from '@/utils/misc'
import { normalizePresetConfig } from '@/utils/presetNormalizer'

const PresetPage = () => {
  const [type, setType] = useState('SEARCH')
  const [page, setPage] = useState(0)
  const size = 10
  const navigate = useNavigate()

  const apiType = type === 'SEARCH' ? 'SEARCH' : 'PIVOT'
  const { data, isLoading } = useMyPresets({
    page,
    size,
    type: apiType,
    origin: 'USER',
  })
  const favMut = useToggleFavoritePreset()
  const delMut = useDeletePreset()

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
    const normalized = list.map((p) => ({ ...p, config: normalizePresetConfig(p.config || {}) }))
    return normalized.sort(sortByFavThenDate)
  }, [data, sortByFavThenDate])

  const totalPages = useMemo(
    () =>
      (typeof data?.totalPages === 'number' && data.totalPages) ||
      (typeof data?.total === 'number' && Math.max(1, Math.ceil(data.total / size))) ||
      1,
    [data?.totalPages, data?.total],
  )

  const onFav = useCallback(
    async (p) => {
      try {
        await favMut.mutateAsync({ presetId: p.presetId, favorite: !p.favorite })
      } catch (e) {
        console.error(e)
        alert('즐겨찾기 변경 중 오류가 발생했습니다.')
      }
    },
    [favMut],
  )

  const onDelete = useCallback(
    async (p) => {
      if (!confirm('삭제하시겠습니까?')) return
      try {
        await delMut.mutateAsync(p.presetId)
      } catch (e) {
        console.error(e)
        alert('삭제 중 오류가 발생했습니다.')
      }
    },
    [delMut],
  )

  const onApply = useCallback(
    (p) => {
      const routeMap = { SEARCH: userNavigations.SEARCH, PIVOT: userNavigations.PIVOT }
      if (p.presetType === 'SEARCH') {
        navigate(routeMap.SEARCH, {
          state: { preset: p.config },
        })
      } else {
        navigate(routeMap.PIVOT, {
          state: { preset: p.config },
        })
      }
    },
    [navigate],
  )

  return (
    <div className='mx-auto w-full max-w-[1200px] px-6 py-8'>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes expandHeight {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 1000px;
            opacity: 1;
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      {/* 헤더 */}
      <div className='mb-8'>
        <h1 className='text-[20px] font-semibold text-gray-900 mb-2'>프리셋 관리</h1>
        <p className='text-[15px] text-gray-600'>저장된 프리셋을 확인하고 관리할 수 있습니다</p>
      </div>

      <PresetTabs
        active={type}
        onChange={(t) => {
          setType(t)
          setPage(0)
        }}
      />

      <div className='overflow-x-auto rounded-xl'>
        <table className='min-w-[900px] w-full table-fixed border-separate border-spacing-y-3 border-spacing-x-0'>
          <thead>
            <tr className='bg-linear-to-r from-gray-50 to-blue-50/30 text-left text-[13px] text-gray-700'>
              <th
                className={['w-16', CLASSES.TH, 'first:rounded-l-lg font-semibold'].join(' ')}
              ></th>
              <th className={cx(CLASSES.TH, 'font-semibold')}>프리셋 이름</th>
              <th className={cx(CLASSES.TH, 'font-semibold')}>조회 계층</th>
              <th className={cx(CLASSES.TH, 'font-semibold')}>생성일</th>
              <th
                className={[CLASSES.TH, 'last:rounded-r-lg text-left w-[260px] font-semibold'].join(
                  ' ',
                )}
              >
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-4 py-12 text-center'>
                  <div className='inline-flex items-center gap-2 text-blue-600'>
                    <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
                    <span className='text-sm font-medium'>불러오는 중…</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-12 text-center'>
                  <div className='text-gray-400'>
                    <div className='text-4xl mb-3'>📋</div>
                    <p className='text-sm font-medium text-gray-600'>저장된 프리셋이 없습니다.</p>
                    <p className='text-xs text-gray-500 mt-1'>새로운 프리셋을 만들어보세요</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((p, i) => (
                <PresetRow
                  key={p.presetId}
                  p={{ ...p, rowNo: page * size + i + 1 }}
                  onFav={onFav}
                  onDelete={onDelete}
                  onApply={onApply}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}

export default PresetPage
