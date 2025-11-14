import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'

// 샘플 데이터 + Region 파생
const raw = [
  ['Country', 'Sales', 'Profit'],
  ['Korea', 200, 50],
  ['USA', 300, 80],
  ['Japan', 150, 40],
]
const regionOf = (c) => (c === 'USA' ? 'NA' : 'APAC')
const rows = raw.slice(1).map((r) => ({
  Region: regionOf(r[0]),
  Country: r[0],
  Sales: Number(r[1]),
  Profit: Number(r[2]),
}))

const TestPage2 = () => {
  // 행 필드 선택: depth=1(Region) 또는 depth=2(Region→Country)
  const [grouping, setGrouping] = React.useState(['Region', 'Country'])
  const [expanded, setExpanded] = React.useState({}) // {}면 그룹행만 표시

  // 1) 숨김(원천) 차원 컬럼: 그룹핑/값 조회용
  const dimensionColumns = React.useMemo(
    () =>
      ['Region', 'Country'].map((key) => ({
        accessorKey: key,
        header: key,
        enableHiding: true,
      })),
    [],
  )

  // 2) 실제 화면에 보이는 "하나의 계층 컬럼"
  const hierarchyColumn = React.useMemo(
    () => [
      {
        id: '__hierarchy',
        header: 'ITEM',
        size: 280,
        cell: ({ row, table }) => {
          const levels = table.getState().grouping
          // 현재 행의 레벨(0,1,2...)
          const level = row.depth
          const lastLevel = Math.max(0, levels.length - 1)
          // 이 행에서 표시할 차원 id (그룹행이면 해당 레벨, 리프면 마지막 레벨)
          const dimId = row.getCanExpand() ? levels[level] : levels[lastLevel]

          const label = String(row.getValue(dimId) ?? '')
          return (
            <div className='flex items-center' style={{ paddingLeft: level * 12 }}>
              {row.getCanExpand() && (
                <button
                  onClick={row.getToggleExpandedHandler()}
                  className='mr-1 text-xs text-gray-500'
                  aria-label='toggle'
                >
                  {row.getIsExpanded() ? '▼' : '▶'}
                </button>
              )}
              <span className={row.getCanExpand() ? 'font-medium' : ''}>{label}</span>
            </div>
          )
        },
      },
    ],
    [],
  )

  // 3) 값(집계) 컬럼
  const valueColumns = React.useMemo(
    () => [
      {
        accessorKey: 'Sales',
        header: 'Sales (SUM)',
        aggregationFn: 'sum',
        aggregatedCell: ({ getValue }) => <b>{getValue() ?? 0}</b>,
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: 'Profit',
        header: 'Profit (SUM)',
        aggregationFn: 'sum',
        aggregatedCell: ({ getValue }) => <b>{getValue() ?? 0}</b>,
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
    ],
    [],
  )

  // 4) 전체 컬럼 구성: [숨김 차원] + [계층 1컬럼] + [값 컬럼들]
  const columns = React.useMemo(
    () => [...dimensionColumns, ...hierarchyColumn, ...valueColumns],
    [dimensionColumns, hierarchyColumn, valueColumns],
  )

  // 숨김 설정: 차원 컬럼은 화면에서 가림
  const [columnVisibility, setColumnVisibility] = React.useState({
    Region: false,
    Country: false,
  })

  const table = useReactTable({
    data: rows,
    columns,
    state: { grouping, expanded, columnVisibility },
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  })

  const grandSales = table
    .getGroupedRowModel()
    .rows.reduce((a, r) => a + (r.getValue('Sales') ?? 0), 0)
  const grandProfit = table
    .getGroupedRowModel()
    .rows.reduce((a, r) => a + (r.getValue('Profit') ?? 0), 0)

  return (
    <div className='max-w-3xl'>
      <h3 className='mb-3 text-base font-semibold'>One-Column Tree Pivot</h3>

      {/* Row 필드 on/off → depth 조절 */}
      <div className='mb-3 flex items-center gap-4 rounded-lg border border-gray-200 p-3'>
        <div className='text-xs font-semibold text-gray-600'>Rows</div>
        {['Region', 'Country'].map((id) => (
          <label key={id} className='inline-flex items-center gap-1 text-sm'>
            <input
              type='checkbox'
              className='size-4'
              checked={grouping.includes(id)}
              onChange={() =>
                setGrouping((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
              }
            />
            {id}
          </label>
        ))}
        <span className='ml-auto text-[11px] text-gray-500'>
          체크 수 = 트리 깊이(depth). 계층은 <b>왼쪽 1컬럼</b>에만 표시됩니다.
        </span>
      </div>

      {/* 테이블 */}
      <div className='overflow-x-auto rounded-lg border border-gray-200'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-50 text-left'>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className='px-3 py-2 font-medium text-gray-700'>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className='divide-y divide-gray-100'>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id} className='hover:bg-gray-50'>
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className='px-3 py-2'>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot className='bg-gray-50'>
            <tr>
              <td className='px-3 py-2 font-semibold'>Grand Total</td>
              <td className='px-3 py-2 font-semibold'>{grandSales}</td>
              <td className='px-3 py-2 font-semibold'>{grandProfit}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className='mt-2 text-xs text-gray-500'>
        REGION을 펼치면 바로 그 <b>아래 줄</b>에 해당 Region이 나타나고, 또 펼치면 그 아래에
        COUNTRY가 이어지는 <b>단일 컬럼 트리</b> 형태로 렌더링됩니다.
      </p>
    </div>
  )
}

export default TestPage2
