import { memo, useState } from 'react'
import arrowDown from '@/assets/icons/arrow-down-bold.svg'
import arrowLeft from '@/assets/icons/arrow-left.svg'
import trash from '@/assets/icons/trash.svg'
import LayerCell from '@/components/features/mypage/common/LayerCell'
import GridPresetDetail from '@/components/features/mypage/preset/GridPresetDetail'
import PivotPresetDetail from '@/components/features/mypage/preset/PivotPresetDetail'
import StarIcon from '@/components/features/mypage/preset/StarIcon'
import { CLASSES } from '@/constants/tokens'
import { cx, fmtDate } from '@/utils/misc'

const PresetRow = ({ p, onFav, onDelete, onApply }) => {
  const [opened, setOpened] = useState(false)
  const rowBg = opened ? 'bg-[#EEF5FE]' : 'bg-white'
  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-[#D1D1D6] first:border-l last:border-r first:rounded-l-md last:rounded-r-md',
    opened && 'first:rounded-bl-none last:rounded-br-none',
  )

  const searchConfig = p.config?.search
  const pivotConfig = p.config?.pivot

  const layer =
    p.presetType === 'SEARCH'
      ? (searchConfig?.layer ?? p.config?.layer)
      : (pivotConfig?.layer ?? p.config?.layer)

  return (
    <>
      <tr className={cx(rowBg, CLASSES.ROW_H)}>
        <td className={cx(cellBoxCls, 'w-16 text-center')}>
          <button
            onClick={() => onFav(p)}
            title='즐겨찾기'
            aria-label='즐겨찾기'
            className='rounded px-2 text-[12px] h-8 inline-flex items-center justify-center border border-[#D1D1D6] bg-white'
          >
            <StarIcon active={p.favorite} />
          </button>
        </td>

        <td className={cellBoxCls}>
          <span className='font-medium'>{p.presetName}</span>
        </td>

        <td className={cellBoxCls}>
          <LayerCell layer={layer} />
        </td>

        <td className={cellBoxCls}>{fmtDate(p)}</td>

        <td className={cellBoxCls}>
          <div className='flex items-center justify-between'>
            <div className='inline-flex items-center gap-2'>
              <button
                onClick={() => onApply(p)}
                className={cx(CLASSES.BTN, 'hover:bg-blue-50 border border-[#CCCCCC]')}
              >
                적용하기
              </button>

              <button
                onClick={() => onDelete(p)}
                aria-label='삭제'
                title='삭제'
                className={cx(CLASSES.BTN_ICON, 'hover:bg-red-50 border border-[#CCCCCC]')}
              >
                <img src={trash} alt='' className='h-4 w-4' />
              </button>
            </div>

            <div className='pl-3 ml-3'>
              <button
                onClick={() => setOpened((v) => !v)}
                aria-label={opened ? '닫기' : '열기'}
                title={opened ? '닫기' : '열기'}
                className={cx(CLASSES.BTN_ICON, 'border border-[#CCCCCC]')}
              >
                <img src={opened ? arrowDown : arrowLeft} alt='' className='h-4 w-4' />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {opened && (
        <tr className='bg-transparent'>
          {/* 테이블 전체가 border-spacing-y-[12px]이므로 상세는 그만큼 위로 당겨 붙임 */}
          <td colSpan={5} className='pt-0'>
            <div className='bg-white -mt-[15px]'>
              {p.presetType === 'SEARCH' ? (
                <GridPresetDetail payload={searchConfig ?? p.config} />
              ) : (
                <PivotPresetDetail payload={pivotConfig ?? p.config} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default memo(PresetRow)
