/**
 * ConditionPanel
 *
 * 조건 기반 필터 패널 UI 컴포넌트.
 * 컬럼 타입(fieldType)에 따라 가능한 연산자를 제공하고,
 * AND / OR 논리 연산으로 여러 조건을 조합할 수 있다.
 *
 * 기능:
 * 1) 조건 목록 렌더링 및 값 입력
 * 2) 논리 연산자(AND/OR) 선택
 * 3) 조건 추가/삭제
 * 4) 날짜 타입 between 처리(val1/val2)
 * 5) 내장형(embedded) 또는 팝업형 UI 지원
 *
 * Props:
 * - fieldType: string | number | date 등 필드 타입
 * - onClose: 닫기 이벤트(팝업일 때)
 * - conditions: 조건 배열 [{ op, val, val1, val2 }]
 * - logicOps: AND/OR 배열
 * - setConditions: 조건 setter
 * - setLogicOps: 논리연산자 setter
 * - inputRefs: 입력 Ref 객체
 * - onApply: 적용 버튼 핸들러
 * - embedded: true면 내장형 패널로 표시
 *
 * AUTHOR: 방대혁
 */
import { OPERATOR_OPTIONS } from '@/constants/filterOperators'

const ConditionPanel = ({
  fieldType,
  onClose,
  conditions,
  logicOps,
  setConditions,
  setLogicOps,
  inputRefs,
  onApply,
  embedded = false,
}) => {
  const containerClass = embedded
    ? 'w-full'
    : 'w-[280px] rounded-xl border border-gray-300 bg-white shadow-2xl'

  return (
    <div className={containerClass}>
      {!embedded && (
        <div className='flex items-center justify-between bg-white px-3 py-2.5 text-[13px] font-medium border-b border-gray-200'>
          <span>{`조건별 필터 (${fieldType})`}</span>
          <button
            onClick={onClose}
            className='cursor-pointer text-[20px] font-semibold leading-none hover:text-gray-600'
          >
            ×
          </button>
        </div>
      )}

      <div
        className={embedded ? 'max-h-[300px] overflow-y-auto' : 'max-h-[400px] overflow-y-auto p-3'}
      >
        <div className={embedded ? 'space-y-2' : ''}>
          {conditions.map((cond, idx) => (
            <div key={idx} className={embedded ? '' : 'mb-2.5'}>
              {idx > 0 && (
                <select
                  value={logicOps[idx - 1] || 'AND'}
                  onChange={(e) => {
                    const u = [...logicOps]
                    u[idx - 1] = e.target.value
                    setLogicOps(u)
                  }}
                  className='mb-2 w-full rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-[12px] focus:outline-none focus:border-blue-500'
                >
                  <option value='AND'>AND</option>
                  <option value='OR'>OR</option>
                </select>
              )}

              <div className='space-y-1.5'>
                <select
                  value={cond.op}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, op: e.target.value } : c)),
                    )
                  }
                  className='w-full rounded border border-gray-300 px-2 py-1.5 text-[12px] focus:outline-none focus:border-blue-500'
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
                      if (!inputRefs.current[idx]) inputRefs.current[idx] = {}
                      inputRefs.current[idx].val = el
                    }}
                    defaultValue={cond.val}
                    type={
                      fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'
                    }
                    placeholder='값 입력...'
                    className='w-full rounded border border-gray-300 px-2 py-1.5 text-[12px] focus:outline-none focus:border-blue-500'
                  />
                )}

                {fieldType === 'date' && cond.op === 'between' && (
                  <div className='flex gap-1.5'>
                    <input
                      ref={(el) => {
                        if (!inputRefs.current[idx]) inputRefs.current[idx] = {}
                        inputRefs.current[idx].val1 = el
                      }}
                      defaultValue={cond.val1}
                      type='date'
                      className='flex-1 rounded border border-gray-300 px-2 py-1.5 text-[12px] focus:outline-none focus:border-blue-500'
                    />
                    <input
                      ref={(el) => {
                        if (!inputRefs.current[idx]) inputRefs.current[idx] = {}
                        inputRefs.current[idx].val2 = el
                      }}
                      defaultValue={cond.val2}
                      type='date'
                      className='flex-1 rounded border border-gray-300 px-2 py-1.5 text-[12px] focus:outline-none focus:border-blue-500'
                    />
                  </div>
                )}

                <button
                  onClick={() => {
                    setConditions((prev) => prev.filter((_, i) => i !== idx))
                    setLogicOps((prev) => prev.filter((_, i) => i !== idx - 1))
                  }}
                  className='w-full cursor-pointer rounded border border-gray-300 bg-white py-1 text-[12px] hover:bg-gray-50 transition-colors'
                >
                  ✕ 삭제
                </button>
              </div>

              {idx < conditions.length - 1 && <div className='my-2 border-t border-gray-200' />}
            </div>
          ))}
        </div>

        <div className={`${embedded ? 'mt-3' : 'mt-2.5'} space-y-2`}>
          <button
            onClick={() => {
              setConditions((prev) => [...prev, { op: 'contains', val: '', val1: '', val2: '' }])
              if (conditions.length > 0) {
                setLogicOps((prev) => [...prev, 'AND'])
              }
            }}
            className='w-full cursor-pointer rounded border border-gray-300 bg-white py-1.5 text-[12px] hover:bg-gray-50 transition-colors'
          >
            ➕ 조건 추가
          </button>

          <button
            onClick={onApply}
            className='w-full cursor-pointer rounded bg-[#3877BE] py-1.5 text-[12px] text-white hover:bg-blue-700 transition-colors'
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConditionPanel
