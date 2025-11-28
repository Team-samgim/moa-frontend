/**
 * CsvPreview
 *
 * 서버에서 export된 CSV 파일의 일부(row limit)를 미리보기로 표시하는 컴포넌트.
 * PreviewGrid 컴포넌트에 rows/columns를 전달하여 테이블 형태로 렌더링한다.
 *
 * 동작:
 * - fileId 기반으로 useExportPreview 훅을 호출해 rows/columns 조회
 * - limit=20으로 CSV 일부만 로드하여 빠르게 미리보기
 * - columns는 data.columns 우선, 없으면 rows[0]의 key 목록으로 자동 생성
 *
 * 상태 처리:
 * - isLoading: 로딩 UI 표시
 * - rows.length === 0: 데이터 없음 메시지 표시
 * - rows 존재: PreviewGrid 렌더링
 *
 * Props:
 * - fileId: 서버에 저장된 CSV 파일 ID
 *
 * 최적화:
 * - useMemo로 columns 계산 최소화
 * - React.memo로 리렌더링 방지
 *
 * AUTHOR: 방대혁
 */

import { memo, useMemo } from 'react'
import PreviewGrid from '@/components/features/mypage/file/PreviewGrid'
import { useExportPreview } from '@/hooks/queries/useFiles'

const CsvPreview = ({ fileId }) => {
  // 데이터 조회 (fileId가 있을 때만 요청)
  const { data, isLoading } = useExportPreview({ fileId, limit: 20, enabled: !!fileId })

  const rows = data?.rows || []

  // columns 정의: data.columns → rows[0] → []
  const columns = useMemo(() => {
    if (Array.isArray(data?.columns) && data.columns.length) return data.columns
    if (rows.length) return Object.keys(rows[0])
    return []
  }, [data, rows])

  return (
    <div>
      {/* 헤더 */}
      <div className='px-4 py-3 text-[16px] font-semibold text-gray-800'>CSV 미리보기</div>

      {/* 로딩 상태 */}
      {isLoading ? (
        <div className='px-4 py-12 text-center'>
          <div className='inline-flex items-center gap-2 text-blue-600'>
            <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            <span className='text-sm font-medium'>불러오는 중…</span>
          </div>
        </div>
      ) : rows.length === 0 ? (
        // 데이터 없는 상태
        <div className='px-4 py-12 text-center'>
          <div className='text-gray-400'>
            <div className='text-4xl mb-3'>📄</div>
            <p className='text-sm font-medium text-gray-600'>데이터가 없습니다.</p>
          </div>
        </div>
      ) : (
        // 정상 데이터 렌더링
        <PreviewGrid rows={rows} columns={columns} height={360} />
      )}
    </div>
  )
}

export default memo(CsvPreview)
