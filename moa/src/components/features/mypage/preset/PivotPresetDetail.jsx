import { memo, useMemo, useState } from 'react'

import ColumnIcon from '@/assets/icons/column.svg?react'
import FilterIcon from '@/assets/icons/filter.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'
import QueryModal from '@/components/features/mypage/file/QueryModal'

const PivotPresetDetail = ({ payload }) => {
  // payload 는 p.config 전체라고 가정
  const [queryOpen, setQueryOpen] = useState(false)

  // 피벗 쪽 설정만 추출
  const pivotRoot = payload && payload.pivot ? payload.pivot : payload || {}
  const cfg = pivotRoot.config || pivotRoot || {}

  // 검색조건 모달용 설정 (search.config 가 있으면 우선 사용)
  const queryConfig = useMemo(() => {
    if (!payload) return null
    if (payload.search?.config) return payload.search.config
    if (payload.search) return payload.search
    // 혹시 baseSpec/query 가 바로 최상단에 있는 옛 구조도 대비
    if (payload.baseSpec || payload.query) return payload
    return null
  }, [payload])

  // 열: columns(string[]) 또는 column.field 하나
  const columnField = useMemo(() => {
    if (cfg.column && cfg.column.field) return cfg.column.field
    if (Array.isArray(cfg.columns) && cfg.columns.length > 0) return cfg.columns[0]
    return null
  }, [cfg])

  // 행: rows = [{field}] 또는 string[]
  const rowFields = useMemo(() => {
    if (!Array.isArray(cfg.rows)) return []
    return cfg.rows.map((r) => (typeof r === 'string' ? r : r.field || '')).filter(Boolean)
  }, [cfg])

  // 값: values = [{ field, agg, alias }]
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
        {/* 열 (Column) 카드 */}
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

        {/* 행 (Rows) 카드 */}
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

        {/* 값 (Values) 카드 */}
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

      {/* 오른쪽 아래 검색 조건 보기 버튼 */}
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
        <QueryModal
          open={queryOpen}
          onClose={() => setQueryOpen(false)}
          config={queryConfig}
          // 피벗 프리셋 상세에서 그냥 보기만 하면 되면 onApply는 생략
        />
      )}
    </div>
  )
}

export default memo(PivotPresetDetail)
