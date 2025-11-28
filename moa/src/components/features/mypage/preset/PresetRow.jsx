/**
 * PresetRow
 *
 * 프리셋 목록 테이블에서 한 행(row)을 렌더링하는 컴포넌트.
 * 즐겨찾기, 적용, 삭제, 상세 보기(아코디언)를 모두 담당한다.
 *
 * 주요 기능:
 * 1. preset 기본 정보 표시 (이름, 레이어, 날짜 등)
 * 2. presetType에 따라 상세 데이터 표시
 *    - SEARCH → GridPresetDetail
 *    - PIVOT → PivotPresetDetail
 * 3. 즐겨찾기(onFav), 삭제(onDelete), 적용(onApply) 이벤트 발생
 * 4. 상세 보기(opened) 상태에서 아코디언 형태의 UI 확장/축소 제공
 *
 * Props:
 * - p: 프리셋 객체 (presetName, presetType, config, favorite 등 포함)
 * - onFav: 즐겨찾기 클릭 핸들러
 * - onDelete: 삭제 버튼 핸들러
 * - onApply: 적용 버튼 핸들러
 *
 * AUTHOR: 방대혁
 */

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
  /**
   * opened: 상세 보기(아코디언) 열림 여부
   * isHovered: hover 상태에서 border/shadow 강조 여부
   */
  const [opened, setOpened] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  /**
   * 전체 row의 배경색 변화 (열림 여부에 따라 다름)
   */
  const rowBg = opened ? 'bg-gradient-to-r from-blue-50/50 to-blue-50/30' : 'bg-white'

  /**
   * 각 셀 기본 클래스
   */
  const cellBoxCls = cx(
    CLASSES.TD,
    rowBg,
    'border-y border-gray-200/70 first:border-l last:border-r first:rounded-l-lg last:rounded-r-lg',
    'transition-all duration-300',
    isHovered && !opened && 'border-blue-200/50',
    opened && 'first:rounded-bl-none last:rounded-br-none',
  )

  /**
   * presetType 에 따라 사용되는 config
   */
  const searchConfig = p.config?.search
  const pivotConfig = p.config?.pivot

  /**
   * layer 값을 다양한 구조에서 추출하는 유틸 함수
   * 구조가 p.config, p.config.search, p.config.pivot 등 다양할 수 있으므로
   */
  const extractLayer = (obj) => {
    if (!obj) return null
    return (
      obj.layer || obj.config?.layer || obj.baseSpec?.layer || obj.config?.baseSpec?.layer || null
    )
  }

  /**
   * presetType 기반으로 layer 결정
   * SEARCH → searchConfig 우선
   * PIVOT → pivotConfig 우선
   * default → p.config 사용
   */
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
      {/* ============================
          메인 Row (상단)
         ============================ */}
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
        {/* 즐겨찾기 버튼 */}
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

        {/* preset 이름 */}
        <td className={cellBoxCls}>
          <div className='flex items-center gap-2'>
            <span className='font-semibold text-gray-800'>{p.presetName}</span>
          </div>
        </td>

        {/* layer 표시 */}
        <td className={cellBoxCls}>
          <LayerCell layer={layer} />
        </td>

        {/* 날짜 표시 */}
        <td className={cx(cellBoxCls, 'text-gray-600 text-sm')}>{fmtDate(p)}</td>

        {/* 적용하기, 삭제, 열기 버튼 */}
        <td className={cellBoxCls}>
          <div className='flex items-center justify-between'>
            <div className='inline-flex items-center gap-2'>
              {/* 적용하기 버튼 */}
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

              {/* 삭제 버튼 */}
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

            {/* 상세 보기 토글 */}
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
                  className={cx('h-4 w-4 transition-transform duration-300')}
                />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {/* ============================
          상세 영역 (아코디언)
         ============================ */}
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
