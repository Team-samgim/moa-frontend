export const makeFilterModel = (activeFilters = {}) => {
  const model = {}
  Object.entries(activeFilters).forEach(([key, filter]) => {
    if (!filter) return
    if (filter.mode === 'checkbox') {
      model[key] = { mode: 'checkbox', values: filter.values || [] }
    } else if (filter.mode === 'condition') {
      model[key] = {
        mode: 'condition',
        type: filter.type || 'string',
        conditions: filter.conditions || [],
        logicOps: filter.logicOps || [],
      }
    }
  })
  return model
}
