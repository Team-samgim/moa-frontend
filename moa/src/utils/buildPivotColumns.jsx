import ArrowDownIcon from '@/assets/icons/arrow-down-bold.svg?react'
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react'

export function buildPivotColumns(pivotResult) {
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
      return (
        <div className='flex items-center gap-1'>
          {canExpand && (
            <button onClick={row.getToggleExpandedHandler()} className='text-gray-600'>
              {isExpanded ? (
                <ArrowDownIcon className='w-4.5 h-4.5' />
              ) : (
                <ArrowRightIcon className='w-4.5 h-4.5' />
              )}
            </button>
          )}
          <span>{getValue()}</span>
        </div>
      )
    },
  }

  const groupedCols = columnField.values.map((colVal) => ({
    id: colVal || '(empty)',
    header: colVal || '(empty)',
    columns: columnField.metrics.map((metric) => ({
      id: `${colVal}__${metric.alias}`,
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
