import { useCallback, useState } from 'react'
import Pagination from '@/components/features/mypage/common/Pagination'
import Tabs from '@/components/features/mypage/common/Tabs'
import FileRow from '@/components/features/mypage/file/FileRow'
import { CLASSES } from '@/constants/tokens'
import { useExportFiles } from '@/hooks/queries/useFiles'

const FileManagementPage = () => {
  const [type, setType] = useState('GRID') // GRID | PIVOT | CHART
  const [page, setPage] = useState(0)
  const size = 10

  const { data, isLoading, refetch } = useExportFiles({ type, page, size })
  const items = data?.items || []
  const totalPages = data?.totalPages ?? 1

  const onTabChange = useCallback((t) => {
    setType(t)
    setPage(0)
  }, [])

  return (
    <div className='mx-auto w-full max-w-[1200px] px-6 py-6'>
      <Tabs value={type} onChange={onTabChange} />

      <div className='overflow-x-auto rounded-xl border'>
        <table className='min-w-[900px] w-full table-fixed'>
          <thead>
            <tr className='border-b bg-gray-50 text-left text-[13px] text-gray-600'>
              <th className={['w-16', CLASSES.TH].join(' ')}>번호</th>
              <th className={CLASSES.TH}>파일명</th>
              <th className={CLASSES.TH}>조회 계층</th>
              <th className={CLASSES.TH}>생성일</th>
              <th className={[CLASSES.TH, 'text-left w-[260px]'].join(' ')}>작업</th>
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
                  파일이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((it, i) => (
                <FileRow
                  key={it.fileId}
                  idx={page * size + i + 1}
                  item={{ ...it, type }}
                  onDeleted={refetch}
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

export default FileManagementPage
