/**
 * QueryModal
 *
 * 검색 CSV(GRID) 내보내기에서 사용된 쿼리 조건을 시각적으로 보여주는 모달.
 *
 * 주요 기능:
 * - 조회 기간(절대/상대) 표시
 * - 조회 필드(columns) 목록
 * - 조건 리스트(field, operator, value) 표시
 * - global NOT 여부
 * - "적용하기" 버튼을 통해 동일한 검색 조건을 다시 실행 가능
 *
 * AUTHOR: 방대혁
 */

import { memo, useMemo } from 'react'
import { TOKENS, getLayerHex } from '@/constants/tokens'
import { prettyOp } from '@/utils/misc'
import { normalizePresetConfig } from '@/utils/presetNormalizer'

const QueryModal = ({ open, onClose, config, onApply }) => {
  // ---- 1) 기본 normalize ----
  const norm = useMemo(() => normalizePresetConfig(config || {}), [config])
  const layer = norm.layer || norm.baseSpec?.layer
  const layerHex = getLayerHex(layer)

  // ---- 2) 조회 필드 목록 ----
  const cols = useMemo(
    () =>
      (Array.isArray(norm.columns) && norm.columns.length && norm.columns) ||
      norm.baseSpec?.columns ||
      [],
    [norm],
  )

  // ---- 3) 시간 정보 계산 ----
  const t = norm.baseSpec?.time
  const diff = useMemo(
    () =>
      typeof t?.fromEpoch === 'number' && typeof t?.toEpoch === 'number'
        ? Math.abs(t.toEpoch - t.fromEpoch)
        : null,
    [t?.fromEpoch, t?.toEpoch],
  )

  // raw preset label (상대 시간: “1시간”, “1주일” 등)
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

  // preset 추론 유틸
  const near = (x, target, tol = 60) => x !== null && Math.abs(x - target) <= tol

  const badgeText = useMemo(() => {
    const label = String(presetRaw || '')
    if (['1시간', '2시간', '24시간', '1주일'].includes(label)) return label
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

  // ---- 4) global NOT ----
  const globalNot = !!(norm.query?.globalNot ?? norm.baseSpec?.not)

  // ---- 5) conditions ----
  const conds = useMemo(() => {
    const raw =
      (Array.isArray(norm.query?.conditions) && norm.query.conditions) ||
      (Array.isArray(norm.baseSpec?.conditions) && norm.baseSpec.conditions) ||
      []

    return raw.map((c, i) => {
      const field = c.fieldKey ?? c.field ?? ''
      const operator = c.operator ?? c.op ?? ''
      let values = Array.isArray(c.values) ? c.values : []
      values = values.map((v) => (v === null || v === undefined ? '' : String(v)))
      const join = c.join ?? (i === 0 ? '' : 'AND')
      return { field, operator, values, join }
    })
  }, [norm])

  if (!open) return null

  // ---- 6) UI helpers ----
  const renderJoin = (text) => (
    <span className='inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[12px]'>
      {text}
    </span>
  )

  const renderClause = ({ field, operator, values }, idx) => {
    const symbol = prettyOp(operator)

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
        {/* 필드 배지 */}
        <span
          className='rounded-full px-3 py-1 text-[13px] font-medium'
          style={{ backgroundColor: layerHex, color: '#000000' }}
        >
          {field}
        </span>

        {/* 연산자 */}
        {symbol && <span className='mx-1 text-[13px] text-gray-700'>{symbol}</span>}

        {/* 값 */}
        {valueText && <span className='ml-2 text-[13px] text-gray-900 px-3'>{valueText}</span>}
      </span>
    )
  }

  // ---- 7) Render ----
  return (
    <div className='fixed inset-0 z-50'>
      {/* BACKDROP */}
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />

      <div className='absolute left-1/2 top-1/2 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl p-6'>
        {/* HEADER */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='text-lg font-semibold'>검색 조건</div>
          <div className='flex items-center gap-2'>
            {typeof onApply === 'function' && (
              <button
                className='rounded border px-2 py-1'
                style={{
                  backgroundColor: layerHex,
                  color: '#000000',
                  borderColor: TOKENS.BORDER,
                }}
                onClick={() => onApply(config)}
              >
                적용하기
              </button>
            )}
            <button
              className='rounded border px-2 py-1 hover:bg-gray-50'
              onClick={onClose}
              style={{ borderColor: TOKENS.BORDER }}
            >
              닫기
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className='rounded-xl border border-gray-200 bg-white/50 p-5'>
          {/* 조회 기간 */}
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

          {/* 조회 필드 */}
          <div className='mb-2 text-[15px] font-semibold text-gray-800'>
            조회 필드
            <span className='ml-1 text-[13px] font-medium text-gray-500'>({cols.length})</span>
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
              <div className='p-3 text-[13px] text-gray-500'>-</div>
            )}
          </div>

          {/* 조건 */}
          <div className='mt-6 mb-2 text-[15px] font-semibold text-gray-800'>실시간 쿼리</div>
          <div className='flex flex-wrap items-center gap-2.5'>
            {globalNot && (
              <span className='inline-flex h-7 items-center rounded-lg bg-gray-800 px-3 text-[12px] text-white'>
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
