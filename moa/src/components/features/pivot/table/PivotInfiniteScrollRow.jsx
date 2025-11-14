import React, { useEffect, useRef } from 'react'
import { useRowGroupItemsInfinite } from '@/hooks/queries/usePivot'

const PivotInfiniteScrollRow = ({
  rowField,
  layer,
  time,
  column,
  values,
  filters,
  sort,
  enabled,
  colSpan,
  onDataLoaded,
}) => {
  const triggerRef = useRef(null)
  const loadedPagesRef = useRef(new Set())
  const isFetchingRef = useRef(false)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useRowGroupItemsInfinite({
    layer,
    rowField,
    time,
    column,
    values,
    filters,
    sort,
    enabled,
  })

  useEffect(() => {
    if (!data) return

    const newPages = []
    data.pages.forEach((page, pageIndex) => {
      if (!loadedPagesRef.current.has(pageIndex)) {
        newPages.push({ pageIndex, items: page.items || [] })
        loadedPagesRef.current.add(pageIndex)
      }
    })

    if (newPages.length > 0) {
      const allNewItems = newPages.flatMap((p) =>
        p.items.map((item) => ({
          displayLabel: item.displayLabel,
          cells: item.cells,
          rowField: item.valueLabel,
          hasChildren: false,
          subRows: [],
        })),
      )

      if (allNewItems.length > 0) {
        onDataLoaded(allNewItems)
      }
    }
  }, [data, onDataLoaded, rowField])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || isFetchingRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          isFetchingRef.current = true
          fetchNextPage().finally(() => {
            setTimeout(() => {
              isFetchingRef.current = false
            }, 500)
          })
        }
      },
      { threshold: 0.1 },
    )

    if (triggerRef.current) {
      observer.observe(triggerRef.current)
    }

    return () => {
      observer.disconnect()
      isFetchingRef.current = false
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rowField])

  if (!hasNextPage && !isFetchingNextPage) return null

  return (
    <tr ref={triggerRef}>
      <td colSpan={colSpan} className='text-center py-2 text-gray-500 text-sm'>
        {isFetchingNextPage ? '로딩 중...' : '더 보기'}
      </td>
    </tr>
  )
}

export default PivotInfiniteScrollRow
