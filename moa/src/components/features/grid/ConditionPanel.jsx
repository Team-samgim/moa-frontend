import { createPortal } from 'react-dom'
import { OPERATOR_OPTIONS } from '@/constants/filterOperators'

export default function ConditionPanel({
  fieldType,
  panelPos,
  onClose,
  conditions,
  logicOps,
  setConditions,
  setLogicOps,
  inputRefs,
  onApply,
}) {
  return createPortal(
    <div
      className='fixed z-[10000] w-[280px] rounded-xl border border-gray-300 bg-white shadow-2xl'
      style={{ top: panelPos.top, left: panelPos.left }}
    >
      <div className='flex items-center justify-between bg-white px-3 py-2 text-[13px] font-medium'>
        <span>{`조건별 필터 (${fieldType})`}</span>
        <button onClick={onClose} className='cursor-pointer text-[16px] font-semibold'>
          ×
        </button>
      </div>

      <div className='max-h-[400px] overflow-y-auto p-2.5'>
        {conditions.map((cond, idx) => (
          <div key={idx} className='mb-2.5'>
            {idx > 0 && (
              <select
                value={logicOps[idx - 1] || 'AND'}
                onChange={(e) => {
                  const u = [...logicOps]
                  u[idx - 1] = e.target.value
                  setLogicOps(u)
                }}
                className='mb-1.5 w-full bg-gray-50 p-1 text-[12px]'
              >
                <option value='AND'>AND</option>
                <option value='OR'>OR</option>
              </select>
            )}

            <div className='flex items-center gap-1.5'>
              <div className='flex-1'>
                <select
                  value={cond.op}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, op: e.target.value } : c)),
                    )
                  }
                  className='mb-1 w-full p-1 text-[12px]'
                >
                  {(OPERATOR_OPTIONS[fieldType] || OPERATOR_OPTIONS.string).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {!(fieldType === 'date' && cond.op === 'between') && (
                  <input
                    ref={(el) => {
                      inputRefs.current[idx] = inputRefs.current[idx] || {}
                      inputRefs.current[idx].val = el
                    }}
                    defaultValue={cond.val}
                    type={
                      fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'
                    }
                    placeholder='값 입력...'
                    className='w-full rounded border border-gray-300 p-1 text-[12px]'
                  />
                )}

                {fieldType === 'date' && cond.op === 'between' && (
                  <div className='flex gap-1.5'>
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = inputRefs.current[idx] || {}
                        inputRefs.current[idx].val1 = el
                      }}
                      defaultValue={cond.val1}
                      type='date'
                      className='flex-1 rounded border border-gray-300 p-1 text-[12px]'
                    />
                    <input
                      ref={(el) => {
                        inputRefs.current[idx] = inputRefs.current[idx] || {}
                        inputRefs.current[idx].val2 = el
                      }}
                      defaultValue={cond.val2}
                      type='date'
                      className='flex-1 rounded border border-gray-300 p-1 text-[12px]'
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setConditions((prev) => prev.filter((_, i) => i !== idx))
                  inputRefs.current.splice(idx, 1)
                }}
                className='h-6 cursor-pointer rounded border border-gray-300 bg-gray-100 px-1.5 text-[13px] font-semibold'
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => {
            setConditions((prev) => [...prev, { op: 'contains', val: '', val1: '', val2: '' }])
            setLogicOps((prev) => [...prev, 'AND'])
          }}
          className='w-full cursor-pointer rounded border border-gray-300 bg-gray-50 py-1 text-[12px]'
        >
          ➕ 조건 추가
        </button>

        <div className='mt-2.5 flex gap-2'>
          <button
            onClick={onApply}
            className='flex-1 cursor-pointer rounded bg-[#3877BE] py-1 text-[12px] text-white'
          >
            적용
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
