import ListInput from './ListInput'
import { DataType, inputTypeOf } from '@/constants/dataTypes'

const ConditionRow = ({
  row,
  idx,
  opList,
  onChangeJoin,
  onChangeOperator,
  onChangeValues,
  onRemove,
}) => {
  const type = inputTypeOf(row.dataType)
  const op = opList.find((o) => o.opCode === row.operator)

  const renderValues = () => {
    if (!op) return null
    const vals = Array.isArray(row.values) ? row.values : []

    switch (op.valueArity) {
      case 0:
        return <span className='muted small'>(입력 없음)</span>
      case -1:
        return (
          <div className='w-full'>
            <ListInput
              row={{ ...row, values: vals }}
              update={(_, patch) => onChangeValues(patch)}
            />
          </div>
        )
      case 1:
        return (
          <input
            className='input w-full'
            type={type}
            value={vals[0] ?? ''}
            placeholder={row.dataType === DataType.IP ? '예: 10.0.0.1' : '값 입력'}
            onChange={(e) => onChangeValues({ values: [e.target.value] })}
          />
        )
      case 2:
        return (
          <div className='flex items-center gap-2 w-full'>
            <input
              className='input w-full'
              type={type}
              placeholder={row.dataType === DataType.DATETIME ? '시작' : '최솟값'}
              value={vals[0] ?? ''}
              onChange={(e) => onChangeValues({ values: [e.target.value, vals[1] ?? ''] })}
            />
            <span className='px-1 text-gray-400'>~</span>
            <input
              className='input w-full'
              type={type}
              placeholder={row.dataType === DataType.DATETIME ? '끝' : '최댓값'}
              value={vals[1] ?? ''}
              onChange={(e) => onChangeValues({ values: [vals[0] ?? '', e.target.value] })}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className='flex items-center gap-3 py-2'>
      <select
        className='select w-20'
        value={row.join}
        onChange={(e) => onChangeJoin(e.target.value)}
        disabled={idx === 0}
      >
        <option value='AND'>AND</option>
        <option value='OR'>OR</option>
      </select>

      <div className='select w-55 bg-gray-100 truncate'>{row.fieldKey}</div>

      <select
        className='select w-23'
        value={row.operator}
        onChange={(e) => onChangeOperator(e.target.value)}
      >
        {opList.map((op) => (
          <option key={op.opCode} value={op.opCode}>
            {op.label}
          </option>
        ))}
      </select>

      <div className='flex-1'>{renderValues()}</div>

      <button className='btn btn-danger ml-1' onClick={onRemove}>
        삭제
      </button>
    </div>
  )
}

export default ConditionRow
