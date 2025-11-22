import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Pagination from '@/components/features/mypage/common/Pagination'
import PresetRow from '@/components/features/mypage/preset/PresetRow'
import PresetTabs from '@/components/features/mypage/preset/PresetTabs'
import { userNavigations } from '@/constants/navigations'
import { CLASSES } from '@/constants/tokens'
import { useMyPresets, useToggleFavoritePreset, useDeletePreset } from '@/hooks/queries/useMyPage'
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
        //    toSearchSpecFromConfig로 spec으로 변환
        navigate(routeMap.SEARCH, {
          state: { preset: p.config }, // ← 여기!
        })
      } else {
        // PIVOT 프리셋은 기존대로 (원하면 따로 유틸 만들어도 됨)
        navigate(routeMap.PIVOT, {
          state: { preset: p.config },
        })
      }
    },
    [navigate],
  )

  return (
    <div className='mx-auto w-full max-w-[1200px] px-6 py-6'>
      <PresetTabs
        active={type}
        onChange={(t) => {
          setType(t)
          setPage(0)
        }}
      />

      <div className='overflow-x-auto rounded-xl'>
        <table className='min-w-[900px] w-full table-fixed border-separate border-spacing-y-[15px] border-spacing-x-0'>
          <thead>
            <tr className='bg-[#F5F5F7] text-left text-[13px] text-gray-600'>
              <th className={['w-16', CLASSES.TH, 'first:rounded-l-md'].join(' ')}></th>
              <th className={CLASSES.TH}>프리셋 이름</th>
              <th className={CLASSES.TH}>조회 계층</th>
              <th className={CLASSES.TH}>생성일</th>
              <th className={[CLASSES.TH, 'last:rounded-r-md text-left w-[260px]'].join(' ')}>
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-sm text-gray-500'>
                  불러오는 중…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-sm text-gray-500'>
                  저장된 프리셋이 없습니다.
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
