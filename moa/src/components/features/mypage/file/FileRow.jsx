/**
 * FileRow
 *
 * 마이페이지의 "내보낸 파일 목록" 테이블에서 각 파일(row)을 렌더링하는 컴포넌트.
 * 파일 정보, 타입(GRID, PIVOT, CHART)에 따라 준비된 미리보기 UI와 조건 모달을 함께 제공한다.
 *
 * 주요 구성:
 * 1) 테이블 요약 행
 *    - 파일명, 레이어, 생성일, 다운로드/삭제 버튼, 확장(토글) 버튼
 *
 * 2) 확장 영역(토글 오픈 시)
 *    - GRID: CSV 미리보기 + 검색 조건 보기 버튼
 *    - PIVOT: Pivot CSV 미리보기 + 피벗 조건 보기 버튼
 *    - CHART: 이미지 미리보기 + 차트 조건 보기 버튼
 *
 * 3) 조건 모달
 *    - GRID → QueryModal
 *    - PIVOT → PivotConditionModal
 *    - CHART → ChartConditionModal
 *
 * Props:
 * - idx: 행 번호(표시용)
 * - item: 서버에서 전달된 파일 메타데이터와 config
 * - onDeleted: 삭제 후 부모 컴포넌트에 갱신 요청 콜백
 *
 * 기타 특징:
 * - normalizePresetConfig로 OLD/NEW config 구조를 통합 처리
 * - Hover, open 상태에 따라 border/배경/animation 효과 적용
 * - useDownloadExport, useDeleteExport로 다운로드/삭제 핸들링
 *
 * AUTHOR: 방대혁
 */

