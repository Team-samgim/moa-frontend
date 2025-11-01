export function buildPivotColumns(pivotResult) {
  if (!pivotResult) return []

  const { columnField } = pivotResult
  if (!columnField) return []

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
              {isExpanded ? '▼' : '▶'}
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

  return [firstCol, ...groupedCols]
}
