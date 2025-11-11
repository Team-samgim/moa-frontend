import { useEffect, useMemo, useState } from 'react'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import { useInfiniteDistinctValues } from '@/hooks/queries/usePivot'
import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotStore } from '@/stores/pivotStore'

/**
 * props
 * - layer: 현재 레이어 (pivotStore.layer)
 * - time: buildTimePayload(timeRange, customRange) 로 만든 시간 payload
 * - filters: pivotStore.filters
 * - onClose: 닫기 핸들러
 * - onApply: (optional) 적용 클릭 시 호출. 없으면 onClose만 실행.
 */
const PivotChartConfigModal = ({ layer, time, filters, onClose, onApply }) => {
  // ===== pivotStore =====
  const column = usePivotStore((s) => s.column)
  const rows = usePivotStore((s) => s.rows)
  const values = usePivotStore((s) => s.values)

  // ===== pivotChartStore =====
  const xField = usePivotChartStore((s) => s.xField)
  const xMode = usePivotChartStore((s) => s.xMode) // 'topN' | 'manual'
  const xTopN = usePivotChartStore((s) => s.xTopN)
  const xSelectedItems = usePivotChartStore((s) => s.xSelectedItems)
  const yMetrics = usePivotChartStore((s) => s.yMetrics)
  const chartType = usePivotChartStore((s) => s.chartType)

  const setXField = usePivotChartStore((s) => s.setXField)
  const setXMode = usePivotChartStore((s) => s.setXMode)
  const setXTopN = usePivotChartStore((s) => s.setXTopN)
  const setXSelectedItems = usePivotChartStore((s) => s.setXSelectedItems)
  const setYMetrics = usePivotChartStore((s) => s.setYMetrics)
  const setChartType = usePivotChartStore((s) => s.setChartType)

  const [isXFieldOpen, setIsXFieldOpen] = useState(false)

  // ===== 1. X축 기준 후보 =====
  const columnOption = column?.field
    ? [{ kind: 'column', field: column.field, label: column.field }]
    : []

  const rowOptions = (rows || []).map((r) => ({
    kind: 'row',
    field: r.field,
    label: r.field,
  }))

  const hasColumn = columnOption.length > 0
  const hasRows = rowOptions.length > 0

  const currentXKind = useMemo(() => {
    if (!xField) return hasColumn ? 'column' : 'row'
    if (column?.field === xField) return 'column'
    if (rowOptions.some((r) => r.field === xField)) return 'row'
    return hasColumn ? 'column' : 'row'
  }, [xField, column, rowOptions, hasColumn])

  const currentXOptions = currentXKind === 'column' ? columnOption : rowOptions

  const handleChangeXKind = (kind) => {
    // column/row 전환 시 첫 필드로 맞춰줌
    if (kind === 'column') {
      if (column?.field) setXField(column.field)
    } else {
      if (rowOptions.length > 0) setXField(rowOptions[0].field)
    }
    setXSelectedItems([])
  }

  // ===== 2. X축 값 리스트 (직접 선택 모드, 인피니트 스크롤) =====
  const effectiveFilters = useMemo(
    () => (filters ?? []).filter((f) => f.field !== xField),
    [filters, xField],
  )

  const {
    data: distinctData,
    isLoading: isDistinctLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchDistinct,
  } = useInfiniteDistinctValues({
    layer,
    field: xField,
    time,
    filters: effectiveFilters,
    order: 'asc',
    enabled: xMode === 'manual' && !!xField,
    limit: 50,
  })

  // pages → flat list
  const distinctItems = useMemo(
    () => (distinctData?.pages || []).flatMap((p) => p.items || []),
    [distinctData],
  )

  useEffect(() => {
    setIsXFieldOpen(false)
  }, [xField])

  // X축 필드나 모드가 바뀔 때, manual + xField가 유효하면 첫 페이지 다시 로딩
  useEffect(() => {
    if (xMode !== 'manual' || !xField) return

    // 선택값은 위에서 이미 초기화하고 있으니, 여기서는 fetch만 보장
    refetchDistinct()
  }, [xField, xMode, refetchDistinct])

  // 인피니트 스크롤 핸들러
  const handleScrollDistinct = (e) => {
    const el = e.currentTarget
    if (!el || !hasNextPage || isFetchingNextPage) return

    const threshold = 40 // px
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      fetchNextPage()
    }
  }

  const isItemChecked = (label) => xSelectedItems.includes(label)

  const toggleItem = (label) => {
    if (!label) return
    if (isItemChecked(label)) {
      setXSelectedItems(xSelectedItems.filter((v) => v !== label))
    } else {
      setXSelectedItems([...xSelectedItems, label])
    }
  }

  const toggleAllItems = () => {
    if (!distinctItems.length) return
    const allSelected = distinctItems.every((v) => xSelectedItems.includes(v))
    if (allSelected) {
      setXSelectedItems([])
    } else {
      setXSelectedItems(distinctItems)
    }
  }

  // ===== 3. Value 지표 후보 =====
  const valueOptions = values || []

  const isMetricChecked = (field, agg) => yMetrics.some((m) => m.field === field && m.agg === agg)

  const toggleMetric = (field, agg, alias) => {
    const exists = isMetricChecked(field, agg)
    if (exists) {
      setYMetrics((prev) => prev.filter((m) => !(m.field === field && m.agg === agg)))
    } else {
      setYMetrics((prev) => [...prev, { field, agg, alias }])
    }
  }

  // ===== 4. 차트 타입 후보 =====
  const chartTypeOptions = [
    { key: 'bar', label: '막대 차트' },
    { key: 'line', label: '선 차트' },
    { key: 'area', label: '영역 차트' },
  ]

  const handleApply = () => {
    if (!xField) {
      window.alert('X축 필드를 선택해주세요.')
      return
    }

    if (yMetrics.length === 0) {
      window.alert('최소 1개의 Value 지표를 선택해주세요.')
      return
    }

    if (xMode === 'manual' && xSelectedItems.length === 0) {
      window.alert('직접 선택 모드에서는 최소 1개의 항목을 선택해야 합니다.')
      return
    }

    if (chartType === 'pie' && yMetrics.length > 1) {
      window.alert('원형 차트는 1개의 지표만 선택 가능합니다.')
      return
    }

    if (onApply) {
      onApply()
    }
    onClose()
  }

  const btnBase = 'rounded-md border px-3 py-2 text-sm'
  const btnPrimary = 'bg-blue border-blue-dark text-white hover:bg-blue-dark'
  const btnMuted = 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='w-full max-w-5xl h-[80vh] rounded-xl bg-white shadow-xl flex flex-col'>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>차트 설정</h2>
          <div className='flex gap-2'>
            <button type='button' className={`${btnBase} ${btnMuted}`} onClick={onClose}>
              취소
            </button>
            <button type='button' className={`${btnBase} ${btnPrimary}`} onClick={handleApply}>
              적용
            </button>
          </div>
        </div>

        {/* 내용 영역: 남은 높이 꽉 채우기 */}
        <div className='grid flex-1 min-h-0 gap-6 px-6 py-5 lg:grid-cols-2 overflow-auto'>
          {/* 1 + 2. X축 기준 + X축 필드 선택 */}
          <section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div>
              <div className='text-sm font-semibold text-gray-900'>1. X축 기준</div>
              <p className='mt-1 text-xs text-gray-500'>
                선택한 열 또는 행 필드 중 어떤 필드를 X축으로 사용할지 선택하세요.
              </p>
            </div>

            {/* 열 / 행 라디오 */}
            <div className='flex flex-wrap gap-3 text-sm'>
              <button
                type='button'
                disabled={!hasColumn}
                onClick={() => hasColumn && handleChangeXKind('column')}
                className={[
                  'rounded-full border px-3 py-1',
                  currentXKind === 'column'
                    ? 'border-blue bg-blue-50 text-blue'
                    : 'border-gray-300 text-gray-700',
                  !hasColumn && 'cursor-not-allowed opacity-40',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                열 (Column)
              </button>
              <button
                type='button'
                disabled={!hasRows}
                onClick={() => hasRows && handleChangeXKind('row')}
                className={[
                  'rounded-full border px-3 py-1',
                  currentXKind === 'row'
                    ? 'border-blue bg-blue-50 text-blue'
                    : 'border-gray-300 text-gray-700',
                  !hasRows && 'cursor-not-allowed opacity-40',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                행 (Rows)
              </button>
            </div>

            {/* X축 필드 셀렉트 (커스텀 드롭다운) */}
            <div className='mt-1'>
              <label className='mb-1 block text-xs font-medium text-gray-700'>
                X축으로 사용할 필드
              </label>

              <div className='relative'>
                {/* 트리거 버튼 */}
                <button
                  type='button'
                  disabled={!currentXOptions.length}
                  onClick={() => {
                    if (currentXOptions.length) setIsXFieldOpen((prev) => !prev)
                  }}
                  className={[
                    'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
                    'text-gray-800 outline-none',
                    !currentXOptions.length
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 bg-white hover:bg-gray-50 focus:border-blue-light focus:ring-1 focus:ring-blue-light',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={xField ? '' : 'text-gray-400'}>
                    {(() => {
                      if (!currentXOptions.length) return '선택 가능한 필드가 없습니다'
                      if (!xField) return '필드를 선택하세요'
                      const found = currentXOptions.find((opt) => opt.field === xField)
                      return found?.label ?? xField
                    })()}
                  </span>

                  <ArrowDownIcon
                    className={[
                      'h-3 w-3 transition-transform',
                      isXFieldOpen ? 'rotate-180 text-gray-500' : 'text-gray-400',
                    ].join(' ')}
                  />
                </button>

                {/* 드롭다운 패널 - ValueSelect 스타일 반영 */}
                {isXFieldOpen && currentXOptions.length > 0 && (
                  <div className='absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white text-xs shadow'>
                    {currentXOptions.map((opt) => (
                      <button
                        key={opt.field}
                        type='button'
                        className='block w-full px-3 py-2 text-left text-[13px] text-gray-800 hover:bg-gray-50'
                        onClick={() => {
                          setXField(opt.field)
                          setXSelectedItems([]) // 필드 변경 시 직접 선택 초기화
                          setIsXFieldOpen(false)
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. X축 필드 선택 (TOP-N / 직접 선택) */}
            <div className='mt-4 border-t border-gray-200 pt-3'>
              <div className='mb-2 text-sm font-semibold text-gray-900'>2. X축 필드 선택</div>
              <p className='mb-3 text-xs text-gray-500'>
                상위 N개만 사용할지, 개별 항목을 직접 선택할지 정할 수 있습니다.
              </p>

              {/* TOP-N / 직접 선택 토글 */}
              <div className='mb-3 flex gap-3 text-sm'>
                <button
                  type='button'
                  onClick={() => setXMode('topN')}
                  className={[
                    'rounded-full border px-3 py-1',
                    xMode === 'topN'
                      ? 'border-blue bg-blue-50 text-blue'
                      : 'border-gray-300 text-gray-700',
                  ].join(' ')}
                >
                  TOP-N
                </button>
                <button
                  type='button'
                  onClick={() => setXMode('manual')}
                  className={[
                    'rounded-full border px-3 py-1',
                    xMode === 'manual'
                      ? 'border-blue bg-blue-50 text-blue'
                      : 'border-gray-300 text-gray-700',
                  ].join(' ')}
                >
                  직접 선택
                </button>
              </div>

              {/* TOP-N 모드 */}
              {xMode === 'topN' && (
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-gray-700'>상위</span>
                  <input
                    type='number'
                    min={1}
                    value={xTopN}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      setXTopN(Number.isNaN(v) || v <= 0 ? 1 : v)
                    }}
                    className='w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-800 outline-none focus:border-blue focus:ring-1 focus:ring-blue'
                  />
                  <span className='text-gray-700'>개 항목 사용</span>
                </div>
              )}

              {/* 직접 선택 모드 */}
              {xMode === 'manual' && (
                <div className='mt-2 rounded-md border border-gray-200 bg-white'>
                  <div className='flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs text-gray-700'>
                    <span>값 선택</span>
                    <button
                      type='button'
                      onClick={toggleAllItems}
                      className='rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'
                    >
                      전체 선택/해제
                    </button>
                  </div>

                  <div className='h-60 overflow-auto text-sm' onScroll={handleScrollDistinct}>
                    {isDistinctLoading && (
                      <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                        로딩 중…
                      </div>
                    )}

                    {!isDistinctLoading &&
                      distinctItems.map((v) => {
                        const checked = isItemChecked(v)
                        return (
                          <label
                            key={v}
                            className='flex cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm first:border-t-0 hover:bg-gray-50'
                          >
                            <input
                              type='checkbox'
                              className='sr-only'
                              checked={checked}
                              onChange={() => toggleItem(v)}
                            />
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                checked
                                  ? 'border-blue-light bg-blue-light'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {checked && <CheckIcon className='h-3.5 w-3.5 text-white' />}
                            </div>
                            <span className='truncate'>{v}</span>
                          </label>
                        )
                      })}

                    {!isDistinctLoading && !distinctItems.length && (
                      <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                        선택 가능한 값이 없습니다
                      </div>
                    )}

                    {isFetchingNextPage && (
                      <div className='py-2 text-center text-xs text-gray-400'>더 불러오는 중…</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 3. Value 지표 + 4. 추천 차트 타입 */}
          <section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            {/* 3. Value 지표 */}
            <div>
              <div className='text-sm font-semibold text-gray-900'>3. Value 지표</div>
              <p className='mt-1 text-xs text-gray-500'>
                차트에 사용할 집계 값을 선택하세요. 2개 이상 선택 시 각 집계 값이 개별 시리즈가
                됩니다.
              </p>
            </div>

            <div className='mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white p-3'>
              {!valueOptions.length && (
                <div className='py-4 text-center text-xs text-gray-400'>
                  선택된 Value 값이 없습니다.
                </div>
              )}

              {valueOptions.map((v) => {
                const checked = isMetricChecked(v.field, v.agg)
                const label = v.alias || `${v.agg?.toUpperCase()}: ${v.field}`
                return (
                  <label
                    key={`${v.field}::${v.agg}`}
                    className='flex cursor-pointer items-center gap-2 border-t border-gray-100 py-2 text-sm first:border-t-0 hover:bg-gray-50'
                  >
                    <input
                      type='checkbox'
                      className='sr-only'
                      checked={checked}
                      onChange={() => toggleMetric(v.field, v.agg, v.alias)}
                    />
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                        checked ? 'border-blue-light bg-blue-light' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {checked && <CheckIcon className='h-3.5 w-3.5 text-white' />}
                    </div>
                    <span className='font-medium text-gray-800'>{label}</span>
                    <span className='text-xs text-gray-500'>
                      ({v.field} · {v.agg})
                    </span>
                  </label>
                )
              })}
            </div>

            {/* 4. 추천 차트 타입 */}
            <div className='mt-2 border-t border-gray-200 pt-3'>
              <div className='text-sm font-semibold text-gray-900'>4. 추천 차트 타입</div>
              <p className='mt-1 text-xs text-gray-500'>
                선택한 기준에 어울리는 차트 유형을 선택해보세요.
              </p>

              <div className='mt-3 flex flex-wrap gap-2 text-sm'>
                {chartTypeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type='button'
                    onClick={() => setChartType(opt.key)}
                    className={[
                      'rounded-full border px-3 py-1',
                      chartType === opt.key
                        ? 'border-blue bg-blue-50 text-blue'
                        : 'border-gray-300 text-gray-700 hover:bg-white',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PivotChartConfigModal
