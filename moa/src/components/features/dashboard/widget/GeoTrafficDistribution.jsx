import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import axiosInstance from '@/api/axios'
import MapIcon from '@/assets/icons/map.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useTrafficByCountry } from '@/hooks/queries/useDashboard'

// 간단한 국기 이모지 매핑 (없으면 🌐)
const countryFlag = (name = '') => {
  const n = String(name).toLowerCase().trim()

  // 빈 문자열이나 "Unknown" 처리
  if (!n || n === 'unknown') return '🌐'

  // 대소문자 구분 없이 매칭
  if (/(대한민국|한국|south korea|korea)/.test(n)) return '🇰🇷'
  if (/(미국|united states|america|usa|u\.s\.)/.test(n)) return '🇺🇸'
  if (/(일본|japan)/.test(n)) return '🇯🇵'
  if (/(중국|china)/.test(n)) return '🇨🇳'
  if (/(영국|united kingdom|britain|uk)/.test(n)) return '🇬🇧'
  if (/(독일|germany)/.test(n)) return '🇩🇪'
  if (/(프랑스|france)/.test(n)) return '🇫🇷'
  if (/(캐나다|canada)/.test(n)) return '🇨🇦'
  if (/(호주|australia)/.test(n)) return '🇦🇺'
  if (/(대만|taiwan)/.test(n)) return '🇹🇼'
  if (/(러시아|russia)/.test(n)) return '🇷🇺'
  if (/(싱가포르|singapore)/.test(n)) return '🇸🇬'
  if (/(핀란드|finland)/.test(n)) return '🇫🇮'
  if (/(노르웨이|norway)/.test(n)) return '🇳🇴'
  if (/(슬로베니아|slovenia)/.test(n)) return '🇸🇮'
  if (/(헝가리|hungary)/.test(n)) return '🇭🇺'
  if (/(그리스|greece)/.test(n)) return '🇬🇷'
  if (/(룩셈부르크|luxembourg)/.test(n)) return '🇱🇺'
  if (/(슬로바키아|slovakia)/.test(n)) return '🇸🇰'
  if (/(건지|guernsey)/.test(n)) return '🇬🇬'
  if (/(안티가|antigua)/.test(n)) return '🇦🇬'

  return '🌐'
}

const nf = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 })

// Byte 단위 추정하여 가독성 있게 포맷 (B/KB/MB/GB/TB)
const formatBytes = (v = 0) => {
  const n = Number(v) || 0
  const KB = 1024,
    MB = KB * 1024,
    GB = MB * 1024,
    TB = GB * 1024
  if (n >= TB) return `${nf.format(n / TB)} TB`
  if (n >= GB) return `${nf.format(n / GB)} GB`
  if (n >= MB) return `${nf.format(n / MB)} MB`
  if (n >= KB) return `${nf.format(n / KB)} KB`
  return `${nf.format(n)} B`
}

