const QueryPreview = ({ chips, globalNot, onToggleNot }) => {
  const splitRest = (tokens) => {
    const t = [...tokens]
    if (!t.length) return { op: '', value: '' }
    const A = (t[0] || '').toUpperCase()
    const B = (t[1] || '').toUpperCase()
    const C = (t[2] || '').toUpperCase()

    if (A === 'NOT' && B === 'IN') return { op: 'NOT IN', value: t.slice(2).join(' ') }
    if (A === 'IS' && B === 'NULL') return { op: 'IS', value: 'NULL' }
    if (A === 'IS' && B === 'NOT' && C === 'NULL') return { op: 'IS NOT', value: 'NULL' }

    if (['BETWEEN', 'LIKE', 'IN'].includes(A)) return { op: A, value: t.slice(1).join(' ') }
    if (['=', '!=', '<>', '>', '>=', '<', '<='].includes(t[0]))
      return { op: t[0], value: t.slice(1).join(' ') }

    return { op: t[0], value: t.slice(1).join(' ') }
  }

  const renderClause = (text) => {
    const tokens = String(text).trim().split(/\s+/)
    const field = tokens.shift() || ''
    const { op, value } = splitRest(tokens)
    return (
      <span className='inline-flex items-center rounded-full border border-gray-200 bg-white text-gray-700 text-sm'>
        <span className='px-3 py-1 rounded-full bg-lime-100 text-gray-800 font-medium'>
          {field}
        </span>
        {op && <span className='px-2 text-gray-500'>{op}</span>}
        {value && <span className='px-3 py-1'>{value}</span>}
      </span>
    )
  }

  const renderJoin = (text) => (
    <span className='inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm'>
      {text}
    </span>
  )

  return (
    <div className='card border border-gray-200 rounded-2xl p-4'>
      <div className='text-base font-medium mb-2'>실시간 쿼리</div>
      <div className='flex items-center gap-3 flex-wrap'>
        <button
          type='button'
          className={`h-8 px-3 rounded-lg border text-sm ${
            globalNot
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
          onClick={onToggleNot}
          title='전체 쿼리에 NOT 적용'
        >
          NOT
        </button>

        {chips && chips.length ? (
          chips.map((c, i) => (
            <span key={i} className='inline-flex'>
              {c.type === 'join' ? renderJoin(c.text) : renderClause(c.text)}
            </span>
          ))
        ) : (
          <span className='muted'>조건이 없습니다.</span>
        )}
      </div>
    </div>
  )
}

export default QueryPreview
