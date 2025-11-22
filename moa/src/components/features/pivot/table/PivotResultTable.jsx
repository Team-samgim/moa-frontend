import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import SortColumnAscIcon from '@/assets/icons/asc-horizontal.svg?react'
import SortColumnDescIcon from '@/assets/icons/desc-horizontal.svg?react'
import SortColumnIcon from '@/assets/icons/sort-horizontal.svg?react'

import PivotInfiniteScrollRow from '@/components/features/pivot/table/PivotInfiniteScrollRow'
import { ROW_INFINITE_THRESHOLD } from '@/constants/pivot'
import { useRowGroupItems } from '@/hooks/queries/usePivot'
import { usePivotTimePayload } from '@/hooks/usePivotTimePayload'
import { useStickyGroup } from '@/hooks/useStickyGroup'
import { usePivotStore } from '@/stores/pivotStore'
import { buildPivotColumns } from '@/utils/buildPivotColumns.jsx'
import { buildPivotRows } from '@/utils/buildPivotRows.js'

const PivotResultTable = ({ pivotResult }) => {
  const [tableData, setTableData] = useState([])
  const [infiniteQueries, setInfiniteQueries] = useState({})

  const [colSort, setColSort] = useState('default')
  const [expanded, setExpanded] = useState({})
  const [metricSort, setMetricSort] = useState(null)

  const layer = usePivotStore((s) => s.layer)
  const timeRange = usePivotStore((s) => s.timeRange)
  const customRange = usePivotStore((s) => s.customRange)
  const column = usePivotStore((s) => s.column)
  const values = usePivotStore((s) => s.values)
  const filters = usePivotStore((s) => s.filters)

  const { mutateAsync: fetchItemsAll } = useRowGroupItems()

  const handleToggleMetricSort = useCallback((columnValue, metric) => {
    setMetricSort((prev) => {
      const isSame =
        prev &&
        prev.columnValue === columnValue &&
        prev.metricAlias === metric.alias &&
        prev.metricField === metric.field &&
        prev.agg === metric.agg

      // 1. desc 정렬
      if (!isSame) {
        return {
          columnValue,
          metricAlias: metric.alias,
          metricField: metric.field,
          agg: metric.agg,
          direction: 'desc',
        }
      }

      // 2. asc 정렬
      if (prev.direction === 'desc') {
        return { ...prev, direction: 'asc' }
      }

      // 3. 정렬 해제
      return null
    })
  }, [])

  useEffect(() => {
    const rows = buildPivotRows(pivotResult)
    setTableData(rows)
  }, [pivotResult])

  useEffect(() => {
    setTableData((prev) =>
      prev.map((row) => ({
        ...row,
        subRows: [],
        isLoaded: false,
        isLoading: false,
        infiniteMode: false,
      })),
    )
    setInfiniteQueries({})
  }, [metricSort])

  const columnFieldName = pivotResult?.columnField?.name ?? ''

  useEffect(() => {
    setColSort('default')
  }, [columnFieldName])

  useEffect(() => {
    setExpanded({})
  }, [metricSort])

  const handleToggleColSort = () => {
    setColSort((prev) => {
      if (prev === 'default') return 'asc'
      if (prev === 'asc') return 'desc'
      return 'default'
    })
  }

  const sortedColumnValues = useMemo(() => {
    const original = pivotResult?.columnField?.values ?? []
    if (!original.length) return original

    if (colSort === 'default') return original

    const copy = [...original]

    copy.sort((a, b) => {
      const av = a ?? ''
      const bv = b ?? ''

      // "(empty)" 또는 빈 값은 항상 뒤로
      const isAEmpty = av === '' || av === null
      const isBEmpty = bv === '' || bv === null

      if (isAEmpty && !isBEmpty) return 1
      if (!isAEmpty && isBEmpty) return -1
      if (isAEmpty && isBEmpty) return 0

      return colSort === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

    return copy
  }, [pivotResult?.columnField?.values, colSort])

  const timePayload = usePivotTimePayload(pivotResult, timeRange, customRange)

  const sortPayload = useMemo(() => {
    if (!metricSort || !metricSort.direction) return null

    return {
      mode: 'value',
      columnValue: metricSort.columnValue,
      valueField: metricSort.metricField,
      agg: metricSort.agg,
      direction: metricSort.direction,
    }
  }, [metricSort])

  const loadAllItems = useCallback(
    async (row) => {
      const rowData = row.original

      setTableData((prev) =>
        prev.map((r) => (r.rowField === rowData.rowField ? { ...r, isLoading: true } : r)),
      )

      try {
        const payload = {
          layer,
          rowField: rowData.rowField,
          time: timePayload,
          column,
          values,
          filters,
          sort: sortPayload,
        }

        const response = await fetchItemsAll(payload)

        const subRows = (response.items || []).map((item) => ({
          displayLabel: item.displayLabel,
          cells: item.cells,
          rowField: item.valueLabel,
          hasChildren: false,
          subRows: [],
        }))

        setTableData((prev) =>
          prev.map((r) =>
            r.rowField === rowData.rowField
              ? {
                  ...r,
                  subRows,
                  isLoading: false,
                  isLoaded: true,
                  infiniteMode: false,
                }
              : r,
          ),
        )

        setTimeout(() => row.toggleExpanded(), 0)
      } catch (error) {
        console.error('[loadAllItems] Error:', error)
        setTableData((prev) =>
          prev.map((r) => (r.rowField === rowData.rowField ? { ...r, isLoading: false } : r)),
        )
      }
    },
    [layer, timePayload, column, values, filters, fetchItemsAll, sortPayload],
  )

  // 무한스크롤 모드 활성화
  const enableInfiniteScroll = useCallback((row) => {
    const rowData = row.original

    setTableData((prev) =>
      prev.map((r) =>
        r.rowField === rowData.rowField
          ? {
              ...r,
              isLoading: false,
              isLoaded: true,
              infiniteMode: true,
              subRows: [], // 빈 배열로 시작
            }
          : r,
      ),
    )

    // 무한스크롤 쿼리 활성화
    setInfiniteQueries((prev) => ({
      ...prev,
      [rowData.rowField]: true,
    }))

    setTimeout(() => row.toggleExpanded(), 0)
  }, [])

  const handleExpandRow = useCallback(
    async (row) => {
      const rowData = row.original
      const itemCount = rowData.rowInfo?.count ?? 0

      // 이미 로드됨: 단순 토글
      if (rowData.isLoaded) {
        row.toggleExpanded()
        return
      }

      if (rowData.isLoading) return

      // 소량 데이터 (<= threshold): 전체 로드
      if (itemCount <= ROW_INFINITE_THRESHOLD) {
        await loadAllItems(row)
      }
      // 대량 데이터 (> threshold): 무한스크롤 모드
      else {
        enableInfiniteScroll(row)
      }
    },
    [loadAllItems, enableInfiniteScroll],
  )

  // 테이블 컬럼 계산
  const columns = useMemo(() => {
    return buildPivotColumns(
      pivotResult,
      handleExpandRow,
      sortedColumnValues,
      metricSort,
      handleToggleMetricSort,
    )
  }, [pivotResult, handleExpandRow, sortedColumnValues, metricSort, handleToggleMetricSort])

  const table = useReactTable({
    data: tableData,
    columns,
    getSubRows: (row) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => row.original?.hasChildren ?? false,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
  })

  const headerGroups = table.getHeaderGroups()
  const topGroup = headerGroups[0] ?? { headers: [] }
  const subGroup = headerGroups[1] ?? { headers: [] }

  const rows = table.getRowModel().rows
  const tableContainerRef = useRef(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 10,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0

  const stickyGroup = useStickyGroup(virtualRows, rows)

  // 테이블 최소 너비 계산
  const tableMinWidth = useMemo(() => {
    const indexColWidth = 80
    const rowLabelWidth = 300
    const metricsCount = columns.slice(2).reduce((acc, col) => {
      return acc + (col.columns?.length || 0)
    }, 0)
    const metricsWidth = metricsCount * 210

    return indexColWidth + rowLabelWidth + metricsWidth
  }, [columns])

  const tableStyle = {
    tableLayout: 'fixed',
    minWidth: `${tableMinWidth}px`,
  }

  return (
    <div className='rounded-lg border overflow-hidden border-gray-300'>
      <div className='overflow-x-auto w-full'>
        <div ref={tableContainerRef} className='max-h-160 overflow-y-auto'>
          <table
            className='min-w-max border-collapse text-sm text-gray-800 w-full'
            style={tableStyle}
          >
            <thead
              className='bg-gray-50 text-gray-700 text-left align-bottom sticky top-0 z-10'
              style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
            >
              <tr
                className='border-b border-gray-200'
                style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
              >
                <th
                  rowSpan={2}
                  className='
                    px-3 py-2 font-medium text-gray-700 align-middle
                    border-r border-b border-gray-200
                    whitespace-nowrap text-left bg-gray-50
                  '
                  style={{ width: '60px' }}
                ></th>

                <th
                  rowSpan={2}
                  className='
                    px-3 py-2 font-medium text-gray-700 align-middle
                    border-r border-b border-gray-200
                    whitespace-nowrap text-left bg-gray-50
                  '
                  style={{ width: '250px', minWidth: '250px', maxWidth: '250px' }}
                >
                  <div className='flex items-center gap-1 overflow-hidden' title={columnFieldName}>
                    <span className='truncate'>{columnFieldName}</span>

                    {columnFieldName && (
                      <button
                        type='button'
                        onClick={handleToggleColSort}
                        className='ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100 flex-shrink-0'
                      >
                        {colSort === 'default' && (
                          <SortColumnIcon className='h-4 w-4 text-[#242424]' />
                        )}
                        {colSort === 'asc' && (
                          <SortColumnAscIcon className='h-4 w-4 text-[#242424]' />
                        )}
                        {colSort === 'desc' && (
                          <SortColumnDescIcon className='h-4 w-4 text-[#242424]' />
                        )}
                      </button>
                    )}
                  </div>
                </th>

                {topGroup.headers.slice(2).map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50 overflow-hidden'
                    style={{ maxWidth: `${header.colSpan * 150}px` }}
                    title={
                      header.isPlaceholder
                        ? ''
                        : typeof header.column.columnDef.header === 'string'
                          ? header.column.columnDef.header
                          : ''
                    }
                  >
                    <div className='truncate'>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                ))}
              </tr>

              <tr
                className='border-b border-gray-200'
                style={{ boxShadow: 'inset 0 -1px 0 0 #e5e7eb' }}
              >
                {subGroup.headers.slice(2).map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left bg-gray-50 overflow-hidden'
                    style={{ width: '150px', minWidth: '150px', maxWidth: '150px' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className='bg-white'>
              {/* Sticky 그룹 헤더 */}
              {stickyGroup && (
                <tr
                  className='border-b border-gray-200 text-gray-800 bg-white'
                  style={{
                    position: 'sticky',
                    top: 72,
                    zIndex: 15,
                  }}
                >
                  {stickyGroup.row.getVisibleCells().map((cell, cellIndex) => {
                    const isRowGroupCell = cellIndex === 1
                    const cellValue =
                      typeof cell.getValue === 'function' ? cell.getValue() : cell.getValue

                    return (
                      <td
                        key={`sticky-${cell.id}`}
                        className='px-3 py-2 align-middle border-r last:border-r-0 whitespace-nowrap bg-white overflow-hidden'
                        style={{
                          boxShadow: 'inset 0 -1px 0 0 #e5e7eb',
                        }}
                        title={cellValue}
                      >
                        {isRowGroupCell ? (
                          <div
                            className='overflow-hidden text-ellipsis'
                            style={
                              stickyGroup.row.depth > 0
                                ? {
                                    paddingLeft: `${stickyGroup.row.depth * 25}px`,
                                  }
                                : undefined
                            }
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ) : (
                          <div className='overflow-hidden text-ellipsis'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )}

              {paddingTop > 0 && (
                <tr>
                  <td
                    style={{ height: `${paddingTop}px` }}
                    colSpan={table.getVisibleLeafColumns().length}
                  />
                </tr>
              )}

              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                const isGroupRow = row.depth === 0
                const parentRow = row.getParentRow?.()
                const groupRow = isGroupRow ? row : parentRow
                const groupData = groupRow?.original
                const isGroupExpanded = groupRow?.getIsExpanded?.() ?? false

                const nextRow = rows[virtualRow.index + 1]
                const sameGroupNext =
                  nextRow &&
                  nextRow.getParentRow?.() &&
                  groupRow &&
                  nextRow.getParentRow().id === groupRow.id

                const isLastSubRowOfGroup = row.depth === 1 && !sameGroupNext

                const shouldRenderSentinel =
                  groupData?.infiniteMode &&
                  isGroupExpanded &&
                  ((isGroupRow && (groupData.subRows?.length ?? 0) === 0) ||
                    (!isGroupRow && isLastSubRowOfGroup))

                return (
                  <React.Fragment key={row.id}>
                    <tr className='border-b border-gray-200 text-gray-800'>
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isRowGroupCell = cellIndex === 1
                        const cellValue =
                          typeof cell.getValue === 'function' ? cell.getValue() : cell.getValue

                        return (
                          <td
                            key={cell.id}
                            className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100 whitespace-nowrap overflow-hidden'
                            title={cellValue}
                          >
                            {isRowGroupCell ? (
                              <div
                                className='overflow-hidden text-ellipsis'
                                style={
                                  row.depth > 0 ? { paddingLeft: `${row.depth * 25}px` } : undefined
                                }
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            ) : (
                              <div className='overflow-hidden text-ellipsis'>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>

                    {shouldRenderSentinel && (
                      <PivotInfiniteScrollRow
                        rowField={groupData.rowField}
                        layer={layer}
                        time={timePayload}
                        column={column}
                        values={values}
                        filters={filters}
                        sort={sortPayload}
                        enabled={infiniteQueries[groupData.rowField]}
                        colSpan={table.getVisibleLeafColumns().length}
                        onDataLoaded={(newItems) => {
                          setTableData((prev) =>
                            prev.map((r) => {
                              if (r.rowField !== groupData.rowField) return r
                              const existing = new Set(r.subRows.map((s) => s.displayLabel))
                              const uniq = newItems.filter((it) => !existing.has(it.displayLabel))
                              return {
                                ...r,
                                subRows: [...r.subRows, ...uniq],
                              }
                            }),
                          )
                        }}
                      />
                    )}
                  </React.Fragment>
                )
              })}

              {paddingBottom > 0 && (
                <tr>
                  <td
                    style={{ height: `${paddingBottom}px` }}
                    colSpan={table.getVisibleLeafColumns().length}
                  />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pivotResult?.summary?.rowCountText && (
        <div className='border-t border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600'>
          {pivotResult.summary.rowCountText}
        </div>
      )}
    </div>
  )
}

export default PivotResultTable
