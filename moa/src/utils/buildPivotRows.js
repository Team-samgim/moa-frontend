export function buildPivotRows(pivotResult) {
  if (!pivotResult) return []

  const { rowGroups } = pivotResult
  if (!rowGroups) return []

  return rowGroups.map((group) => {
    const hasChildren = (group.rowInfo?.count ?? 0) > 0

    return {
      displayLabel: group.displayLabel,
      cells: group.cells,
      rowField: group.rowLabel,
      rowInfo: group.rowInfo,
      hasChildren,
      subRows: [],
      isLoading: false,
      isLoaded: false,
      infiniteMode: false,
    }
  })
}
