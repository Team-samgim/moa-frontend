import ConditionRow from './ConditionRow'

const SelectedConditions = ({
  conditions,
  operatorsFor,
  updateCondition,
  removeByFieldKey,
  onChangeOperator,
}) => {
  return (
    <div className='card h-full flex flex-col'>
      <div className='text-base font-semibold'>선택된 필드 수: {conditions.length}</div>

      {conditions.length === 0 && <div className='muted'>왼쪽에서 필드를 체크하세요.</div>}

      {/* 여기 영역만 스크롤 */}
      <div className='vstack mt-1 max-h-80 overflow-y-auto'>
        {conditions.map((row, idx) => {
          const opList = operatorsFor(row.fieldKey)
          return (
            <ConditionRow
              key={row.id}
              row={row}
              idx={idx}
              opList={opList}
              onChangeJoin={(join) => updateCondition(row.id, { join })}
              onChangeOperator={(opCode) => onChangeOperator(row, opCode)}
              onChangeValues={(patch) => updateCondition(row.id, patch)}
              onRemove={() => removeByFieldKey(row.fieldKey)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SelectedConditions
