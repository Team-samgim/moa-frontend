import { useRef, useState } from 'react'

const ListInput = ({ row, update }) => {
  const [buf, setBuf] = useState('')
  const inputRef = useRef(null)
  const values = Array.isArray(row.values) ? row.values : []

  const addOne = (t) => {
    const v = (t ?? '').trim()
    if (!v) return
    if (values.includes(v)) return // 중복 방지
    update(row.id, { values: [...values, v] })
  }

  const add = () => {
    addOne(buf)
    setBuf('')
    inputRef.current?.focus()
  }

  const removeAt = (i) => update(row.id, { values: values.filter((_, idx) => idx !== i) })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
      return
    }
    if (e.key === 'Backspace' && !buf && values.length) {
      e.preventDefault()
      removeAt(values.length - 1)
    }
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text')
    if (!text) return
    const tokens = text
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (tokens.length > 1) {
      e.preventDefault()
      const merged = [...values]
      for (const t of tokens) if (!merged.includes(t)) merged.push(t)
      update(row.id, { values: merged })
      setBuf('')
    }
  }

  return (
    <div className='flex items-center gap-2 flex-wrap'>
      {values.map((v, i) => (
        <span
          key={i}
          className='inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2.5 py-1 text-xs shadow-sm'
        >
          {v}
          <button
            type='button'
            className='ml-1 text-gray-400 hover:text-gray-600 focus:outline-none'
            onClick={() => removeAt(i)}
            aria-label='삭제'
            title='삭제'
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className='input !text-sm w-40 md:w-56'
        placeholder='값 입력 후 Enter 또는 ,'
        value={buf}
        onChange={(e) => setBuf(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <button type='button' className='btn' onClick={add}>
        추가
      </button>
    </div>
  )
}

export default ListInput