import { memo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import arrowDown from '@/assets/icons/arrow-down-bold.svg'
import arrowLeft from '@/assets/icons/arrow-left.svg'
import trash from '@/assets/icons/trash.svg'
import LayerCell from '@/components/features/mypage/common/LayerCell'
import ChartConditionModal from '@/components/features/mypage/file/ChartConditionModal'
import ChartPreview from '@/components/features/mypage/file/ChartPreview'
import CsvPreview from '@/components/features/mypage/file/CsvPreview'
import PivotConditionModal from '@/components/features/mypage/file/PivotConditionModal'
import PivotCsvPreview from '@/components/features/mypage/file/PivotCsvPreview'
import QueryModal from '@/components/features/mypage/file/QueryModal'
import { userNavigations } from '@/constants/navigations'
import { CLASSES } from '@/constants/tokens'
import { useDeleteExport, useDownloadExport } from '@/hooks/queries/useFiles'
import { fmtDate, cx } from '@/utils/misc'
import { normalizePresetConfig } from '@/utils/presetNormalizer'
import { toSearchSpecFromConfig } from '@/utils/searchSpec'

const FileRow = ({ idx, item, onDeleted }) => {
  const navigate = useNavigate()

  // 확장/hover/모달 상태 관리
  const [open, setOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [queryOpen, setQueryOpen] = useState(false)
  const [pivotOpen, setPivotOpen] = useState(false)
  const [chartOpen, setChartOpen] = useState(false)

  // 파일 다운로드/삭제 API 훅
  const downloadMut = useDownloadExport()
  const deleteMut = useDeleteExport()

  // config normalize (old/new 하위 구조 호환)
  const rawConfig = item.config || null
  const config = rawConfig ? normalizePresetConfig(rawConfig) : null

  const isChart = item.type === 'CHART'
  const rowBg = open ? 'bg-gradient-to-r from-blue-50/50 to-blue-50/30' : 'bg-white'

  // Pivot config fallback
  const pivotConfig = rawConfig?.pivot?.config || rawConfig?.pivotConfig || null

  // 표시용 레이어 (GRID/PIVOT/CHART 공통, 가능한 모든 위치에서 fallback)
  const displayLayer =
    item.layer ||
    config?.layer ||
    config?.baseSpec?.layer ||
    rawConfig?.layer ||
    rawConfig?.baseSpec?.layer ||
    rawConfig?.search?.config?.layer ||
    rawConfig?.pivot?.config?.layer ||
    null

  // 셀 박스 공통 클래스
  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-gray-200/70 first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
    'transition-all duration-300',
    isHovered && !open && 'border-blue-200/50',
    open && 'first:rounded-bl-none last:rounded-br-none',
  )

  /**
   * 저장된 검색/피벗 조건을 기반으로 Search/Pivot 페이지로 이동.
   */
  const handleApply = useCallback(
    (rawCfg) => {
      if (!rawCfg) {
        alert('적용할 검색/피벗 조건이 없습니다.')
        return
      }

      if (item.type === 'PIVOT') {
        navigate(userNavigations.PIVOT, { state: { preset: rawCfg } })
      } else {
        const payload = toSearchSpecFromConfig(normalizePresetConfig(rawCfg))
        navigate(userNavigations.SEARCH, { state: { preset: { payload } } })
      }

      setQueryOpen(false)
      setPivotOpen(false)
    },
    [item.type, navigate],
  )

  /**
   * 삭제 처리
   */
  const onDelete = useCallback(async () => {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await deleteMut.mutateAsync(item.fileId)
      onDeleted?.()
    } catch (e) {
      console.error(e)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }, [deleteMut, item.fileId, onDeleted])

  return (
    <>
      {/* 요약 테이블 행 */}
      <tr
        className={cx(
          rowBg,
          CLASSES.ROW_H,
          'transition-all duration-300',
          'border border-gray-200/70 rounded-lg',
          isHovered && !open && 'shadow-md border-blue-200/50',
          open && 'rounded-b-none shadow-md',
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* INDEX 번호 */}
        <td className={cx(cellBoxCls, 'w-16 text-center')}>
          <span className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium'>
            {idx}
          </span>
        </td>

        {/* 파일명 */}
        <td className={cellBoxCls}>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-gray-800 truncate' title={item.fileName}>
              {item.fileName}
            </span>
          </div>
        </td>

        {/* 레이어 */}
        <td className={cellBoxCls}>
          <LayerCell layer={displayLayer} />
        </td>

        {/* 생성일 */}
        <td className={cx(cellBoxCls, 'text-gray-600 text-sm')}>{fmtDate(item.createdAt)}</td>

        {/* 다운로드 / 삭제 / 확장 토글 */}
        <td className={cellBoxCls}>
          <div className='flex items-center justify-between'>
            {/* 다운로드 / 삭제 */}
            <div className='inline-flex items-center gap-2'>
              <button
                onClick={() => downloadMut.mutate(item.fileId)}
                disabled={downloadMut.isPending}
                className={cx(
                  CLASSES.BTN,
                  'bg-white hover:bg-[#30308a] border border-gray-300',
                  'transition-all duration-200 font-medium',
                )}
              >
                {downloadMut.isPending ? '다운로드 중…' : '다운로드'}
              </button>

              <button
                onClick={onDelete}
                aria-label='삭제'
                title='삭제'
                className={cx(
                  CLASSES.BTN_ICON,
                  'bg-white border border-gray-300',
                  'transition-all duration-200 group',
                )}
              >
                <img
                  src={trash}
                  alt=''
                  className='h-4 w-4 transition-transform duration-200 group-hover:scale-110'
                />
              </button>
            </div>

            {/* 확장/축소 버튼 */}
            <div className='pl-3 ml-3 border-l border-gray-200'>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? '닫기' : '열기'}
                title={open ? '닫기' : '열기'}
                className={cx(
                  CLASSES.BTN_ICON,
                  'bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue',
                  'transition-all duration-200 shadow-sm',
                  open && 'bg-blue-50 border-blue',
                )}
              >
                <img
                  src={open ? arrowDown : arrowLeft}
                  alt=''
                  className={cx(
                    'h-4 w-4 transition-transform duration-300',
                    open && 'rotate-0',
                    !open && 'rotate-0',
                  )}
                />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {/* 확장 영역 */}
      <tr className='bg-transparent'>
        <td colSpan={5} className='pt-0'>
          <div
            className={cx(
              'bg-white border-x border-b border-gray-200/70 rounded-b-lg -mt-[15px] shadow-md overflow-hidden',
              'transition-all duration-300 ease-in-out',
              open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <div className='p-6 bg-linear-to-b from-blue-50/30 to-white'>
              {/* 파일 타입별 미리보기 */}
              {item.type === 'GRID' && <CsvPreview fileId={item.fileId} />}
              {item.type === 'PIVOT' && (
                <PivotCsvPreview fileId={item.fileId} pivotConfig={pivotConfig} />
              )}
              {isChart && <ChartPreview fileId={item.fileId} />}

              {/* 조건 보기 버튼(GRID/PIVOT/CHART 공통) */}
              {config && item.type === 'GRID' && (
                <div className='mt-4 flex justify-end'>
                  <button
                    className='rounded-lg border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200'
                    onClick={() => setQueryOpen(true)}
                  >
                    검색 조건 보기
                  </button>
                </div>
              )}

              {config && item.type === 'PIVOT' && (
                <div className='mt-4 flex justify-end'>
                  <button
                    className='rounded-lg border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200'
                    onClick={() => setPivotOpen(true)}
                  >
                    피벗 조건 보기
                  </button>
                </div>
              )}

              {config && item.type === 'CHART' && (
                <div className='mt-4 flex justify-end'>
                  <button
                    className='rounded-lg border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200'
                    onClick={() => setChartOpen(true)}
                  >
                    차트 조건 보기
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* 조건 모달 */}
      {item.type === 'GRID' && (
        <QueryModal
          open={queryOpen}
          onClose={() => setQueryOpen(false)}
          config={item.config}
          onApply={handleApply}
        />
      )}

      {item.type === 'PIVOT' && (
        <PivotConditionModal
          open={pivotOpen}
          onClose={() => setPivotOpen(false)}
          payload={item.config}
          onApply={handleApply}
        />
      )}

      {item.type === 'CHART' && (
        <ChartConditionModal
          open={chartOpen}
          onClose={() => setChartOpen(false)}
          config={item.config}
        />
      )}
    </>
  )
}

export default memo(FileRow)
