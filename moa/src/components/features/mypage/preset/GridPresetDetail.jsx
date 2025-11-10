import { memo, useMemo } from 'react'
import { TOKENS, getLayerHex } from '@/constants/tokens'
import { near, prettyOp } from '@/utils/misc'

const GridPresetDetail = ({ payload }) => {
  const p = payload || {}
  const layer = p.layer || p.baseSpec?.layer
  const layerHex = getLayerHex(layer)

  const cols = useMemo(
    () => (Array.isArray(p.columns) ? p.columns : p.baseSpec?.columns || []),
    [p],
  )

  const t = p.baseSpec?.time

  const diff = useMemo(
    () =>
      typeof t?.fromEpoch === 'number' && typeof t?.toEpoch === 'number'
        ? Math.abs(t.toEpoch - t.fromEpoch)
        : null,
    [t?.fromEpoch, t?.toEpoch],
  )

  const presetRaw = useMemo(
    () =>
      p.query?.timePreset ??
      p.timePreset ??
      p.baseSpec?.timePreset ??
      p.baseSpec?.time?.preset ??
      p.baseSpec?.time?.label ??
      p.baseSpec?.time?.relative,
    [p],
  )

  const badgeText = useMemo(() => {
    const v = String(presetRaw || '')
    if (['1시간', '2시간', '24시간', '1주일'].includes(v)) return v
    if (near(diff, 3600)) return '1시간'
    if (near(diff, 7200)) return '2시간'
    if (near(diff, 86400)) return '24시간'
    if (near(diff, 604800)) return '1주일'
    return null
  }, [presetRaw, diff])

  const range = useMemo(
    () =>
      t
        ? `${new Date((t.fromEpoch ?? 0) * 1000).toLocaleString()} ~ ${new Date((t.toEpoch ?? 0) * 1000).toLocaleString()}`
        : '-',
    [t?.fromEpoch, t?.toEpoch],
  )

  const globalNot = !!(p.query?.globalNot ?? p.baseSpec?.not)
  const normConds = useMemo(() => {
    const rawConds =
      (Array.isArray(p.query?.conditions) && p.query.conditions) ||
      (Array.isArray(p.baseSpec?.conditions) && p.baseSpec.conditions) ||
      []
    return rawConds.map((c, i) => {
      const field = c.fieldKey ?? c.field ?? ''
      const operator = c.operator ?? c.op ?? ''
      let values = Array.isArray(c.values) ? c.values : []
      values = values.map((v) => (v === null || v === undefined ? '' : String(v)))
      const join = c.join ?? (i === 0 ? '' : 'AND')
      return { field, operator, values, join }
    })
  }, [p])

  const renderJoin = (text) => (
    <span className='inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[12px]'>
      {text}
    </span>
  )

  const renderClause = ({ field, operator, values }, idx) => {
    const sym = prettyOp(operator)
    let valueText = ''
    if (String(operator).toUpperCase() === 'BETWEEN' && values.length >= 2)
      valueText = `${values[0]} ~ ${values[1]}`
    else if (values.length === 1) valueText = values[0]
    else if (values.length > 1) valueText = `[${values.join(', ')}]`

    return (
      <span
        key={`${field}-${operator}-${idx}`}
        className='inline-flex items-center rounded-full border'
        style={{ borderColor: TOKENS.BORDER }}
      >
        <span
          className='rounded-full px-3 py-1 text-[13px] font-medium'
          style={{ backgroundColor: layerHex, color: '#000000' }}
        >
          {field}
        </span>
        {sym && <span className='mx-1 text-[13px] text-gray-700'>{sym}</span>}
        {valueText && <span className='ml-2 text-[13px] text-gray-900 px-3'>{valueText}</span>}
      </span>
    )
  }

  return (
    <div className='border-l border-r border-b border-[#D1D1D6] rounded-b-md rounded-t-none bg-white/50 p-5'>
      <div className='mb-3 text-[16px] font-semibold text-gray-800'>조회 기간</div>
      <div className='mb-6 flex items-center gap-3'>
        {badgeText && (
          <span
            className='inline-flex h-10 items-center rounded-xl border px-6 text-[14px] font-medium'
            style={{ backgroundColor: layerHex, color: '#000000', borderColor: TOKENS.BORDER }}
          >
            {badgeText}
          </span>
        )}
        <div
          className='inline-flex h-10 items-center rounded-xl border px-4'
          style={{ borderColor: TOKENS.BORDER, backgroundColor: '#F5F5F7' }}
        >
          <span className='text-[14px] font-medium text-gray-800'>{range}</span>
        </div>
      </div>

      <div className='mb-2 text-[15px] font-semibold text-gray-800'>
        조회 필드
        <span className='ml-1 align-middle text-[13px] font-medium text-gray-500'>
          ({cols.length})
        </span>
      </div>
      <div className='flex flex-wrap gap-2.5'>
        {cols.length ? (
          cols.map((c) => (
            <span key={c} className='rounded-full bg-[#F5F5F7] px-3.5 py-1.5 text-[13px]'>
              {c}
            </span>
          ))
        ) : (
          <span className='text-[13px] text-gray-500'>-</span>
        )}
      </div>

      <div className='mt-6 mb-2 text-[15px] font-semibold text-gray-800'>실시간 쿼리</div>
      <div className='flex flex-wrap items-center gap-2.5'>
        {globalNot && (
          <span className='inline-flex items-center h-7 px-3 rounded-lg bg-gray-800 text-white text-[12px]'>
            NOT
          </span>
        )}

        {normConds.length ? (
          normConds.map((c, i) => (
            <span key={i} className='inline-flex items-center gap-2'>
              {i > 0 && renderJoin(c.join || 'AND')}
              {renderClause(c, i)}
            </span>
          ))
        ) : (
          <span className='text-[13px] text-gray-500'>-</span>
        )}
      </div>
    </div>
  )
}

export default memo(GridPresetDetail)
