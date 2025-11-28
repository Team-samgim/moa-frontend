/**
 * PivotPresetDetail
 *
 * 피벗(PIVOT) 프리셋의 상세 조건을 보여주는 UI 컴포넌트.
 * 저장된 PIVOT 설정에서 Column / Rows / Values 구조를 시각적으로 보여주고,
 * 필요 시 검색 조건(QueryModal)을 함께 확인할 수 있도록 모달을 제공한다.
 *
 * 주요 기능:
 * - payload 내부에서 pivot 설정(config)을 추출하여 Column/Rows/Values 구성 표시
 * - 구 구조(예전 baseSpec/query 기반)와 신 구조(pivot.config, search.config)를 모두 지원
 * - 검색 조건 보기(QueryModal) 버튼 제공
 *
 * Props:
 * - payload: 전체 preset 객체 (pivot / search / baseSpec / query 등을 포함할 수 있음)
 *
 * AUTHOR: 방대혁
 */

import { memo, useMemo, useState } from 'react'

import ColumnIcon from '@/assets/icons/column.svg?react'
import FilterIcon from '@/assets/icons/filter.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'
import QueryModal from '@/components/features/mypage/file/QueryModal'

const PivotPresetDetail = ({ payload }) => {
  /**
   * 검색조건 모달(open 여부)
   */
  const [queryOpen, setQueryOpen] = useState(false)

  /**
   * 피벗 관련 설정만 추출
   * 최신 구조: payload.pivot.config
   * 구 구조: payload.pivot 또는 payload 자체
   */
  const pivotRoot = payload && payload.pivot ? payload.pivot : payload || {}
  const cfg = pivotRoot.config || pivotRoot || {}

  /**
   * 검색 조건 모달을 위한 설정 구성
   * search.config → search → baseSpec/query 순으로 fallback
   */
  const queryConfig = useMemo(() => {
    if (!payload) return null
    if (payload.search?.config) return payload.search.config
    if (payload.search) return payload.search
    if (payload.baseSpec || payload.query) return payload
    return null
  }, [payload])

  /**
   * Column 정의
   * column.field 또는 columns 배열 중 첫 번째 값 사용
   */
  const columnField = useMemo(() => {
    if (cfg.column?.field) return cfg.column.field
    if (Array.isArray(cfg.columns) && cfg.columns.length > 0) return cfg.columns[0]
    return null
  }, [cfg])

  /**
   * Row 목록
   * rows 배열 요소가 string 또는 {field} 형태 모두 지원
   */
  const rowFields = useMemo(() => {
    if (!Array.isArray(cfg.rows)) return []
    return cfg.rows.map((r) => (typeof r === 'string' ? r : r.field || '')).filter(Boolean)
  }, [cfg])

  /**
   * Value 목록
   * values 배열의 각 항목({field, agg, alias}) 정규화
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

  return (
    <div className='border border-[#eaeaea] rounded bg-white/50 p-5'>
      <div className='grid grid-cols-3 gap-4'>
        {/* ============================================
            Column 카드 영역
           ============================================ */}
        <div className='flex min-h-0 h-full flex-col rounded border border-gray-200 bg-white overflow-hidden'>
          {/* 카드 헤더 */}
          <div className='flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
            <span className='flex items-center gap-1'>
              <ColumnIcon className='h-4 w-4 text-gray-600' />열 (Column)
            </span>
            <div className='p-1 text-gray-400'>
              <SettingIcon className='h-4 w-4' />
            </div>
          </div>

          {/* 콘텐츠 */}
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

        {/* ============================================
            Row 카드 영역
           ============================================ */}
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

        {/* ============================================
            Value 카드 영역
           ============================================ */}
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

      {/* ================================
          검색 조건 보기 버튼
         ================================ */}
      <div className='mt-4 flex justify-end'>
        <button
          type='button'
          onClick={() => setQueryOpen(true)}
          disabled={!queryConfig}
          className='rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50'
        >
          검색 조건 보기
        </button>
      </div>

      {/* 검색 조건 모달 */}
      {queryConfig && (
        <QueryModal open={queryOpen} onClose={() => setQueryOpen(false)} config={queryConfig} />
      )}
    </div>
  )
}

export default memo(PivotPresetDetail)
