import React, { useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { buildPivotColumns } from '@/utils/buildPivotColumns.jsx'
import { buildPivotRows } from '@/utils/buildPivotRows.js'

const PivotResultTable = ({ pivotResult }) => {
  const columns = useMemo(() => buildPivotColumns(pivotResult), [pivotResult])
  const data = useMemo(() => buildPivotRows(pivotResult), [pivotResult])

  const table = useReactTable({
    data,
    columns,

    getSubRows: (row) => row.subRows ?? [],

    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),

    getRowCanExpand: (row) => (row.original?.subRows?.length ?? 0) > 0,
  })

  return (
    <div className='rounded-lg border border-gray-300'>
      <div className='overflow-x-auto w-full'>
        <table className='min-w-max border-collapse text-sm text-gray-800'>
          <thead className='bg-gray-50 text-gray-700 text-left align-bottom'>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className='border-b border-gray-200'>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className='px-3 py-2 font-medium text-gray-700 align-bottom border-r last:border-r-0 border-gray-200 whitespace-nowrap'
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
                    className='px-3 py-2 align-middle border-r last:border-r-0 border-gray-100 whitespace-nowrap'
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
