export const DataType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  IP: 'IP',
  DATETIME: 'DATETIME',
  BOOLEAN: 'BOOLEAN',
}

export const inputTypeOf = (dt) =>
  dt === DataType.NUMBER ? 'number' : dt === DataType.DATETIME ? 'datetime-local' : 'text'
