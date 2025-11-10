import { memo, useMemo } from 'react'
import { TOKENS, getLayerHex } from '@/constants/tokens'
import { prettyOp } from '@/utils/misc'
import { normalizePresetConfig } from '@/utils/presetNormalizer'

const QueryModal = ({ open, onClose, config, onApply }) => {
  const norm = useMemo(() => normalizePresetConfig(config || {}), [config])
  const layer = norm.layer || norm.baseSpec?.layer
  const layerHex = getLayerHex(layer)

  const cols = useMemo(
    () =>
      (Array.isArray(norm.columns) && norm.columns.length && norm.columns) ||
      norm.baseSpec?.columns ||
      [],
    [norm],
  )

  const t = norm.baseSpec?.time
  const diff = useMemo(
    () =>
      typeof t?.fromEpoch === 'number' && typeof t?.toEpoch === 'number'
        ? Math.abs(t.toEpoch - t.fromEpoch)
        : null,
    [t?.fromEpoch, t?.toEpoch],
  )

  const presetRaw = useMemo(
    () =>
      norm.query?.timePreset ??
      norm.timePreset ??
      norm.baseSpec?.timePreset ??
      norm.baseSpec?.time?.preset ??
      norm.baseSpec?.time?.label ??
      norm.baseSpec?.time?.relative,
    [norm],
  )

  const near = (x, target, tol = 60) => x !== null && Math.abs(x - target) <= tol
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
        ? `${new Date((t.fromEpoch ?? 0) * 1000).toLocaleString()} ~ ${new Date(
            (t.toEpoch ?? 0) * 1000,
          ).toLocaleString()}`
        : '-',
    [t?.fromEpoch, t?.toEpoch],
  )

  const globalNot = !!(norm.query?.globalNot ?? norm.baseSpec?.not)
  const conds = useMemo(() => {
    const rawConds =
      (Array.isArray(norm.query?.conditions) && norm.query.conditions) ||
      (Array.isArray(norm.baseSpec?.conditions) && norm.baseSpec.conditions) ||
      []
    return rawConds.map((c, i) => {
      const field = c.fieldKey ?? c.field ?? ''
      const operator = c.operator ?? c.op ?? ''
      let values = Array.isArray(c.values) ? c.values : []
      values = values.map((v) => (v === null || v === undefined ? '' : String(v)))
      const join = c.join ?? (i === 0 ? '' : 'AND')
      return { field, operator, values, join }
    })
  }, [norm])

  if (!open) return null

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
        style={{ borderColor: TOKENS.BORDER, backgroundColor: '#FFFFFF' }}
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
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl rounded-2xl bg-white shadow-xl p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='text-lg font-semibold'>검색 조건</div>
          <div className='flex items-center gap-2'>
            {typeof onApply === 'function' && (
              <button
                className='rounded border px-3 py-1.5'
                style={{ backgroundColor: layerHex, color: '#000000', borderColor: TOKENS.BORDER }}
                onClick={() => onApply(config)}
              >
                적용하기
              </button>
            )}
            <button className='rounded border px-3 py-1.5 hover:bg-gray-50' onClick={onClose}>
              닫기
            </button>
          </div>
        </div>

        <div className='rounded-xl border border-gray-200 bg-white/50 p-5'>
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
              className='inline-flex h-10 items-center rounded-xl border'
              style={{ borderColor: TOKENS.BORDER }}
            >
              <span className='text-[14px] font-medium text-gray-800 px-4'>{range}</span>
            </div>
          </div>

          <div className='mb-2 text-[15px] font-semibold text-gray-800'>
            조회 필드
            <span className='ml-1 align-middle text-[13px] font-medium text-gray-500'>
              ({cols.length})
            </span>
          </div>
          <div
            className='h-36 overflow-y-auto rounded-xl border'
            style={{ borderColor: TOKENS.BORDER, backgroundColor: '#fff' }}
          >
            {cols.length ? (
              <div className='flex flex-wrap gap-2.5 p-3'>
                {cols.map((c) => (
                  <span key={c} className='rounded-full bg-[#F5F5F7] px-3.5 py-1.5 text-[13px]'>
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <div className='text-[13px] text-gray-500 p-3'>-</div>
            )}
          </div>

          <div className='mt-6 mb-2 text-[15px] font-semibold text-gray-800'>실시간 쿼리</div>
          <div className='flex flex-wrap items-center gap-2.5'>
            {globalNot && (
              <span className='inline-flex items-center h-7 px-3 rounded-lg bg-gray-800 text-white text-[12px]'>
                NOT
              </span>
            )}
            {conds.length ? (
              conds.map((c, i) => (
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
      </div>
    </div>
  )
}

export default memo(QueryModal)
