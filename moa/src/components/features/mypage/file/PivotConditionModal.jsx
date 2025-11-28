/**
 * PivotConditionModal
 *
 * 내보낸 PIVOT 파일의 피벗 조건을 표시하는 읽기 전용 모달 컴포넌트.
 *
 * 기능:
 * - Column / Rows / Values 구조를 카드 형태로 보여줌
 * - export payload에서 pivot config를 안전하게 추출하여 표시
 * - "적용하기" 버튼을 통해 해당 조건을 그대로 재조회 가능(onApply)
 * - 모달 바깥 클릭 또는 닫기 버튼으로 닫기(onClose)
 *
 * Props:
 * - open: 모달 열림 여부(boolean)
 * - onClose: 모달 닫기 핸들러
 * - payload: export에 저장된 전체 config(JSON)
 * - onApply: 적용하기 버튼에서 호출되는 콜백(payload 전달)
 *
 * AUTHOR: 방대혁
 */

import { memo, useMemo } from 'react'

import ColumnIcon from '@/assets/icons/column.svg?react'
import FilterIcon from '@/assets/icons/filter.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'
import { TOKENS } from '@/constants/tokens'

const PivotConditionModal = ({ open, onClose, payload, onApply }) => {
  /**
   * payload는 export 전체 config이며 구조가 다음 중 하나임:
   * 1) { pivot: { config, ... }, search: {...} }
   * 2) { config: {...pivotConfig}, ... } (구형)
   *
   * pivotRoot는 pivot 우선, 없으면 payload 전체를 config로 간주
   */
  const pivotRoot = payload && payload.pivot ? payload.pivot : payload || {}

  /**
   * cfg: 피벗 config 최종 객체
   */
  const cfg = pivotRoot.config || pivotRoot || {}

  /**
   * Column 추출:
   * - cfg.column.field 사용
   * - 없으면 cfg.columns[0] 사용
   */
  const columnField = useMemo(() => {
    if (cfg.column && cfg.column.field) return cfg.column.field
    if (Array.isArray(cfg.columns) && cfg.columns.length > 0) return cfg.columns[0]
    return null
  }, [cfg])

  /**
   * Row 추출:
   * - rows는 문자열 또는 객체(field 포함)
   * - 모두 문자열 형태로 통일하여 반환
   */
  const rowFields = useMemo(() => {
    if (!Array.isArray(cfg.rows)) return []
    return cfg.rows.map((r) => (typeof r === 'string' ? r : r.field || '')).filter(Boolean)
  }, [cfg])

  /**
   * Values 추출:
   * - values = [{ field, agg, alias }, ...]
   * - agg는 op 또는 agg 중 우선 적용, default는 count
   */
  const valueItems = useMemo(() => {
    if (!Array.isArray(cfg.values)) return []
    return cfg.values.map((v) => {
      const field = v.field || ''
      const agg = v.agg || v.op || 'count'
      const alias = v.alias || (field ? `${agg}: ${field}` : '')
      return { field, agg, alias }
    })
  }, [cfg])

  // 모달 닫힌 상태면 렌더링 중단
  if (!open) return null

  return (
    <div className='fixed inset-0 z-50'>
      {/* 오버레이 */}
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />

      {/* 모달 카드 */}
      <div className='absolute left-1/2 top-1/2 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl'>
        {/* 헤더 */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='text-lg font-semibold'>피벗 조건</div>

          {/* 적용하기 버튼은 onApply가 있을 때만 렌더링 */}
          <div className='flex items-center gap-2'>
            {typeof onApply === 'function' && (
              <button
                type='button'
                onClick={() => onApply(payload)}
                className='rounded border px-3 py-1 text-sm'
                style={{
                  backgroundColor: TOKENS.BRAND,
                  color: '#FFFFFF',
                  borderColor: '#CCCCCC',
                }}
              >
                적용하기
              </button>
            )}

            <button
              type='button'
              onClick={onClose}
              className='rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50'
            >
              닫기
            </button>
          </div>
        </div>

        {/* 본문 영역: Column / Row / Values 3컬럼 */}
        <div className='grid grid-cols-3 gap-4'>
          {/** ---------------------- COLUMN 카드 ---------------------- */}
          <div className='flex min-h-0 h-full flex-col rounded border border-gray-200 bg-white overflow-hidden'>
            <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
              <span className='flex items-center gap-1'>
                <ColumnIcon className='h-4 w-4 text-gray-600' />열 (Column)
              </span>
              <div className='p-1 text-gray-400'>
                <SettingIcon className='h-4 w-4' />
              </div>
            </div>

            <div className='flex-1 divide-y divide-gray-200 overflow-y-auto'>
              {columnField ? (
                <div className='flex items-center justify-between px-3 py-2 text-sm text-gray-800'>
                  <span className='flex items-center gap-2'>
                    <SideKickIcon className='h-4 w-4 text-gray-500' />
                    {columnField}
                  </span>
                  <FilterIcon className='h-4 w-4 text-[#464646]' />
                </div>
              ) : (
                <div className='px-3 py-6 text-center text-xs text-gray-400'>
                  열이 선택되지 않았습니다
                </div>
              )}
            </div>
          </div>

          {/** ---------------------- ROW 카드 ---------------------- */}
          <div className='flex min-h-0 h-full flex-col rounded border border-gray-200 bg-white overflow-hidden'>
            <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
              <span className='flex items-center gap-1'>
                <RowIcon className='h-4 w-4 text-gray-600' />행 (Rows)
              </span>
              <div className='p-1 text-gray-400'>
                <SettingIcon className='h-4 w-4' />
              </div>
            </div>

            <div className='flex-1 divide-y divide-gray-200 overflow-y-auto'>
              {rowFields.length === 0 ? (
                <div className='px-3 py-6 text-center text-xs text-gray-400'>
                  행이 선택되지 않았습니다
                </div>
              ) : (
                rowFields.map((field) => (
                  <div
                    key={field}
                    className='flex items-center justify-between px-3 py-2 text-sm text-gray-800'
                  >
                    <span className='flex items-center gap-2'>
                      <SideKickIcon className='h-4 w-4 text-gray-500' />
                      {field}
                    </span>
                    <FilterIcon className='h-4 w-4 text-[#464646]' />
                  </div>
                ))
              )}
            </div>
          </div>

          {/** ---------------------- VALUES 카드 ---------------------- */}
          <div className='flex min-h-0 h-full flex-col rounded border border-gray-200 bg-white overflow-hidden'>
            <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
              <span className='flex items-center gap-1'>
                <ValueIcon className='h-4 w-4 text-gray-600' />값 (Values)
              </span>
              <div className='p-1 text-gray-400'>
                <SettingIcon className='h-4 w-4' />
              </div>
            </div>

            <div className='flex-1 divide-y divide-gray-200 overflow-y-auto'>
              {valueItems.length === 0 ? (
                <div className='px-3 py-6 text-center text-xs text-gray-400'>
                  값이 선택되지 않았습니다
                </div>
              ) : (
                valueItems.map((item) => (
                  <div
                    key={`${item.field}-${item.agg}`}
                    className='flex items-center justify-between px-3 py-2 text-sm text-gray-800'
                  >
                    <div className='flex flex-col gap-0.5'>
                      <span className='flex items-center gap-2'>
                        <SideKickIcon className='h-4 w-4 text-gray-500' />
                        {item.alias}
                      </span>
                      <span className='pl-6 text-[11px] text-gray-500'>
                        {item.agg?.toUpperCase()} · {item.field}
                      </span>
                    </div>
                    <FilterIcon className='h-4 w-4 text-[#464646]' />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(PivotConditionModal)
