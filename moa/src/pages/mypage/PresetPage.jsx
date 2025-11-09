import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import arrowDown from '@/assets/icons/arrow-down-bold.svg'
import arrowLeft from '@/assets/icons/arrow-left.svg'
import trash from '@/assets/icons/trash.svg'
import { userNavigations } from '@/constants/navigations'
import { useMyPresets, useToggleFavoritePreset, useDeletePreset } from '@/hooks/queries/useMyPage'
import { normalizePresetConfig } from '@/utils/presetNormalizer'

const uid = () => Math.random().toString(36).slice(2, 9)
const near = (x, target, tol = 60) => typeof x === 'number' && Math.abs(x - target) <= tol
const inferPresetKey = (fromEpoch, toEpoch) => {
  const diff =
    typeof fromEpoch === 'number' && typeof toEpoch === 'number'
      ? Math.abs(toEpoch - fromEpoch)
      : null
  if (near(diff, 3600)) return '1H'
  if (near(diff, 7200)) return '2H'
  if (near(diff, 86400)) return '24H'
  if (near(diff, 604800)) return '7D'
  return 'CUSTOM'
}

// 저장된 프리셋(config) → SearchPage가 기대하는 payload 형태로 변환
const toSearchSpecFromPreset = (cfg = {}) => {
  const base = cfg.baseSpec || {}
  const time = base.time || {}
  const presetKey = cfg.query?.timePreset || inferPresetKey(time.fromEpoch, time.toEpoch)

  // baseSpec.conditions [{op, field, values, dataType}] → UI 조건 형태
  const conditions = (base.conditions || []).map((c, i) => ({
    id: uid(),
    join: i === 0 ? 'AND' : 'AND', // 첫 줄도 AND로 시작(필요시 바꿔도 됨)
    fieldKey: c.field,
    dataType: c.dataType || 'TEXT',
    operator: c.op, // EQ/NE/GT/GTE/LT/LTE/BETWEEN/IN/LIKE...
    values: Array.isArray(c.values) ? c.values : c.value !== null ? [c.value] : [],
  }))

  return {
    layer: cfg.layer || base.layer || 'HTTP_PAGE',
    viewKeys: Array.isArray(cfg.columns) ? cfg.columns : base.columns || [],
    conditions,
    globalNot: !!base.not,
    timePreset: presetKey,
    customTimeRange:
      presetKey === 'CUSTOM' &&
      typeof time.fromEpoch === 'number' &&
      typeof time.toEpoch === 'number'
        ? { from: new Date(time.fromEpoch * 1000), to: new Date(time.toEpoch * 1000) }
        : null,
  }
}

/** 유틸 */
const fmtDate = (row) => {
  const s = row?.createdAt || row?.created_at
  return s ? new Date(s).toLocaleString() : '-'
}
const Dot = ({ c = '#3b82f6' }) => (
  <span className='inline-block h-2 w-2 rounded-full align-middle' style={{ backgroundColor: c }} />
)

const getLayerTone = (layer) => {
  const k = String(layer || '').toUpperCase()
  if (k === 'HTTP_PAGE') {
    return {
      dot: '#3b82f6',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-100',
    }
  }
  // 기본은 이더넷/기타 = 노랑 톤
  return {
    dot: '#f59e0b',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-100',
  }
}

/** 레이어 셀(파란점: HTTP_PAGE / 노랑점: 기타) */
const LayerCell = ({ layer }) => {
  if (!layer) return <span className='text-gray-400'>-</span>
  const tone = getLayerTone(layer)
  return (
    <div className='flex items-center gap-2'>
      <span
        className='inline-block h-2 w-2 rounded-full align-middle'
        style={{ backgroundColor: tone.dot }}
      />
      <span className='text-sm'>{layer}</span>
    </div>
  )
}

