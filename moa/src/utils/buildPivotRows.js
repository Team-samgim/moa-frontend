export function buildPivotRows(pivotResult) {
  if (!pivotResult) return []

  const { rowGroups } = pivotResult
  if (!rowGroups) return []

  return rowGroups.map((group) => {
    return {
      displayLabel: group.displayLabel,
      cells: group.cells,
      subRows: (group.items || []).map((item) => ({
        displayLabel: item.displayLabel,
        cells: item.cells,
        subRows: [],
      })),
    }
  })
}
