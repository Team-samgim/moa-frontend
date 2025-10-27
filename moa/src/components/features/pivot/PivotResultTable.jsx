import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
} from '@tanstack/react-table'
import { buildPivotColumns } from '@/utils/buildPivotColumns'
import { buildPivotRows } from '@/utils/buildPivotRows'

const PivotResultTable = ({ pivotResult }) => {
  const columns = buildPivotColumns(pivotResult)
  const data = buildPivotRows(pivotResult)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => row.original?.subRows?.length > 0,
  })

  return (
    <div className='rounded-lg border border-gray-300 overflow-hidden'>
      <table className='min-w-full border-collapse text-sm text-gray-800'>
        <thead className='bg-gray-50 text-gray-700 text-left align-bottom'>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className='border-b border-gray-200'>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className='px-3 py-2 font-medium text-gray-700 align-bottom border-r last:border-r-0 border-gray-200'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className='bg-white'>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className='border-b border-gray-200 text-gray-800'>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100'
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* summary 영역 */}
      {pivotResult?.summary?.rowCountText && (
        <div className='border-t border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-600'>
          {pivotResult.summary.rowCountText}
        </div>
      )}
    </div>
  )
}

export default PivotResultTable
