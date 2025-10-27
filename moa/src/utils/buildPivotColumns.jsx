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

  const dynamicCols = []
  for (const colVal of columnField.values) {
    for (const metric of columnField.metrics) {
      dynamicCols.push({
        id: `${colVal}__${metric.alias}`, // unique id
        header: () => (
          <div className='text-center'>
            <div className='font-medium'>{colVal}</div>
            <div className='text-xs text-gray-500'>{metric.alias}</div>
          </div>
        ),
        accessorFn: (row) => {
          // row.cells["ip_num_1"]["합계: total"]
          return row.cells?.[colVal]?.[metric.alias] ?? null
        },
        cell: ({ getValue }) => {
          const v = getValue()
          return (
            <div className='text-right tabular-nums'>{v === null || v === undefined ? '' : v}</div>
          )
        },
      })
    }
  }

  return [firstCol, ...dynamicCols]
}
