import { LAYER_ACTIVE_STYLES } from '@/constants/colors'

const QueryPreview = ({ chips, globalNot, onToggleNot, layerKey }) => {
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

  // 레이어별 색상만 공통으로 가져오는 헬퍼
  const getLayerAccentClasses = () => {
    const base =
      (layerKey && LAYER_ACTIVE_STYLES[layerKey]) || 'bg-[#EAF1F9] text-gray-700 border-[#D1D1D6]'

    // LAYER_ACTIVE_STYLES 안에 bg / text / border 색만 있으니까
    // 여기서 border 유틸만 추가해서 사용
    return `border ${base}`
  }

  const renderClause = (text) => {
    const tokens = String(text).trim().split(/\s+/)
    const field = tokens.shift() || ''
    const { op, value } = splitRest(tokens)

    return (
      <span className='inline-flex items-center rounded-full border border-gray-200 bg-white text-gray-700 text-sm 4xl:text-base'>
        <span
          className={[
            'px-3 py-1 4xl:px-3.5 4xl:py-1.5 rounded-full font-medium',
            getLayerAccentClasses(),
          ].join(' ')}
        >
          {field}
        </span>
        {op && <span className='px-2 4xl:px-2.5 text-gray-500'>{op}</span>}
        {value && <span className='px-3 py-1 4xl:px-3.5 4xl:py-1.5'>{value}</span>}
      </span>
    )
  }

  const renderJoin = (text) => (
    <span className='inline-flex items-center px-3 py-1 4xl:px-3.5 4xl:py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm 4xl:text-base'>
      {text}
    </span>
  )

  return (
    <div className='flex flex-col gap-1'>
      <div className='text-sm 4xl:text-base font-medium mb-2'>실시간 쿼리</div>
      <div className='flex items-center gap-3 4xl:gap-4 flex-wrap'>
        {/* 🔹 NOT 버튼: 모양 그대로, active일 때만 레이어 색 */}
        <button
          type='button'
          className={[
            'h-8 4xl:h-9 px-3 4xl:px-4 rounded-lg border text-sm 4xl:text-base',
            globalNot
              ? getLayerAccentClasses()
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
          ].join(' ')}
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
          <span className='muted text-sm 4xl:text-base text-gray-400'>조건이 없습니다.</span>
        )}
      </div>
    </div>
  )
}

export default QueryPreview
