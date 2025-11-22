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
  const [isHovered, setIsHovered] = useState(false)

  const rowBg = opened ? 'bg-gradient-to-r from-blue-50/50 to-blue-50/30' : 'bg-white'
  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-gray-200/70 first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
    'transition-all duration-300',
    isHovered && !opened && 'border-blue-200/50',
    opened && 'first:rounded-bl-none last:rounded-br-none',
  )

  const searchConfig = p.config?.search
  const pivotConfig = p.config?.pivot

  const extractLayer = (obj) => {
    if (!obj) return null
    return (
      obj.layer || obj.config?.layer || obj.baseSpec?.layer || obj.config?.baseSpec?.layer || null
    )
  }

  let layer
  if (p.presetType === 'SEARCH') {
    layer = extractLayer(searchConfig) || extractLayer(p.config) || extractLayer(pivotConfig)
  } else if (p.presetType === 'PIVOT') {
    layer = extractLayer(pivotConfig) || extractLayer(p.config) || extractLayer(searchConfig)
  } else {
    layer = extractLayer(p.config)
  }

  return (
    <>
      <tr
        className={cx(
          rowBg,
          CLASSES.ROW_H,
          'transition-all duration-300',
          'border border-gray-200/70 rounded-lg',
          isHovered && !opened && 'shadow-md border-blue-200/50',
          opened && 'rounded-b-none shadow-md',
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <td className={cx(cellBoxCls, 'w-16 text-center')}>
          <button
            onClick={() => onFav(p)}
            title='즐겨찾기'
            aria-label='즐겨찾기'
            className='rounded-lg px-2 text-[12px] h-9 inline-flex items-center justify-center border border-gray-200 bg-white hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200 hover:scale-110'
          >
            <StarIcon active={p.favorite} />
          </button>
        </td>

        <td className={cellBoxCls}>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-gray-800'>{p.presetName}</span>
          </div>
        </td>

        <td className={cellBoxCls}>
          <LayerCell layer={layer} />
        </td>

        <td className={cx(cellBoxCls, 'text-gray-600 text-sm')}>{fmtDate(p)}</td>

        <td className={cellBoxCls}>
          <div className='flex items-center justify-between'>
            <div className='inline-flex items-center gap-2'>
              <button
                onClick={() => onApply(p)}
                className={cx(
                  CLASSES.BTN,
                  'bg-white hover:bg-[#30308a] border border-gray-300',
                  'transition-all duration-200 font-medium',
                )}
              >
                적용하기
              </button>
              <button
                onClick={() => onDelete(p)}
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
                onClick={() => setOpened((v) => !v)}
                aria-label={opened ? '닫기' : '열기'}
                title={opened ? '닫기' : '열기'}
                className={cx(
                  CLASSES.BTN_ICON,
                  'bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue',
                  'transition-all duration-200 shadow-sm',
                  opened && 'bg-blue-50 border-blue',
                )}
              >
                <img
                  src={opened ? arrowDown : arrowLeft}
                  alt=''
                  className={cx(
                    'h-4 w-4 transition-transform duration-300',
                    opened && 'rotate-0',
                    !opened && 'rotate-0',
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
              opened ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <div className='p-6 bg-linear-to-b from-blue-50/30 to-white'>
              {p.presetType === 'SEARCH' ? (
                <GridPresetDetail payload={searchConfig ?? p.config} />
              ) : (
                <PivotPresetDetail payload={p.config} />
              )}
            </div>
          </div>
        </td>
      </tr>
    </>
  )
}

export default memo(PresetRow)
