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

  return (
    <>
      <tr className={cx('border-b', opened && 'bg-indigo-100', CLASSES.ROW_H)}>
        <td className={cx(CLASSES.TD, 'w-16 text-center')}>
          <button
            onClick={() => onFav(p)}
            title='즐겨찾기'
            aria-label='즐겨찾기'
            className='rounded px-2 text-[12px] h-8 inline-flex items-center justify-center border border-[#cccccc] bg-white'
          >
            <StarIcon active={p.favorite} />
          </button>
        </td>

        <td className={CLASSES.TD}>
          <span className='font-medium'>{p.presetName}</span>
        </td>

        <td className={CLASSES.TD}>
          <LayerCell layer={p.config?.layer} />
        </td>

        <td className={cx(CLASSES.TD, 'text-gray-500')}>{fmtDate(p)}</td>

        <td className={cx(CLASSES.TD, 'w-[260px]')}>
          <div className='flex items-center justify-between'>
            <div className='inline-flex items-center gap-2'>
              <button onClick={() => onApply(p)} className={cx(CLASSES.BTN, 'hover:bg-blue-50')}>
                적용하기
              </button>

              <button
                onClick={() => onDelete(p)}
                aria-label='삭제'
                title='삭제'
                className={cx(CLASSES.BTN_ICON, 'hover:bg-red-50')}
              >
                <img src={trash} alt='' className='h-4 w-4' />
              </button>
            </div>

            <div className='pl-3 ml-3'>
              <button
                onClick={() => setOpened((v) => !v)}
                aria-label={opened ? '닫기' : '열기'}
                title={opened ? '닫기' : '열기'}
                className={CLASSES.BTN_ICON}
              >
                <img src={opened ? arrowDown : arrowLeft} alt='' className='h-4 w-4' />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {opened && (
        <tr className='border-b bg-white/60'>
          <td colSpan={5} className='px-6 py-4'>
            {p.presetType === 'GRID' ? (
              <GridPresetDetail payload={p.config} />
            ) : (
              <PivotPresetDetail payload={p.config} />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default memo(PresetRow)
