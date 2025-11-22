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
  const [open, setOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [queryOpen, setQueryOpen] = useState(false) // GRID 검색 조건 모달
  const [pivotOpen, setPivotOpen] = useState(false) // PIVOT 피벗 조건 모달
  const [chartOpen, setChartOpen] = useState(false) // CHART 차트 조건 모달

  const downloadMut = useDownloadExport()
  const deleteMut = useDeleteExport()

  const rawConfig = item.config || null
  const config = rawConfig ? normalizePresetConfig(rawConfig) : null

  const isChart = item.type === 'CHART'
  const rowBg = open ? 'bg-gradient-to-r from-blue-50/50 to-blue-50/30' : 'bg-white'

  const pivotConfig = rawConfig?.pivot?.config || rawConfig?.pivotConfig || null

  // 조회 계층 표시용 레이어 (GRID/PIVOT/CHART 모두 커버)
  const displayLayer =
    item.layer ||
    config?.layer ||
    config?.baseSpec?.layer ||
    rawConfig?.layer ||
    rawConfig?.baseSpec?.layer ||
    rawConfig?.search?.config?.layer ||
    rawConfig?.pivot?.config?.layer ||
    null

  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-gray-200/70 first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
    'transition-all duration-300',
    isHovered && !open && 'border-blue-200/50',
    open && 'first:rounded-bl-none last:rounded-br-none',
  )

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
        <td className={cx(cellBoxCls, 'w-16 text-center')}>
          <span className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium'>
            {idx}
          </span>
        </td>

        <td className={cellBoxCls}>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-gray-800 truncate' title={item.fileName}>
              {item.fileName}
            </span>
          </div>
        </td>

        <td className={cellBoxCls}>
          <LayerCell layer={displayLayer} />
        </td>

        <td className={cx(cellBoxCls, 'text-gray-600 text-sm')}>{fmtDate(item.createdAt)}</td>

        <td className={cellBoxCls}>
          <div className='flex items-center justify-between'>
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
              {item.type === 'GRID' && <CsvPreview fileId={item.fileId} />}

              {item.type === 'PIVOT' && (
                <PivotCsvPreview fileId={item.fileId} pivotConfig={pivotConfig} />
              )}

              {isChart && <ChartPreview fileId={item.fileId} />}

              {/* GRID: 검색 조건 보기 버튼 */}
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

              {/* PIVOT: 피벗 조건 보기 버튼 */}
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

              {/* CHART: 차트 조건 보기 버튼 */}
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

      {/* GRID: 검색 조건 모달 */}
      {item.type === 'GRID' && (
        <QueryModal
          open={queryOpen}
          onClose={() => setQueryOpen(false)}
          config={item.config}
          onApply={handleApply}
        />
      )}

      {/* PIVOT: 피벗 조건 모달 */}
      {item.type === 'PIVOT' && (
        <PivotConditionModal
          open={pivotOpen}
          onClose={() => setPivotOpen(false)}
          payload={item.config}
          onApply={handleApply}
        />
      )}

      {/* CHART: 차트 조건 모달 */}
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
