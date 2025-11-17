import MsgRow from '@/components/_common/MsgRow'

const IdEmailField = ({
  label,
  value,
  onChange,
  onClickCheck,
  status, // 'idle' | 'checking' | 'valid' | 'invalid'
  inlineMsg, // 개별 에러/안내 메시지 (idMsg/emailMsg)
  fieldError,
  successText,
  buttonLabelIdle = '중복확인',
  buttonLabelChecking = '확인 중...',
  buttonLabelDone = '확인 완료',
  disabledWhenValid = true,
}) => {
  const isChecking = status === 'checking'
  const isValid = status === 'valid'
  const isInvalid = status === 'invalid'

  const buttonDisabled = disabledWhenValid ? isValid || isChecking : isChecking
  const buttonText = isValid ? buttonLabelDone : isChecking ? buttonLabelChecking : buttonLabelIdle
  const buttonClass = isValid
    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
    : 'border-[var(--color-blue)] text-[var(--color-blue)] hover:bg-[var(--color-blue)]/5'

  return (
    <div>
      <label className='block text-sm text-gray-700 mb-2'>{label}</label>
      <div className='flex items-center gap-3'>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='flex-1 border-b border-gray-300 focus:border-[var(--color-blue)] outline-none py-2'
        />
        <button
          type='button'
          onClick={onClickCheck}
          disabled={buttonDisabled}
          className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${buttonClass}`}
        >
          {buttonText}
        </button>
      </div>

      {/* 메시지 우선순위: 1. 개별 에러 2. 폼 에러 3. 성공 */}
      {isInvalid && inlineMsg ? (
        <MsgRow type='error'>{inlineMsg}</MsgRow>
      ) : fieldError && !isValid ? (
        <MsgRow type='error'>{fieldError}</MsgRow>
      ) : isValid ? (
        <MsgRow type='success'>{successText}</MsgRow>
      ) : null}
    </div>
  )
}

export default IdEmailField
