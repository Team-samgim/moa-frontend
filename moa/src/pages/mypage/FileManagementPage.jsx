/**
 * FileManagementPage
 *
 * 목적:
 * - 내보내기(Grid/Pivot/Chart)로 생성된 파일들을 조회·다운로드·삭제할 수 있는 관리 페이지
 *
 * 주요 기능:
 * - FileTabs로 GRID / PIVOT / CHART 파일 유형 전환
 * - useExportFiles 훅으로 서버에서 파일 목록 불러오기 (페이지네이션 지원)
 * - FileRow 컴포넌트에서 다운로드 / 삭제 버튼 제공
 * - Pagination 컴포넌트로 페이지 이동
 * - 검색·정렬은 없으며 단순 조회 중심
 *
 * 특징:
 * - 테이블 스타일을 border-spacing으로 카드를 띄운 듯한 UI 구성
 * - 로딩/빈 상태 UI 제공
 * - refetch를 onDeleted로 넘겨 삭제 후 자동 갱신되도록 처리
 *
 * AUTHOR: 방대혁
 */

import { useCallback, useState } from 'react'
import Pagination from '@/components/features/mypage/common/Pagination'
import FileRow from '@/components/features/mypage/file/FileRow'
import FileTabs from '@/components/features/mypage/file/FileTabs'
import { CLASSES } from '@/constants/tokens'
import { useExportFiles } from '@/hooks/queries/useFiles'
import { cx } from '@/utils/misc'

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
        <h1 className='text-[20px] font-semibold text-gray-900 mb-2'>파일 관리</h1>
        <p className='text-[15px] text-gray-600'>내보낸 파일을 확인하고 관리할 수 있습니다</p>
      </div>

      <FileTabs active={type} onChange={onTabChange} />

      <div className='overflow-x-auto rounded-xl'>
        <table className='min-w-[900px] w-full table-fixed border-separate border-spacing-y-3 border-spacing-x-0'>
          <thead>
            <tr className='bg-linear-to-r from-gray-50 to-blue-50/30 text-left text-[13px] text-gray-700'>
              <th className={['w-16', CLASSES.TH, 'first:rounded-l-lg font-semibold'].join(' ')}>
                번호
              </th>
              <th className={cx(CLASSES.TH, 'font-semibold')}>파일명</th>
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
                    <div className='text-4xl mb-3'>📁</div>
                    <p className='text-sm font-medium text-gray-600'>내보낸 파일이 없습니다.</p>
                    <p className='text-xs text-gray-500 mt-1'>새로운 파일을 내보내보세요</p>
                  </div>
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
