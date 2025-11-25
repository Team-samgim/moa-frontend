import { useEffect, useMemo, useState } from 'react'
import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import CheckIcon from '@/assets/icons/check-msg.svg?react'
import { useInfiniteDistinctValues } from '@/hooks/queries/usePivot'
import { usePivotChartStore } from '@/stores/pivotChartStore'
import { usePivotStore } from '@/stores/pivotStore'
import { allowScroll, preventScroll } from '@/utils/modal'

const PivotChartConfigModal = ({ layer, time, filters, onClose, onApply }) => {
  const column = usePivotStore((s) => s.column)
  const rows = usePivotStore((s) => s.rows)
  const values = usePivotStore((s) => s.values)

  const storeColField = usePivotChartStore((s) => s.colField)
  const storeColMode = usePivotChartStore((s) => s.colMode)
  const storeColTopN = usePivotChartStore((s) => s.colTopN)
  const storeColSelectedItems = usePivotChartStore((s) => s.colSelectedItems)
  const storeRowField = usePivotChartStore((s) => s.rowField)
  const storeRowMode = usePivotChartStore((s) => s.rowMode)
  const storeRowTopN = usePivotChartStore((s) => s.rowTopN)
  const storeRowSelectedItems = usePivotChartStore((s) => s.rowSelectedItems)
  const storeMetric = usePivotChartStore((s) => s.metric)
  const storeChartType = usePivotChartStore((s) => s.chartType)

  const setColField = usePivotChartStore((s) => s.setColField)
  const setColMode = usePivotChartStore((s) => s.setColMode)
  const setColTopN = usePivotChartStore((s) => s.setColTopN)
  const setColSelectedItems = usePivotChartStore((s) => s.setColSelectedItems)
  const setRowField = usePivotChartStore((s) => s.setRowField)
  const setRowMode = usePivotChartStore((s) => s.setRowMode)
  const setRowTopN = usePivotChartStore((s) => s.setRowTopN)
  const setRowSelectedItems = usePivotChartStore((s) => s.setRowSelectedItems)
  const setMetric = usePivotChartStore((s) => s.setMetric)
  const setChartType = usePivotChartStore((s) => s.setChartType)
  const setAxisAndMetric = usePivotChartStore((s) => s.setAxisAndMetric)

  const [localColField, setLocalColField] = useState(storeColField)
  const [localColMode, setLocalColMode] = useState(storeColMode)
  const [localColTopN, setLocalColTopN] = useState(storeColTopN)
  const [localColSelectedItems, setLocalColSelectedItems] = useState(storeColSelectedItems)
  const [localRowField, setLocalRowField] = useState(storeRowField)
  const [localRowMode, setLocalRowMode] = useState(storeRowMode)
  const [localRowTopN, setLocalRowTopN] = useState(storeRowTopN)
  const [localRowSelectedItems, setLocalRowSelectedItems] = useState(storeRowSelectedItems)
  const [localMetric, setLocalMetric] = useState(storeMetric)
  const [localChartType, setLocalChartType] = useState(storeChartType)

  const [isRowFieldOpen, setIsRowFieldOpen] = useState(false)

  useEffect(() => {
    const prevScrollY = preventScroll()
    return () => {
      allowScroll(prevScrollY)
    }
  }, [])

  // Column 필드 초기화
  useEffect(() => {
    if (column?.field && !localColField) {
      setLocalColField(column.field)
    }
  }, [column, localColField])

  // Row 필드 초기화
  useEffect(() => {
    if (!localRowField && rows && rows.length > 0) {
      setLocalRowField(rows[0].field)
    }
  }, [localRowField, rows])

  const hasColumn = !!(column && column.field)
  const hasRows = Array.isArray(rows) && rows.length > 0

  // ===== 1. Column 축 manual 값 조회 =====
  const effectiveFiltersForCol = useMemo(
    () => (filters ?? []).filter((f) => f.field !== localColField),
    [filters, localColField],
  )

  const {
    data: colDistinctData,
    isLoading: isColDistinctLoading,
    isFetchingNextPage: isColFetchingNext,
    hasNextPage: hasColNext,
    fetchNextPage: fetchColNext,
    refetch: refetchColDistinct,
  } = useInfiniteDistinctValues({
    layer,
    field: localColField,
    time,
    filters: effectiveFiltersForCol,
    order: 'asc',
    enabled: localColMode === 'manual' && !!localColField,
    limit: 50,
  })

  const colDistinctItems = useMemo(
    () => (colDistinctData?.pages || []).flatMap((p) => p.items || []),
    [colDistinctData],
  )

  useEffect(() => {
    if (localColMode === 'manual' && localColField) {
      refetchColDistinct()
    }
  }, [localColField, localColMode, refetchColDistinct])

  const handleScrollColDistinct = (e) => {
    const el = e.currentTarget
    if (!el || !hasColNext || isColFetchingNext) return
    const threshold = 40
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      fetchColNext()
    }
  }

  const isColItemChecked = (label) => localColSelectedItems.includes(label)

  const toggleColItem = (label) => {
    if (!label) return
    // 최대 6개 제한
    if (!isColItemChecked(label) && localColSelectedItems.length >= 6) {
      window.alert('최대 6개까지만 선택할 수 있습니다.')
      return
    }
    if (isColItemChecked(label)) {
      setLocalColSelectedItems(localColSelectedItems.filter((v) => v !== label))
    } else {
      setLocalColSelectedItems([...localColSelectedItems, label])
    }
  }

  const toggleColAllItems = () => {
    if (!colDistinctItems.length) return
    const allSelected = colDistinctItems.every((v) => localColSelectedItems.includes(v))
    if (allSelected) {
      setLocalColSelectedItems([])
    } else {
      // 최대 6개까지만 선택
      setLocalColSelectedItems(colDistinctItems.slice(0, 6))
    }
  }

  // ===== 2. Row 축 manual 값 조회 =====
  const effectiveFiltersForRow = useMemo(
    () => (filters ?? []).filter((f) => f.field !== localRowField),
    [filters, localRowField],
  )

  const {
    data: rowDistinctData,
    isLoading: isRowDistinctLoading,
    isFetchingNextPage: isRowFetchingNext,
    hasNextPage: hasRowNext,
    fetchNextPage: fetchRowNext,
    refetch: refetchRowDistinct,
  } = useInfiniteDistinctValues({
    layer,
    field: localRowField,
    time,
    filters: effectiveFiltersForRow,
    order: 'asc',
    enabled: localRowMode === 'manual' && !!localRowField,
    limit: 50,
  })

  const rowDistinctItems = useMemo(
    () => (rowDistinctData?.pages || []).flatMap((p) => p.items || []),
    [rowDistinctData],
  )

  useEffect(() => {
    if (localRowMode === 'manual' && localRowField) {
      refetchRowDistinct()
    }
  }, [localRowField, localRowMode, refetchRowDistinct])

  const handleScrollRowDistinct = (e) => {
    const el = e.currentTarget
    if (!el || !hasRowNext || isRowFetchingNext) return
    const threshold = 40
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      fetchRowNext()
    }
  }

  const isRowItemChecked = (label) => localRowSelectedItems.includes(label)

  const toggleRowItem = (label) => {
    if (!label) return
    if (isRowItemChecked(label)) {
      setLocalRowSelectedItems(localRowSelectedItems.filter((v) => v !== label))
    } else {
      setLocalRowSelectedItems([...localRowSelectedItems, label])
    }
  }

  const toggleRowAllItems = () => {
    if (!rowDistinctItems.length) return
    const allSelected = rowDistinctItems.every((v) => localRowSelectedItems.includes(v))
    if (allSelected) {
      setLocalRowSelectedItems([])
    } else {
      setLocalRowSelectedItems(rowDistinctItems)
    }
  }

  // ===== 3. Value 지표 후보 (단일 선택) =====
  const valueOptions = values || []

  const isMetricChecked = (field, agg) =>
    !!localMetric && localMetric.field === field && localMetric.agg === agg

  const toggleMetric = (field, agg, alias) => {
    if (localMetric && localMetric.field === field && localMetric.agg === agg) {
      setLocalMetric(null)
    } else {
      setLocalMetric({ field, agg, alias })
    }
  }

  // 차트 타입 옵션
  const chartTypeOptions = [
    {
      key: 'groupedColumn',
      label: '그룹 세로 막대',
      image: '/src/assets/images/grouped-column.webp',
    },
    {
      key: 'stackedColumn',
      label: '누적 세로 막대',
      image: '/src/assets/images/stacked-column.webp',
    },
    { key: 'groupedBar', label: '그룹 가로 막대', image: '/src/assets/images/grouped-bar.webp' },
    { key: 'stackedBar', label: '누적 가로 막대', image: '/src/assets/images/stacked-bar.webp' },
    { key: 'multiplePie', label: '멀티 파이 차트', image: '/src/assets/images/pie.webp' },
  ]

  // 적용 버튼 핸들러: 실제 store에 저장
  const handleApply = () => {
    if (!localColField) {
      window.alert('Column 축 필드를 선택할 수 없습니다. 피벗 열을 먼저 설정해주세요.')
      return
    }
    if (!localRowField) {
      window.alert('Row 축으로 사용할 행 필드를 선택해주세요.')
      return
    }
    if (!localMetric) {
      window.alert('Value 지표를 1개 선택해주세요.')
      return
    }
    if (localColMode === 'manual' && localColSelectedItems.length === 0) {
      window.alert('Column 직접 선택 모드에서는 최소 1개의 항목을 선택해야 합니다.')
      return
    }
    if (localRowMode === 'manual' && localRowSelectedItems.length === 0) {
      window.alert('Row 직접 선택 모드에서는 최소 1개의 항목을 선택해야 합니다.')
      return
    }

    // 로컬 설정 store에 반영
    setColField(localColField)
    setColMode(localColMode)
    setColTopN(localColTopN)
    setColSelectedItems(localColSelectedItems)
    setRowField(localRowField)
    setRowMode(localRowMode)
    setRowTopN(localRowTopN)
    setRowSelectedItems(localRowSelectedItems)
    setMetric(localMetric)
    setChartType(localChartType)

    setAxisAndMetric({
      colField: localColField,
      rowField: localRowField,
      metric: localMetric,
    })

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
      <div className='w-full max-w-5xl h-[88vh] 4xl:h-[60vh] rounded-xl bg-white shadow-xl flex flex-col'>
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

        {/* 내용 */}
        <div className='grid flex-1 min-h-0 gap-6 px-6 py-5 lg:grid-cols-2 overflow-auto'>
          {/* Column + Row */}
          <section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            {/* 1. Column 축 */}
            <div>
              <div className='text-sm font-semibold text-gray-900'>1. Column (열) 축</div>
              <p className='mt-1 text-xs text-gray-500'>
                피벗에서 선택한 열 필드를 기준으로 X축(또는 Y축) 카테고리를 구성합니다.
              </p>
            </div>

            <div className='mt-1'>
              <label className='mb-1 block text-xs font-medium text-gray-700'>Column 축 필드</label>
              <div className='rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700'>
                {hasColumn ? column.field : '선택된 열(Column)이 없습니다.'}
              </div>
            </div>

            {/* Column: TOP-N / manual */}
            <div className='mt-3 border-t border-gray-200 pt-3'>
              <div className='mb-2 text-sm font-semibold text-gray-900'>Column 값 선택</div>
              <p className='mb-3 text-xs text-gray-500'>
                상위 N개만 사용할지, 개별 항목을 직접 선택할지 정할 수 있습니다. (최대 6개)
              </p>

              <div className='mb-3 flex gap-3 text-sm'>
                <button
                  type='button'
                  onClick={() => setLocalColMode('topN')}
                  className={[
                    'rounded-full border px-3 py-1',
                    localColMode === 'topN'
                      ? 'border-blue bg-blue-50 text-blue'
                      : 'border-gray-300 text-gray-700',
                  ].join(' ')}
                >
                  TOP-N
                </button>
                <button
                  type='button'
                  onClick={() => setLocalColMode('manual')}
                  className={[
                    'rounded-full border px-3 py-1',
                    localColMode === 'manual'
                      ? 'border-blue bg-blue-50 text-blue'
                      : 'border-gray-300 text-gray-700',
                  ].join(' ')}
                >
                  직접 선택
                </button>
              </div>

              {localColMode === 'topN' && (
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-gray-700'>상위</span>
                  <input
                    type='number'
                    min={1}
                    max={6}
                    value={localColTopN}
                    onChange={(e) => {
                      let v = parseInt(e.target.value, 10)
                      if (Number.isNaN(v) || v <= 0) v = 1
                      if (v > 6) v = 6
                      setLocalColTopN(v)
                    }}
                    className='w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-800 outline-none focus:border-blue focus:ring-1 focus:ring-blue'
                  />
                  <span className='text-gray-700'>개 항목 사용</span>
                </div>
              )}

              {localColMode === 'manual' && (
                <div className='mt-2 rounded-md border border-gray-200 bg-white'>
                  <div className='flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs text-gray-700'>
                    <span>값 선택 ({localColSelectedItems.length}/6)</span>
                    <button
                      type='button'
                      onClick={toggleColAllItems}
                      className='rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'
                    >
                      전체 선택/해제
                    </button>
                  </div>
                  <div className='h-60 overflow-auto text-sm' onScroll={handleScrollColDistinct}>
                    {isColDistinctLoading && (
                      <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                        로딩 중…
                      </div>
                    )}
                    {!isColDistinctLoading &&
                      colDistinctItems.map((v) => {
                        const checked = isColItemChecked(v)
                        return (
                          <label
                            key={v}
                            className='flex cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm first:border-t-0 hover:bg-gray-50'
                          >
                            <input
                              type='checkbox'
                              className='sr-only'
                              checked={checked}
                              onChange={() => toggleColItem(v)}
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
                    {!isColDistinctLoading && !colDistinctItems.length && (
                      <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                        선택 가능한 값이 없습니다
                      </div>
                    )}
                    {isColFetchingNext && (
                      <div className='py-2 text-center text-xs text-gray-400'>더 불러오는 중…</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Row 축 */}
            <div className='mt-6 border-t border-gray-200 pt-3'>
              <div className='mb-2 text-sm font-semibold text-gray-900'>2. Row (행) 축</div>
              <p className='mb-2 text-xs text-gray-500'>
                피벗에서 선택한 행 필드 중 하나를 Row 축으로 사용합니다.
              </p>

              {/* Row 필드 드롭다운 */}
              <div className='mb-3'>
                <label className='mb-1 block text-xs font-medium text-gray-700'>Row 축 필드</label>
                <div className='relative'>
                  <button
                    type='button'
                    disabled={!hasRows}
                    onClick={() => hasRows && setIsRowFieldOpen((prev) => !prev)}
                    className={[
                      'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
                      'text-gray-800 outline-none',
                      !hasRows
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white hover:bg-gray-50 focus:border-blue-light focus:ring-1 focus:ring-blue-light',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={localRowField ? '' : 'text-gray-400'}>
                      {(() => {
                        if (!hasRows) return '선택 가능한 행 필드가 없습니다'
                        if (!localRowField) return '행 필드를 선택하세요'
                        const found = rows.find((r) => r.field === localRowField)
                        return found?.field ?? localRowField
                      })()}
                    </span>
                    <ArrowDownIcon
                      className={[
                        'h-3 w-3 transition-transform',
                        isRowFieldOpen ? 'rotate-180 text-gray-500' : 'text-gray-400',
                      ].join(' ')}
                    />
                  </button>
                  {isRowFieldOpen && hasRows && (
                    <div className='absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white text-xs shadow'>
                      {rows.map((r) => (
                        <button
                          key={r.field}
                          type='button'
                          className='block w-full px-3 py-2 text-left text-[13px] text-gray-800 hover:bg-gray-50'
                          onClick={() => {
                            setLocalRowField(r.field)
                            setLocalRowSelectedItems([])
                            setIsRowFieldOpen(false)
                          }}
                        >
                          {r.field}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row: TOP-N / manual */}
              <div className='mb-3 flex gap-3 text-sm'>
                <button
                  type='button'
                  onClick={() => setLocalRowMode('topN')}
                  className={[
                    'rounded-full border px-3 py-1',
                    localRowMode === 'topN'
                      ? 'border-blue bg-blue-50 text-blue'
                      : 'border-gray-300 text-gray-700',
                  ].join(' ')}
                >
                  TOP-N
                </button>
                <button
                  type='button'
                  onClick={() => setLocalRowMode('manual')}
                  className={[
                    'rounded-full border px-3 py-1',
                    localRowMode === 'manual'
                      ? 'border-blue bg-blue-50 text-blue'
                      : 'border-gray-300 text-gray-700',
                  ].join(' ')}
                >
                  직접 선택
                </button>
              </div>

              {localRowMode === 'topN' && (
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-gray-700'>상위</span>
                  <input
                    type='number'
                    min={1}
                    max={5}
                    value={localRowTopN}
                    onChange={(e) => {
                      let v = parseInt(e.target.value, 10)
                      if (Number.isNaN(v) || v <= 0) v = 1
                      if (v > 5) v = 5
                      setLocalRowTopN(v)
                    }}
                    className='w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-800 outline-none focus:border-blue focus:ring-1 focus:ring-blue'
                  />
                  <span className='text-gray-700'>개 항목 사용</span>
                </div>
              )}

              {localRowMode === 'manual' && (
                <div className='mt-2 rounded-md border border-gray-200 bg-white'>
                  <div className='flex items-center justify-between border-b border-gray-200 px-3 py-2 text-xs text-gray-700'>
                    <span>값 선택</span>
                    <button
                      type='button'
                      onClick={toggleRowAllItems}
                      className='rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50'
                    >
                      전체 선택/해제
                    </button>
                  </div>
                  <div className='h-60 overflow-auto text-sm' onScroll={handleScrollRowDistinct}>
                    {isRowDistinctLoading && (
                      <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                        로딩 중…
                      </div>
                    )}
                    {!isRowDistinctLoading &&
                      rowDistinctItems.map((v) => {
                        const checked = isRowItemChecked(v)
                        return (
                          <label
                            key={v}
                            className='flex cursor-pointer items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm first:border-t-0 hover:bg-gray-50'
                          >
                            <input
                              type='checkbox'
                              className='sr-only'
                              checked={checked}
                              onChange={() => toggleRowItem(v)}
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
                    {!isRowDistinctLoading && !rowDistinctItems.length && (
                      <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                        선택 가능한 값이 없습니다
                      </div>
                    )}
                    {isRowFetchingNext && (
                      <div className='py-2 text-center text-xs text-gray-400'>더 불러오는 중…</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Value + Chart Type */}
          <section className='flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
            {/* 3. Value 지표 */}
            <div>
              <div className='text-sm font-semibold text-gray-900'>3. Value 지표</div>
              <p className='mt-1 text-xs text-gray-500'>
                차트에 사용할 집계 값을 선택하세요. 단일 지표만 지원합니다.
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
                      type='radio'
                      name='pivot-metric'
                      className='sr-only'
                      checked={!!checked}
                      onChange={() => toggleMetric(v.field, v.agg, v.alias)}
                    />
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
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

            {/* 4. 차트 타입 */}
            <div className='mt-2 border-t border-gray-200 pt-3'>
              <div className='text-sm font-semibold text-gray-900'>4. 차트 타입</div>
              <p className='mt-1 text-xs text-gray-500'>
                선택한 축/지표에 어울리는 차트 유형을 선택해보세요.
              </p>
              <div className='mt-3 flex flex-wrap gap-2 text-sm'>
                {chartTypeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type='button'
                    onClick={() => setLocalChartType(opt.key)}
                    className={[
                      'rounded-full border px-3 py-1',
                      localChartType === opt.key
                        ? 'border-blue bg-blue-50 text-blue'
                        : 'border-gray-300 text-gray-700 hover:bg-white',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* 선택된 차트 타입의 미리보기 이미지 */}
              {localChartType && (
                <div className='mt-4 rounded-lg border border-gray-200 bg-white p-4'>
                  <img
                    src={chartTypeOptions.find((opt) => opt.key === localChartType)?.image}
                    alt={chartTypeOptions.find((opt) => opt.key === localChartType)?.label}
                    className='w-full h-auto object-contain'
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PivotChartConfigModal