// 위젯 전용 필터 Body (Headless 셸용)
const GeoFilterBody = ({ initial, register, countryOptions = [] }) => {
  // initial에서 country 조건 복원
  const initialSelected = useMemo(() => {
    const cond = initial?.conditions?.find(
      (c) => c.field === 'country' && (c.op === 'IN' || c.op === 'EQ'),
    )
    return Array.isArray(cond?.values) ? cond.values : []
  }, [initial])

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(() => new Set(initialSelected))

  // 셸에 현재 값을 반환하는 getter 등록 (적용 버튼이 누를 때 불림)
  useEffect(() => {
    register(() => {
      const values = Array.from(selected)
      return {
        not: false,
        conditions: values.length
          ? [
              {
                field: 'country',
                op: values.length > 1 ? 'IN' : 'EQ',
                values,
                dataType: 'TEXT',
                // TEXT 힌트(백엔드에서 사용하면 전달됨)
                pattern: 'contains',
                caseSensitive: false,
              },
            ]
          : [],
      }
    })
  }, [register, selected])

  const toggle = (name) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = countryOptions.map((c) => ({ label: c.label || c, value: c.value || c }))
    return q ? base.filter((o) => o.label.toLowerCase().includes(q)) : base
  }, [countryOptions, query])

  const selectAll = () => setSelected(new Set(filtered.map((o) => o.label)))
  const clearAll = () => setSelected(new Set())

  return (
    <div className='space-y-4'>
      {/* 검색 */}
      <div className='flex items-center gap-2'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='국가 검색'
          className='flex-1 min-w-0 max-w-[560px] rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
        <button
          type='button'
          onClick={selectAll}
          className='shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-sm hover:bg-gray-50'
        >
          전체 선택
        </button>
        <button
          type='button'
          onClick={clearAll}
          className='shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-sm hover:bg-gray-50'
        >
          선택 해제
        </button>
      </div>

      {/* 선택 요약 */}
      <div className='flex items-center justify-between text-xs text-gray-600'>
        <span>
          선택됨 <b>{selected.size}</b> / {countryOptions.length}
        </span>
        {selected.size > 0 && (
          <div className='flex max-h-20 flex-wrap gap-2 overflow-auto'>
            {Array.from(selected).map((name) => (
              <span
                key={name}
                className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] text-blue-700'
              >
                <span className='text-base leading-none'>{countryFlag(name)}</span>
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 옵션 목록 */}
      <div className='grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4'>
        {filtered.map((o) => {
          const active = selected.has(o.label)
          return (
            <button
              key={o.label}
              type='button'
              onClick={() => toggle(o.label)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                active
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className='flex min-w-0 flex-1 items-center gap-2 text-sm leading-tight'>
                <span className='text-xl leading-none'>{countryFlag(o.label)}</span>
                <span className='break-words'>{o.label}</span>
              </span>
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  active ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className='col-span-full py-6 text-center text-sm text-gray-500'>
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

GeoFilterBody.propTypes = {
  initial: PropTypes.any,
  register: PropTypes.func.isRequired,
  countryOptions: PropTypes.array,
}

const GeoTrafficDistribution = ({ onClose }) => {
  const [filters, setFilters] = useState({ not: false, conditions: [] })
  // 기본(필터 미적용) 데이터는 기존 훅으로
  const { data: baseRows = [], isError } = useTrafficByCountry()
  // 필터 적용 후 API 응답을 로컬 상태로 유지
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // 화면에 표시/옵션 생성에 사용할 최신 데이터
  const effectiveRows = rows.length ? rows : baseRows

  const countryOptions = useMemo(() => {
    const names = (effectiveRows || []).map((r) => r.countryName).filter(Boolean)
    const uniq = Array.from(new Set(names))
    return uniq.map((n) => ({ label: n }))
  }, [effectiveRows])

  const items = useMemo(() => {
    if (!effectiveRows.length) return []

    // 상위 3개 + 기타 묶기
    const top3 = effectiveRows.slice(0, 3)
    const rest = effectiveRows.slice(3)

    const others = rest.length
      ? {
          countryName: '기타',
          trafficVolume: rest.reduce((a, b) => a + (b.trafficVolume || 0), 0),
          percentage: rest.reduce((a, b) => a + (b.percentage || 0), 0),
          requestCount: rest.reduce((a, b) => a + (b.requestCount || 0), 0),
        }
      : null

    const list = others ? [...top3, others] : top3

    return list.map((it, idx) => ({
      flag: countryFlag(it.countryName),
      label: it.countryName,
      pct: Number(it.percentage || 0),
      volume: Number(it.trafficVolume || 0),
      color: ['#2563EB', '#7C3AED', '#8B5CF6', '#DB2777'][idx % 4],
    }))
  }, [effectiveRows])

  const getSelectedCountries = (f) => {
    const cond = f?.conditions?.find((c) => c.field === 'country')
    return Array.isArray(cond?.values) ? cond.values : []
  }

  const postTrafficByCountry = async (payload) => {
    // 백엔드 axios 인스턴스 기준 baseURL에 /api가 이미 붙어있다면 여기서는 /dashboard...로 시작
    const { data } = await axiosInstance.post('/dashboard/widgets/traffic-by-country', payload)
    return data
  }

  return (
    <WidgetCard
      icon={<MapIcon />}
      title='지리적 트래픽 분포'
      description='국가별 인터렉티브 히트맵'
      showSettings={true}
      showClose={true}
      filterOptions={{
        title: '지리적 트래픽 분포 필터',
        description: '해당 위젯에만 적용됩니다.',
        badgeCount: filters?.conditions?.length || 0,
        size: 'xl',
      }}
      renderFilterBody={({ register }) => (
        <GeoFilterBody initial={filters} register={register} countryOptions={countryOptions} />
      )}
      onApplyFilter={async (payload) => {
        const next = payload || { not: false, conditions: [] }
        setFilters(next)

        const countries = getSelectedCountries(next)
        if (!countries.length) {
          // 필터 해제: 기본 훅 데이터 사용
          setRows([])
          return
        }

        // TODO: 전역에서 시간/스텝/프리셋을 받아 연결하세요.
        const now = Math.floor(Date.now() / 1000)
        const body = {
          layer: 'HTTP_PAGE',
          range: { fromEpoch: now - 3600, toEpoch: now },
          step: 60,
          timePreset: '1H',
          countries,
          mapType: 'country',
        }

        try {
          setLoading(true)
          const res = await postTrafficByCountry(body)
          // 응답은 배열 [{ countryName, trafficVolume, requestCount, percentage }]
          setRows(Array.isArray(res) ? res : [])
        } catch (e) {
          console.error('[GeoTrafficDistribution] 필터 조회 실패', e)
        } finally {
          setLoading(false)
        }
      }}
      onClose={onClose}
    >
      <div className='rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>데이터를 불러오지 못했어요.</div>
        ) : loading ? (
          <div className='py-8 text-center text-sm text-slate-500'>불러오는 중…</div>
        ) : items.length ? (
          <div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
            {items.map((it, i) => (
              <div key={`${it.label}-${i}`} className='flex flex-col items-center text-center'>
                <div className='text-3xl'>{it.flag}</div>
                <div className='mt-2 text-3xl font-extrabold' style={{ color: it.color }}>
                  {nf.format(it.pct)}%
                </div>
                <div className='mt-1 text-sm text-slate-600'>{it.label}</div>
                <div className='text-xs text-slate-500'>{formatBytes(it.volume)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className='py-8 text-center text-sm text-slate-500'>표시할 데이터가 없습니다.</div>
        )}
      </div>
    </WidgetCard>
  )
}

GeoTrafficDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default GeoTrafficDistribution
