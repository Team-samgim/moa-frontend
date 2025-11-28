// 작성자: 최이서
// 피벗 데이터를 히트맵 테이블 형식으로 표시하는 모달 컴포넌트

import { useEffect, useMemo } from 'react'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import { usePivotHeatmapTable } from '@/hooks/queries/useCharts'
import { usePivotStore } from '@/stores/pivotStore'

const PivotHeatmapTableModal = ({ isOpen, onClose }) => {
  const layer = usePivotStore((s) => s.layer)
  const column = usePivotStore((s) => s.column)
  const rowsConfig = usePivotStore((s) => s.rows)
  const values = usePivotStore((s) => s.values)

  const colField = column?.field || null
  const rowField = Array.isArray(rowsConfig) && rowsConfig.length > 0 ? rowsConfig[0].field : null
  const metric = Array.isArray(values) && values.length > 0 ? values[0] : null

  const metricLabel = metric
    ? metric.alias || `${metric.agg?.toUpperCase()}: ${metric.field}`
    : '(선택된 값 없음)'

  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    usePivotHeatmapTable(isOpen)

  const { xCategories, flatRows, pageMin, pageMax } = useMemo(() => {
    if (!data?.pages?.length) {
      return {
        xCategories: [],
        flatRows: [],
        pageMin: null,
        pageMax: null,
      }
    }

    const firstPage = data.pages[0]
    const xCats = firstPage.xCategories || []

    const rows = []
    let min = null
    let max = null

    data.pages.forEach((page) => {
      const pageRows = page.rows || []
      pageRows.forEach((r) => {
        const cells = r.cells || []
        rows.push({
          yCategory: r.yCategory,
          cells,
        })

        cells.forEach((v) => {
          if (typeof v !== 'number') return
          if (min === null || v < min) min = v
          if (max === null || v > max) max = v
        })
      })
    })

    return {
      xCategories: xCats,
      flatRows: rows,
      pageMin: min,
      pageMax: max,
    }
  }, [data])

  const tableData = useMemo(() => {
    return flatRows.map((r, rowIndex) => {
      const obj = { id: `row-${rowIndex}`, yCategory: r.yCategory }
      r.cells.forEach((v, idx) => {
        obj[`c${idx}`] = v
      })
      return obj
    })
  }, [flatRows])

  const columns = useMemo(() => {
    const cols = []

    // 로컬 함수: 값에 따라 배경색 계산
    const getCellStyle = (value) => {
      if (value === null || typeof value !== 'number' || pageMin === null || pageMax === null) {
        return { backgroundColor: 'transparent' }
      }

      let t = 0
      if (pageMax === pageMin) {
        t = 0.5
      } else {
        t = (value - pageMin) / (pageMax - pageMin)
        if (t < 0) t = 0
        if (t > 1) t = 1
      }

      const alpha = 0.15 + t * 0.55 // 0.15 ~ 0.7
      const bg = `rgba(37, 99, 235, ${alpha})`

      return { backgroundColor: bg }
    }

    // 1) Y 카테고리 컬럼 (행 헤더)
    cols.push({
      id: 'yCategory',
      header: rowField || 'Row',
      accessorKey: 'yCategory',
      cell: (info) => {
        const value = info.getValue()
        const text = value ?? ''

        return (
          <div className='px-2 py-1 text-xs font-medium text-gray-800'>
            {/* 말줄임 + hover 시 전체 값 */}
            <span className='inline-block max-w-[260px] truncate align-middle' title={text}>
              {text}
            </span>
          </div>
        )
      },
    })

    // 2) X 카테고리 컬럼들 (컬럼 헤더)
    xCategories.forEach((xc, idx) => {
      const colId = `c${idx}`

      cols.push({
        id: colId,
        // header를 문자열 대신 함수로 줘서 스타일링 가능하게
        header: () => (
          <span className='inline-block max-w-[160px] truncate align-middle' title={xc}>
            {xc}
          </span>
        ),
        accessorKey: colId,
        cell: (info) => {
          const v = info.getValue()
          const style = getCellStyle(v)

          return (
            <div
              className='flex h-7 items-center justify-end rounded-sm px-2 py-1 text-[11px] text-gray-800'
              style={style}
              title={typeof v === 'number' ? v.toLocaleString() : ''}
            >
              {typeof v === 'number' ? v.toLocaleString() : ''}
            </div>
          )
        },
      })
    })

    return cols
  }, [xCategories, rowField, pageMin, pageMax])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  const handleScroll = (e) => {
    if (!hasNextPage || isFetchingNextPage) return
    const el = e.currentTarget
    const threshold = 80 // px 정도 여유
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      fetchNextPage()
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
      <div className='flex h-[80vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-xl'>
        {/* 헤더 */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>전체보기 (테이블 히트맵)</h2>
            <p className='mt-1 text-xs text-gray-500'>
              레이어: <span className='font-medium'>{layer}</span> · 열(Column):{' '}
              <span className='font-medium'>{colField || '-'}</span> · 행(Row):{' '}
              <span className='font-medium'>{rowField || '-'}</span> · 값(Value):{' '}
              <span className='font-medium'>{metricLabel}</span>
            </p>
            {pageMin !== null && pageMax !== null && (
              <p className='mt-1 text-[11px] text-gray-400'>
                현재 로드된 데이터 기준 값 범위: {pageMin.toLocaleString()} ~{' '}
                {pageMax.toLocaleString()}
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50'
          >
            닫기
          </button>
        </div>

        {/* 본문 */}
        <div className='flex-1 min-h-0 p-4'>
          {isLoading && (
            <div className='flex h-full items-center justify-center text-xs text-gray-400'>
              히트맵 테이블 데이터를 불러오는 중입니다…
            </div>
          )}

          {isError && (
            <div className='flex h-full flex-col items-center justify-center gap-2 text-xs text-red-500'>
              <div>히트맵 테이블 데이터를 불러오지 못했습니다.</div>
              {error?.response?.data?.message && (
                <div className='max-w-md whitespace-pre-wrap text-center text-[11px] text-gray-500'>
                  {error.response.data.message}
                </div>
              )}
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {!tableData.length && (
                <div className='flex h-full items-center justify-center text-xs text-gray-400'>
                  데이터가 없습니다.
                </div>
              )}

              {tableData.length > 0 && (
                <div className='flex h-full flex-col rounded border border-gray-200'>
                  <div className='flex-1 overflow-auto' onScroll={handleScroll}>
                    <table className='min-w-full border-collapse text-xs'>
                      <thead className='sticky top-0 z-10 bg-gray-50'>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id} className='border-b border-gray-200'>
                            {headerGroup.headers.map((header) => (
                              <th
                                key={header.id}
                                className='whitespace-nowrap border-r border-gray-200 px-2 py-2 text-left text-[11px] font-semibold text-gray-700 last:border-r-0'
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {table.getRowModel().rows.map((row) => (
                          <tr
                            key={row.id}
                            className='border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60'
                          >
                            {row.getVisibleCells().map((cell) => (
                              <td
                                key={cell.id}
                                className='border-r border-gray-100 px-1 py-0.5 last:border-r-0'
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hasNextPage && (
                    <div className='border-t border-gray-200 bg-gray-50 py-2 text-center'>
                      <button
                        type='button'
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className='rounded-md border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        {isFetchingNextPage ? '더 불러오는 중…' : '더 보기'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PivotHeatmapTableModal
