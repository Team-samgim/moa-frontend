import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import MapIcon from '@/assets/icons/map.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useTrafficByCountry } from '@/hooks/queries/useDashboard'

// 간단한 국기 이모지 매핑 (없으면 🌐)
const countryFlag = (name = '') => {
  const n = String(name).toLowerCase()
  if (/(대한민국|한국|korea)/.test(n)) return '🇰🇷'
  if (/(미국|united states|usa|u\.s\.)/.test(n)) return '🇺🇸'
  if (/(일본|japan)/.test(n)) return '🇯🇵'
  if (/(중국|china)/.test(n)) return '🇨🇳'
  if (/(영국|uk|united kingdom|britain)/.test(n)) return '🇬🇧'
  if (/(독일|germany)/.test(n)) return '🇩🇪'
  if (/(프랑스|france)/.test(n)) return '🇫🇷'
  if (/(캐나다|canada)/.test(n)) return '🇨🇦'
  if (/(호주|australia)/.test(n)) return '🇦🇺'
  if (/(대만|taiwan)/.test(n)) return '🇹🇼'
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

const GeoTrafficDistribution = ({ onClose }) => {
  const { data: rows = [], isError } = useTrafficByCountry()

  const items = useMemo(() => {
    if (!rows.length) return []
    // 상위 3개 + 기타 묶기
    const top3 = rows.slice(0, 3)
    const rest = rows.slice(3)
    const others = rest.length
      ? {
          country: '기타',
          volume: rest.reduce((a, b) => a + (b.volume || 0), 0),
          pct: rest.reduce((a, b) => a + (b.pct || 0), 0),
          requests: rest.reduce((a, b) => a + (b.requests || 0), 0),
        }
      : null
    const list = others ? [...top3, others] : top3
    // 색상 팔레트 (좌→우)
    const colors = ['#2563EB', '#7C3AED', '#8B5CF6', '#DB2777']
    return list.map((it, idx) => ({
      flag: countryFlag(it.country),
      label: it.country,
      pct: Number(it.pct || 0),
      volume: Number(it.volume || 0),
      color: colors[idx % colors.length],
    }))
  }, [rows])

  return (
    <WidgetCard
      icon={<MapIcon />}
      title='지리적 트래픽 분포'
      description='국가별 인터렉티브 히트맵'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('지리적 트래픽 분포 설정')}
      onClose={onClose} // DashboardPage에서 받은 onClose 전달
    >
      <div className='rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>데이터를 불러오지 못했어요.</div>
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

// PropTypes 추가
GeoTrafficDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default GeoTrafficDistribution
