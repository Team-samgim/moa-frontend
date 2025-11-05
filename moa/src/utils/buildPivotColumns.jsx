import ArrowDownIcon from '@/assets/icons/arrow-down-bold.svg?react'
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react'

export function buildPivotColumns(pivotResult, onExpandRow) {
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

  const groupedCols = columnField.values.map((colVal, colIndex) => ({
    id: `${colIndex}::${colVal || '(empty)'}`,
    header: colVal || '(empty)',
    columns: (columnField.metrics || []).map((metric, metricIndex) => ({
      id: `${colIndex}::${metricIndex}::${colVal || '(empty)'}__${metric.alias}`,
      header: metric.alias,
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