/** GRID 프리셋 상세 미리보기 */
const GridPresetDetail = ({ payload }) => {
  const p = payload || {}
  const layer = p.layer || p.baseSpec?.layer
  const tone = getLayerTone(layer)

  const cols = Array.isArray(p.columns) ? p.columns : p.baseSpec?.columns || []
  const t = p.baseSpec?.time

  // --- 기간 배지(1H/2H/24H/7D) 추론 ---
  const diff =
    typeof t?.fromEpoch === 'number' && typeof t?.toEpoch === 'number'
      ? Math.abs(t.toEpoch - t.fromEpoch)
      : null
  const near = (x, target, tol = 60) => x !== null && Math.abs(x - target) <= tol
  const presetRaw =
    p.query?.timePreset ??
    p.timePreset ??
    p.baseSpec?.timePreset ??
    p.baseSpec?.time?.preset ??
    p.baseSpec?.time?.label ??
    p.baseSpec?.time?.relative
  const badgeText = ['1시간', '2시간', '24시간', '1주일'].includes(String(presetRaw || ''))
    ? String(presetRaw)
    : (near(diff, 3600) && '1시간') ||
      (near(diff, 7200) && '2시간') ||
      (near(diff, 86400) && '24시간') ||
      (near(diff, 604800) && '1주일') ||
      null

  const range = t
    ? `${new Date((t.fromEpoch ?? 0) * 1000).toLocaleString()} ~ ${new Date(
        (t.toEpoch ?? 0) * 1000,
      ).toLocaleString()}`
    : '-'

  // --- 실시간 쿼리용 정규화 ---
  const globalNot = !!(p.query?.globalNot ?? p.baseSpec?.not)
  const rawConds =
    (Array.isArray(p.query?.conditions) && p.query.conditions) ||
    (Array.isArray(p.baseSpec?.conditions) && p.baseSpec.conditions) ||
    []

  const normConds = rawConds.map((c, i) => {
    const field = c.fieldKey ?? c.field ?? ''
    const operator = c.operator ?? c.op ?? ''
    let values = Array.isArray(c.values) ? c.values : []
    // 숫자/불리언도 문자열표현으로 통일
    values = values.map((v) => (v === null || v === undefined ? '' : String(v)))
    const join = c.join ?? (i === 0 ? '' : 'AND')
    return { field, operator, values, join }
  })

  const renderJoin = (text) => (
    <span className='inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[12px]'>
      {text}
    </span>
  )

  const prettyOp = (op) => {
    const k = String(op || '').toUpperCase()
    switch (k) {
      case 'EQ':
        return '='
      case 'NE':
        return '!='
      case 'GT':
        return '>'
      case 'GTE':
        return '>='
      case 'LT':
        return '<'
      case 'LTE':
        return '<='
      case 'BETWEEN':
        return 'BETWEEN'
      case 'IN':
        return 'IN'
      case 'NOT IN':
        return 'NOT IN'
      case 'LIKE':
        return 'LIKE'
      case 'STARTS_WITH':
        return 'LIKE'
      case 'ENDS_WITH':
        return 'LIKE'
      case 'IS':
        return 'IS'
      case 'IS NOT':
        return 'IS NOT'
      default:
        return op || ''
    }
  }

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
        className='inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm'
      >
        {/* 필드 배지를 조회기간과 동일 톤으로 */}
        <span
          className={[
            'rounded-full px-3 py-1 text-[13px] font-medium border',
            tone.badgeBg, // ex) bg-blue-50 / bg-amber-50
            tone.badgeText, // ex) text-blue-700 / text-amber-700
            tone.badgeBorder, // ex) border-blue-100 / border-amber-100
          ].join(' ')}
        >
          {field}
        </span>

        {/* 연산자 기호(=, ≥, ≤, …) */}
        {sym && <span className='mx-1 text-[13px] text-gray-700'>{sym}</span>}

        {/* 값 */}
        {valueText && <span className='ml-2 text-[13px] text-gray-900 px-3'>{valueText}</span>}
      </span>
    )
  }

  return (
    <div className='rounded-xl border border-gray-200 bg-white/50 p-5'>
      {/* 조회 시간 */}
      <div className='mb-3 text-[16px] font-semibold text-gray-800'>조회 시간</div>
      <div className='mb-6 flex items-center gap-3'>
        {badgeText && (
          <span
            className={[
              'inline-flex h-10 items-center rounded-xl border px-6 text-[14px] font-semibold',
              tone.badgeBg,
              tone.badgeText,
              tone.badgeBorder,
            ].join(' ')}
          >
            {badgeText}
          </span>
        )}
        <div className='inline-flex h-10 items-center rounded-xl border border-gray-300 bg-white px-4'>
          <span className='text-[14px] font-medium text-gray-800'>{range}</span>
        </div>
      </div>

      {/* 조회 필드 */}
      <div className='mb-2 text-[15px] font-semibold text-gray-800'>
        조회 필드
        <span className='ml-1 align-middle text-[13px] font-medium text-gray-500'>
          ({cols.length})
        </span>
      </div>
      <div className='flex flex-wrap gap-2.5'>
        {cols.length ? (
          cols.map((c) => (
            <span
              key={c}
              className='rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] shadow-sm'
            >
              {c}
            </span>
          ))
        ) : (
          <span className='text-[13px] text-gray-500'>-</span>
        )}
      </div>

      {/* 실시간 쿼리 */}
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

/** PIVOT 프리셋 상세 미리보기 */
const PivotPresetDetail = ({ payload }) => {
  const p = payload || {}
  const col = p.columns || p.col || []
  const rows = p.rows || []
  const values = p.values || []

  return (
    <div className='grid grid-cols-3 gap-4'>
      <div className='rounded-xl border border-gray-200 bg-white/50'>
        <div className='border-b px-4 py-2 text-[12px] text-gray-600'>열 (Column)</div>
        <div className='max-h-48 overflow-auto p-3'>
          {col.length ? (
            col.map((v, i) => (
              <div key={i} className='rounded border bg-white px-2 py-1 text-[12px]'>
                {v}
              </div>
            ))
          ) : (
            <div className='text-[12px] text-gray-500'>-</div>
          )}
        </div>
      </div>
      <div className='rounded-xl border border-gray-200 bg-white/50'>
        <div className='border-b px-4 py-2 text-[12px] text-gray-600'>행 (Rows)</div>
        <div className='max-h-48 overflow-auto p-3'>
          {rows.length ? (
            rows.map((v, i) => (
              <div key={i} className='rounded border bg-white px-2 py-1 text-[12px]'>
                {v}
              </div>
            ))
          ) : (
            <div className='text-[12px] text-gray-500'>-</div>
          )}
        </div>
      </div>
      <div className='rounded-xl border border-gray-200 bg-white/50'>
        <div className='border-b px-4 py-2 text-[12px] text-gray-600'>값 (Values)</div>
        <div className='max-h-48 overflow-auto p-3'>
          {values.length ? (
            values.map((v, i) => (
              <div key={i} className='rounded border bg-white px-2 py-1 text-[12px]'>
                {typeof v === 'string' ? v : v?.label || JSON.stringify(v)}
              </div>
            ))
          ) : (
            <div className='text-[12px] text-gray-500'>-</div>
          )}
        </div>
      </div>
    </div>
  )
}

/** 목록 한 행 (이름변경 제거) */
const Row = ({ p, onFav, onDelete, onApply }) => {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <tr className={`border-b ${opened ? 'bg-indigo-100' : ''}`}>
        <td className='px-4 py-2 text-[13px] w-16 text-center'>
          <button
            onClick={() => onFav(p)}
            title='즐겨찾기'
            aria-label='즐겨찾기'
            className={`rounded px-2 py-1.5 text-[12px] ${p.favorite ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}
          >
            ★
          </button>
        </td>
        <td className='px-4 py-2 text-[13px]'>
          <span className='font-medium'>{p.presetName}</span>
        </td>
        <td className='px-4 py-2'>
          <LayerCell layer={p.config?.layer} />
        </td>
        <td className='px-4 py-2 text-[12px] text-gray-500'>{fmtDate(p)}</td>
        <td className='px-4 py-2 align-middle w-[260px]'>
          <div className='flex items-center justify-between'>
            {/* 왼쪽: 적용/삭제 */}
            <div className='inline-flex items-center gap-2'>
              <button
                onClick={() => onApply(p)}
                className='rounded border px-2 py-1.5 text-[12px] hover:bg-blue-50'
              >
                적용하기
              </button>

              <button
                onClick={() => onDelete(p)}
                aria-label='삭제'
                title='삭제'
                className='rounded border px-2 py-1.5 hover:bg-red-50'
              >
                <img src={trash} alt='' className='h-5 w-5' />
              </button>
            </div>

            {/* 오른쪽: 열기/닫기 (분리 + 구분선) */}
            <div className='pl-3 ml-3'>
              <button
                onClick={() => setOpened((v) => !v)}
                aria-label={opened ? '닫기' : '열기'}
                title={opened ? '닫기' : '열기'}
                className='rounded border px-2 py-1.5 hover:bg-gray-50'
              >
                <img src={opened ? arrowDown : arrowLeft} alt='' className='h-4 w-4' />
              </button>
            </div>
          </div>
        </td>
      </tr>

      {opened && (
        <tr className='border-b bg-white/60'>
          <td colSpan={5} className='px-6 py-4'>
            {p.presetType === 'GRID' ? (
              <GridPresetDetail payload={p.config} />
            ) : (
              <PivotPresetDetail payload={p.config} />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

/** 탭 헤더 (GRID / PIVOT) */
const Tabs = ({ active, onChange }) => {
  return (
    <div className='mb-4 flex items-center gap-3'>
      {[
        { key: 'GRID', label: '검색 프리셋' },
        { key: 'PIVOT', label: '피벗 프리셋' },
      ].map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={[
            'rounded-full px-4 py-2 text-sm',
            active === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
          ].join(' ')}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** 페이지 본문 */
const PresetPage = () => {
  const [type, setType] = useState('GRID') // 기본 GRID
  const navigate = useNavigate()

  const { data, isLoading } = useMyPresets({ page: 0, size: 50 })
  const favMut = useToggleFavoritePreset()
  const delMut = useDeletePreset()

  const tsOf = (row) => {
    const s = row?.createdAt || row?.created_at || row?.updatedAt || row?.updated_at
    return s ? new Date(s).getTime() : 0
  }
  const sortByFavThenDate = (a, b) => {
    // 1) 즐겨찾기 우선
    if (!!a.favorite !== !!b.favorite) return a.favorite ? -1 : 1
    // 2) 생성일(없으면 업데이트일) 최신순
    const diff = tsOf(b) - tsOf(a)
    if (diff) return diff
    // 3) 동률이면 이름 오름차순(안정성)
    return (a.presetName || '').localeCompare(b.presetName || '')
  }

  const items = useMemo(() => {
    const list = data?.items || []
    const filtered =
      type === 'GRID'
        ? list.filter((x) => x.presetType === 'GRID')
        : type === 'PIVOT'
          ? list.filter((x) => x.presetType === 'PIVOT')
          : list
    // 프리셋 config 정규화(조건/NOT/타임 등 query 생성)
    const normalized = filtered.map((p) => ({
      ...p,
      config: normalizePresetConfig(p.config || {}),
    }))
    return normalized.sort(sortByFavThenDate)
  }, [data, type])

  const onFav = async (p) => {
    await favMut.mutateAsync({ presetId: p.presetId, favorite: !p.favorite })
  }
  const onDelete = async (p) => {
    if (!confirm('삭제하시겠습니까?')) return
    await delMut.mutateAsync(p.presetId)
  }

  // GRID/PIVOT만 라우팅
  const onApply = (p) => {
    const routeMap = {
      GRID: userNavigations.SEARCH,
      PIVOT: userNavigations.PIVOT,
    }
    const payload = toSearchSpecFromPreset(p.config || {})
    // SearchPage의 useEffect가 {payload} 형태도 처리함
    navigate(routeMap[p.presetType] ?? userNavigations.GRID, {
      state: { preset: { payload } },
    })
  }

  return (
    <div className='mx-auto w-full max-w-[1200px] px-6 py-6'>
      <Tabs active={type} onChange={setType} />

      <div className='overflow-x-auto rounded-xl border'>
        <table className='min-w-[900px] w-full table-fixed'>
          <thead>
            <tr className='border-b bg-gray-50 text-left text-[13px] text-gray-600'>
              <th className='w-16 px-4 py-2'></th> {/* 비워둔 칼럼 (즐겨찾기 자리) */}
              <th className='px-4 py-2'>프리셋 이름</th>
              <th className='px-4 py-2'>조회 계층</th>
              <th className='px-4 py-2'>생성일</th>
              <th className='px-4 py-2 text-left w-[260px]'>작업</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-sm text-gray-500'>
                  불러오는 중…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-sm text-gray-500'>
                  저장된 프리셋이 없습니다.
                </td>
              </tr>
            ) : (
              items.map((p, i) => (
                <Row
                  key={p.presetId}
                  p={{ ...p, rowNo: i + 1 }}
                  onFav={onFav}
                  onDelete={onDelete}
                  onApply={onApply}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PresetPage
