import ArrowDownIcon from '@/assets/icons/arrow-down-bold.svg?react'
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react'
import SortAscIcon from '@/assets/icons/asc.svg?react'
import SortDescIcon from '@/assets/icons/desc.svg?react'
import SortIcon from '@/assets/icons/sort.svg?react'

export function buildPivotColumns(
  pivotResult,
  onExpandRow,
  sortedColumnValues,
  metricSort,
  onToggleMetricSort,
) {
  if (!pivotResult) return []

  const { columnField } = pivotResult
  if (!columnField) return []

  const indexCol = {
    id: 'rowNumber',
    header: '#',
    size: 50,
    minSize: 50,
    maxSize: 60,
    cell: ({ row, table }) => {
      const visibleRows = table.getRowModel().rows
      const idx = visibleRows.findIndex((r) => r.id === row.id)
      const n = idx === -1 ? '' : idx + 1

      return <div className='text-right text-gray-500 tabular-nums w-full'>{n}</div>
    },
  }

  const firstCol = {
    id: 'rowLabel',
    header: columnField.name,
    accessorFn: (row) => row.displayLabel,
    cell: ({ row, getValue }) => {
      const canExpand = row.getCanExpand()
      const isExpanded = row.getIsExpanded()
      const isLoading = row.original?.isLoading

      const handleClick = (e) => {
        e.stopPropagation()
        if (isLoading) return

        if (isExpanded) {
          row.toggleExpanded()
        } else {
          if (onExpandRow) {
            onExpandRow(row)
          } else {
            row.toggleExpanded()
          }
        }
      }

      return (
        <div className='flex items-center gap-1'>
          {canExpand && (
            <button
              onClick={handleClick}
              className='text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50'
              disabled={isLoading}
            >
              {isExpanded ? (
                <ArrowDownIcon className='w-4.5 h-4.5' />
              ) : (
                <ArrowRightIcon className='w-4.5 h-4.5' />
              )}
            </button>
          )}
          <span>{getValue()}</span>
          {isLoading && <span className='ml-2 text-xs text-gray-500'>로딩중...</span>}
        </div>
      )
    },
  }

  const colValues =
    sortedColumnValues && sortedColumnValues.length ? sortedColumnValues : columnField.values || []

  const groupedCols = colValues.map((colVal, colIndex) => ({
    id: `${colIndex}::${colVal || '(empty)'}`,
    header: colVal || '(empty)',
    columns: (columnField.metrics || []).map((metric, metricIndex) => ({
      id: `${colIndex}::${metricIndex}::${colVal || '(empty)'}__${metric.alias}`,

      header: () => {
        const isActive =
          metricSort &&
          metricSort.columnValue === colVal &&
          metricSort.metricAlias === metric.alias &&
          metricSort.metricField === metric.field &&
          metricSort.agg === metric.agg

        const direction = isActive ? metricSort.direction : 'default'

        const handleClick = (e) => {
          e.stopPropagation()
          if (!onToggleMetricSort) return
          onToggleMetricSort(colVal, metric)
        }

        return (
          <div className='flex items-center justify-end gap-1'>
            <span>{metric.alias}</span>
            <button
              type='button'
              onClick={handleClick}
              className='ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100'
            >
              {direction === 'default' && <SortIcon className='h-4 w-4 text-[#242424]' />}
              {direction === 'desc' && <SortDescIcon className='h-4 w-4 text-[#242424]' />}
              {direction === 'asc' && <SortAscIcon className='h-4 w-4 text-[#242424]' />}
            </button>
          </div>
        )
      },

      accessorFn: (row) => row.cells?.[colVal]?.[metric.alias] ?? null,
      cell: ({ getValue }) => {
        const v = getValue()
        return (
          <div className='text-right tabular-nums'>{v === null || v === undefined ? '' : v}</div>
        )
      },
    })),
  }))

  return [indexCol, firstCol, ...groupedCols]
}
