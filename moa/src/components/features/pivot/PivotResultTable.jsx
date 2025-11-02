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
  const data = useMemo(() => buildPivotRows(pivotResult), [pivotResult])

  const table = useReactTable({
    data,
    columns: [],
    getSubRows: (row) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => (row.original?.subRows?.length ?? 0) > 0,
  })

  const visibleIndexMap = useMemo(() => {
    const map = {}
    table.getRowModel().rows.forEach((r, i) => {
      map[r.id] = i + 1
    })
    return map
  }, [table])

  const columns = useMemo(() => {
    return buildPivotColumns(pivotResult, table, visibleIndexMap)
  }, [pivotResult, table, visibleIndexMap])

  table.setOptions((prev) => ({
    ...prev,
    data,
    columns,
  }))

  const headerGroups = table.getHeaderGroups()
  const topGroup = headerGroups[0] ?? { headers: [] }
  const subGroup = headerGroups[1] ?? { headers: [] }

  return (
    <div className='rounded-lg border border-gray-300'>
      <div className='overflow-x-auto w-full'>
        <table className='min-w-max border-collapse text-sm text-gray-800'>
          <thead className='bg-gray-50 text-gray-700 text-left align-bottom'>
            {/* === 첫 번째 줄 === */}
            <tr className='border-b border-gray-200'>
              <th
                rowSpan={2}
                className='px-3 py-2 font-medium text-gray-700 align-middle border-r border-gray-200 whitespace-nowrap text-left'
              ></th>
              <th
                rowSpan={2}
                className='px-3 py-2 font-medium text-gray-700 align-middle border-r border-gray-200 whitespace-nowrap text-left'
              >
                {pivotResult?.columnField?.name ?? ''}
              </th>
              {topGroup.headers.slice(2).map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>

            {/* === 두 번째 줄 === */}
            <tr className='border-b border-gray-200'>
              {subGroup.headers.slice(2).map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className='px-3 py-2 font-medium text-gray-700 align-middle border-r last:border-r-0 border-gray-200 whitespace-nowrap text-left'
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
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
