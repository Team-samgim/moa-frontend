import { memo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import arrowDown from '@/assets/icons/arrow-down-bold.svg'
import arrowLeft from '@/assets/icons/arrow-left.svg'
import trash from '@/assets/icons/trash.svg'
import LayerCell from '@/components/features/mypage/common/LayerCell'
import CsvPreview from '@/components/features/mypage/file/CsvPreview'
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
  const [queryOpen, setQueryOpen] = useState(false)
  const downloadMut = useDownloadExport()
  const deleteMut = useDeleteExport()

  const config = item.config ? normalizePresetConfig(item.config) : null
  const isCsvType = item.type === 'GRID' || item.type === 'PIVOT'
  const isChart = item.type === 'CHART'
  const rowBg = open ? 'bg-[#EEF5FE]' : 'bg-white'
  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-[#D1D1D6] first:border-l last:border-r first:rounded-l-md last:rounded-r-md',
    open && 'first:rounded-bl-none last:rounded-br-none',
  )

  const handleApply = useCallback(
    (rawCfg) => {
      if (!rawCfg) {
        alert('적용할 검색 조건이 없습니다.')
        return
      }
      if (item.type === 'PIVOT') {
        navigate(userNavigations.PIVOT, { state: { preset: rawCfg } })
      } else {
        const payload = toSearchSpecFromConfig(normalizePresetConfig(rawCfg))
        navigate(userNavigations.SEARCH, { state: { preset: { payload } } })
      }
      setQueryOpen(false)
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
          <LayerCell layer={item.layer} />
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
              {isCsvType && <CsvPreview fileId={item.fileId} />}
              {isChart && (
                <div className='p-4 text-sm text-gray-600'>
                  차트 이미지는 미리보기 대신 다운로드로 확인하세요.
                </div>
              )}
              {config && isCsvType && (
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
            </div>
            <QueryModal
              open={queryOpen}
              onClose={() => setQueryOpen(false)}
              config={item.config}
              onApply={isCsvType ? handleApply : undefined}
            />
          </td>
        </tr>
      )}
    </>
  )
}

export default memo(FileRow)
