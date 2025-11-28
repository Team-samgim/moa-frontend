// 작성자: 최이서
import { useMemo } from 'react'

export const useStickyGroup = (virtualRows, rows) => {
  return useMemo(() => {
    if (!virtualRows.length) return null

    const visibleIndexSet = new Set(virtualRows.map((v) => v.index))

    // 1) 화면에 보이는 subRow들 중에서
    // 2) 부모가 expanded이고
    // 3) 부모 row는 화면에서 안 보이는 첫 번째 그룹 탐색
    for (const v of virtualRows) {
      const row = rows[v.index]
      if (row.depth !== 1) continue // subRow만 검사

      const parent = row.getParentRow?.()
      if (!parent || !parent.getIsExpanded()) continue

      const parentIndex = rows.findIndex((r) => r.id === parent.id)
      if (!visibleIndexSet.has(parentIndex)) {
        return { row: parent, index: parentIndex }
      }
    }

    return null
  }, [virtualRows, rows])
}
