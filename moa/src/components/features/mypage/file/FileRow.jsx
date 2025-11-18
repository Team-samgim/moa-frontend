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
import { CLASSES, TOKENS } from '@/constants/tokens'
import { useDeleteExport, useDownloadExport } from '@/hooks/queries/useFiles'
import { fmtDate, cx } from '@/utils/misc'
import { normalizePresetConfig } from '@/utils/presetNormalizer'
import { toSearchSpecFromConfig } from '@/utils/searchSpec'

const FileRow = ({ idx, item, onDeleted }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [queryOpen, setQueryOpen] = useState(false) // GRID 검색 조건 모달
  const [pivotOpen, setPivotOpen] = useState(false) // PIVOT 피벗 조건 모달
  const [chartOpen, setChartOpen] = useState(false) // ✅ CHART 차트 조건 모달

  const downloadMut = useDownloadExport()
  const deleteMut = useDeleteExport()

  const rawConfig = item.config || null
  const config = rawConfig ? normalizePresetConfig(rawConfig) : null

  const isChart = item.type === 'CHART'
  const rowBg = open ? 'bg-[#EEF5FE]' : 'bg-white'

  const pivotConfig =
    rawConfig?.pivot?.config ||
    rawConfig?.pivotConfig || // 혹시 다른 키로 들어오는 경우 대비
    null

  // 조회 계층 표시용 레이어 (GRID/PIVOT/CHART 모두 커버)
  const displayLayer =
    item.layer || // 백엔드에서 직접 내려주는 경우
    config?.layer || // normalizer가 올려준 경우
    config?.baseSpec?.layer || // normalizer 안에 baseSpec에 있는 경우
    rawConfig?.layer ||
    rawConfig?.baseSpec?.layer ||
    rawConfig?.search?.config?.layer ||
    rawConfig?.pivot?.config?.layer ||
    null

  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-[#D1D1D6] first:border-l last:border-r first:rounded-l-md last:rounded-r-md',
    open && 'first:rounded-bl-none last:rounded-br-none',
  )

  const handleApply = useCallback(
    (rawCfg) => {
      if (!rawCfg) {
        alert('적용할 검색/피벗 조건이 없습니다.')
        return
      }

      if (item.type === 'PIVOT') {
        // 피벗은 그대로 피벗 페이지로
        navigate(userNavigations.PIVOT, { state: { preset: rawCfg } })
      } else {
        // GRID/SEARCH는 search spec으로 변환
        const payload = toSearchSpecFromConfig(normalizePresetConfig(rawCfg))
        navigate(userNavigations.SEARCH, { state: { preset: { payload } } })
      }

      // 어떤 모달에서 눌렀든 둘 다 닫기
      setQueryOpen(false)
      setPivotOpen(false)
      // CHART는 지금은 보기용만이라 chartOpen은 여기서 안 닫음
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
      <tr className={cx('border-b', open && 'bg-[#EEF5FE]', CLASSES.ROW_H)}>
        <td className={cx(cellBoxCls, 'w-16 text-center')}>{idx}</td>

        <td className={cellBoxCls}>
          <span className='inline-block max-w-[420px] truncate align-middle' title={item.fileName}>
            {item.fileName}
          </span>
        </td>

        <td className={cellBoxCls}>
          <LayerCell layer={displayLayer} />
        </td>

        <td className={cx(cellBoxCls, 'text-gray-600')}>{fmtDate(item.createdAt)}</td>

        <td className={cx(cellBoxCls, 'w-[260px]')}>
          <div className='flex items-center justify-between'>
            <div className='inline-flex items-center gap-2'>
              <button
                className={cx(CLASSES.BTN, 'border border-[#CCCCCC]')}
                onClick={() => downloadMut.mutate(item.fileId)}
                disabled={downloadMut.isPending}
                title='다운로드'
              >
                {downloadMut.isPending ? '다운로드 중…' : '다운로드'}
              </button>

              <button
                className={cx(CLASSES.BTN_ICON, 'hover:bg-red-50 border border-[#CCCCCC]')}
                onClick={onDelete}
                title='삭제'
                aria-label='삭제'
              >
                <img src={trash} alt='' className='h-4 w-4' />
              </button>
            </div>

            <div className='pl-3 ml-3'>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? '닫기' : '열기'}
                title={open ? '닫기' : '열기'}
                className={cx(CLASSES.BTN_ICON, 'border border-[#CCCCCC]')}
              >
                <img src={open ? arrowDown : arrowLeft} alt='' className='h-4 w-4' />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {open && (
        <tr className='bg-transparent'>
          <td colSpan={5} className='pt-0 pb-3'>
            <div className='px-6 py-3 bg-white border border-[#D1D1D6] border-t-0 rounded-b-md rounded-t-none -mt-[15px] p-2'>
              {item.type === 'GRID' && <CsvPreview fileId={item.fileId} />}

              {item.type === 'PIVOT' && (
                <PivotCsvPreview fileId={item.fileId} pivotConfig={pivotConfig} />
              )}

              {isChart && <ChartPreview fileId={item.fileId} />}

              {/* GRID: 검색 조건 보기 버튼 */}
              {config && item.type === 'GRID' && (
                <div className='mt-3 flex justify-end'>
                  <button
                    className='rounded-xl border px-4 py-2 text-sm'
                    style={{
                      backgroundColor: TOKENS.BRAND,
                      color: '#FFFFFF',
                      borderColor: '#CCCCCC',
                    }}
                    onClick={() => setQueryOpen(true)}
                  >
                    검색 조건 보기
                  </button>
                </div>
              )}

              {/* PIVOT: 피벗 조건 보기 버튼 */}
              {config && item.type === 'PIVOT' && (
                <div className='mt-3 flex justify-end'>
                  <button
                    className='rounded-xl border px-4 py-2 text-sm'
                    style={{
                      backgroundColor: TOKENS.BRAND,
                      color: '#FFFFFF',
                      borderColor: '#CCCCCC',
                    }}
                    onClick={() => setPivotOpen(true)}
                  >
                    피벗 조건 보기
                  </button>
                </div>
              )}

              {/* CHART: 차트 조건 보기 버튼 ✅ */}
              {config && item.type === 'CHART' && (
                <div className='mt-3 flex justify-end'>
                  <button
                    className='rounded-xl border px-4 py-2 text-sm'
                    style={{
                      backgroundColor: TOKENS.BRAND,
                      color: '#FFFFFF',
                      borderColor: '#CCCCCC',
                    }}
                    onClick={() => setChartOpen(true)}
                  >
                    차트 조건 보기
                  </button>
                </div>
              )}
            </div>

            {/* GRID: 검색 조건 모달 (적용하기 → 검색 페이지 이동) */}
            {item.type === 'GRID' && (
              <QueryModal
                open={queryOpen}
                onClose={() => setQueryOpen(false)}
                config={item.config}
                onApply={handleApply}
              />
            )}

            {/* PIVOT: 피벗 조건 모달 (적용하기 → 피벗 페이지 이동) */}
            {item.type === 'PIVOT' && (
              <PivotConditionModal
                open={pivotOpen}
                onClose={() => setPivotOpen(false)}
                payload={item.config}
                onApply={handleApply}
              />
            )}

            {/* CHART: 차트 조건 모달 (보기용) ✅ */}
            {item.type === 'CHART' && (
              <ChartConditionModal
                open={chartOpen}
                onClose={() => setChartOpen(false)}
                config={item.config}
              />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default memo(FileRow)
