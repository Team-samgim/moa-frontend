import { memo } from 'react'

import CheckIcon from '@/assets/icons/check-msg.svg?react'
import ColumnIcon from '@/assets/icons/column.svg?react'
import RowIcon from '@/assets/icons/row.svg?react'
import ValueIcon from '@/assets/icons/value.svg?react'
import { TOKENS } from '@/constants/tokens'

const chartTypeOptions = [
  { key: 'groupedColumn', label: '그룹 세로 막대' },
  { key: 'stackedColumn', label: '누적 세로 막대' },
  { key: 'groupedBar', label: '그룹 가로 막대' },
  { key: 'stackedBar', label: '누적 가로 막대' },
  { key: 'line', label: '선 차트' },
  { key: 'area', label: '영역 차트' },
  { key: 'dot', label: '도트 차트' },
  { key: 'multiplePie', label: '멀티 파이 차트' },
]

const ChartConditionModal = ({ open, onClose, config }) => {
  if (!open) return null

  // 저장된 chart/pivot 설정 추출
  const chartCfg = config?.chart || config?.chartConfig || {}
  const pivotCfg = config?.pivot?.config || config?.pivotConfig || {}

  // Column / Row / Metric 값 추출 (chart 우선, pivot fallback)
  const colField =
    chartCfg.colField ||
    pivotCfg.column?.field ||
    (Array.isArray(pivotCfg.columns) && pivotCfg.columns[0]) ||
    null

  const rowField =
    chartCfg.rowField ||
    (Array.isArray(pivotCfg.rows) && pivotCfg.rows.length > 0
      ? typeof pivotCfg.rows[0] === 'string'
        ? pivotCfg.rows[0]
        : pivotCfg.rows[0]?.field
      : null)

  const metric =
    chartCfg.metric ||
    (Array.isArray(pivotCfg.values) && pivotCfg.values.length > 0 ? pivotCfg.values[0] : null)

  const metricLabel =
    metric?.alias || (metric?.field ? `${(metric?.agg || '').toUpperCase()}: ${metric.field}` : '')

  const colMode = chartCfg.colMode || 'topN'
  const rowMode = chartCfg.rowMode || 'topN'
  const colTopN = chartCfg.colTopN ?? 5
  const rowTopN = chartCfg.rowTopN ?? 5
  const colSelectedItems = chartCfg.colSelectedItems || []
  const rowSelectedItems = chartCfg.rowSelectedItems || []

  const chartType = chartCfg.chartType || 'groupedColumn'

  const badgeBase =
    'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium'

  return (
    <div className='fixed inset-0 z-50'>
      {/* 오버레이 */}
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />

      {/* 모달 카드 */}
      <div className='absolute left-1/2 top-1/2 flex h-[80vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-xl'>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div className='text-lg font-semibold text-gray-900'>차트 조건</div>
          <button
            type='button'
            onClick={onClose}
            className='rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50'
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className='flex flex-1 flex-col gap-4 overflow-auto px-6 py-5 lg:flex-row'>
          {/* 왼쪽: Column / Row */}
          <section className='flex flex-1 flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            {/* Column */}
            <div>
              <div className='mb-1 flex items-center gap-1 text-sm font-semibold text-gray-900'>
                <ColumnIcon className='h-4 w-4 text-gray-600' />
                <span>1. Column (열) 축</span>
              </div>
              <p className='text-xs text-gray-500'>
                피벗에서 열로 사용한 필드입니다. 차트의 카테고리 축을 구성합니다.
              </p>

              <div className='mt-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800'>
                {colField || <span className='text-gray-400'>설정된 열 필드가 없습니다.</span>}
              </div>

              <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                <span className={`${badgeBase} border-gray-200 bg-white text-gray-700`}>
                  모드:{' '}
                  <span className='ml-1 font-semibold'>
                    {colMode === 'manual' ? '직접 선택' : `TOP-N (${colTopN}개)`}
                  </span>
                </span>

                {colMode === 'manual' && (
                  <span className={`${badgeBase} border-blue-200 bg-blue-50 text-blue-700`}>
                    선택 항목 {colSelectedItems.length}개
                  </span>
                )}
              </div>

              {colMode === 'manual' && colSelectedItems.length > 0 && (
                <div className='mt-2 max-h-32 overflow-auto rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-800'>
                  {colSelectedItems.map((v) => (
                    <div key={v} className='flex items-center gap-2 py-0.5'>
                      <CheckIcon className='h-3 w-3 text-blue-500' />
                      <span className='truncate'>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Row */}
            <div className='mt-4 border-t border-gray-200 pt-4'>
              <div className='mb-1 flex items-center gap-1 text-sm font-semibold text-gray-900'>
                <RowIcon className='h-4 w-4 text-gray-600' />
                <span>2. Row (행) 축</span>
              </div>
              <p className='text-xs text-gray-500'>
                피벗에서 행으로 사용한 필드 중 차트에 사용한 축입니다.
              </p>

              <div className='mt-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800'>
                {rowField || <span className='text-gray-400'>설정된 행 필드가 없습니다.</span>}
              </div>

              <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                <span className={`${badgeBase} border-gray-200 bg-white text-gray-700`}>
                  모드:{' '}
                  <span className='ml-1 font-semibold'>
                    {rowMode === 'manual' ? '직접 선택' : `TOP-N (${rowTopN}개)`}
                  </span>
                </span>

                {rowMode === 'manual' && (
                  <span className={`${badgeBase} border-blue-200 bg-blue-50 text-blue-700`}>
                    선택 항목 {rowSelectedItems.length}개
                  </span>
                )}
              </div>

              {rowMode === 'manual' && rowSelectedItems.length > 0 && (
                <div className='mt-2 max-h-32 overflow-auto rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-800'>
                  {rowSelectedItems.map((v) => (
                    <div key={v} className='flex items-center gap-2 py-0.5'>
                      <CheckIcon className='h-3 w-3 text-blue-500' />
                      <span className='truncate'>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 오른쪽: Value + Chart Type */}
          <section className='flex flex-1 flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            {/* Value 지표 */}
            <div>
              <div className='mb-1 flex items-center gap-1 text-sm font-semibold text-gray-900'>
                <ValueIcon className='h-4 w-4 text-gray-600' />
                <span>3. Value 지표</span>
              </div>
              <p className='text-xs text-gray-500'>차트에 사용한 집계 값입니다.</p>

              <div className='mt-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800'>
                {metric ? (
                  <div className='flex flex-col gap-1'>
                    <span className='font-medium'>{metricLabel}</span>
                    <span className='text-xs text-gray-500'>
                      필드: <span className='font-mono'>{metric.field}</span> · 집계:{' '}
                      {(metric.agg || '').toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <span className='text-gray-400'>설정된 Value 지표가 없습니다.</span>
                )}
              </div>
            </div>

            {/* 차트 타입 */}
            <div className='mt-4 border-t border-gray-200 pt-4'>
              <div className='mb-1 text-sm font-semibold text-gray-900'>4. 차트 타입</div>
              <p className='text-xs text-gray-500'>
                저장 당시 선택했던 차트 유형입니다. (보기용, 여기서는 변경할 수 없습니다)
              </p>

              <div className='mt-3 flex flex-wrap gap-2 text-sm'>
                {chartTypeOptions.map((opt) => {
                  const selected = chartType === opt.key
                  return (
                    <div
                      key={opt.key}
                      className={[
                        'inline-flex items-center gap-1 rounded-full border px-3 py-1',
                        selected
                          ? 'border-blue bg-blue-50 text-blue'
                          : 'border-gray-300 bg-white text-gray-700',
                      ].join(' ')}
                    >
                      {selected && <CheckIcon className='h-3 w-3 text-blue' />}
                      <span>{opt.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default memo(ChartConditionModal)
