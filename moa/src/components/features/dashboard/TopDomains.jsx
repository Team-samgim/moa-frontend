import React from 'react'
import TrendingUpIcon from '@/assets/icons/trending-up.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useTopDomains } from '@/hooks/queries/useDashboard'

// 긴 도메인은 eTLD+1 수준으로 축약 (예: a.b.naver.com -> naver.com, naver.co.kr -> naver.co.kr)
const shortDomain = (d) => {
  if (!d) return ''
  const parts = String(d).split('.').filter(Boolean)
  if (parts.length >= 3) {
    const sld = parts[parts.length - 2]
    if (sld.length <= 3) return parts.slice(-3).join('.')
  }
  if (parts.length >= 2) return parts.slice(-2).join('.')
  return d
}

const pctTo100 = (v) => {
  const n = Number(v ?? 0)
  const p = Number.isFinite(n) ? (n <= 1 ? n * 100 : n) : 0
  return Math.max(0, Math.min(100, p))
}

const Row = ({ rank, domain, pct }) => {
  const p = pctTo100(pct)
  return (
    <li className='flex items-center gap-2'>
      <span className='w-5 shrink-0 text-xs text-slate-500'>{rank}</span>
      <span className='min-w-0 flex-1 truncate font-medium text-slate-800'>
        {shortDomain(domain)}
      </span>
      <div className='relative mx-2 h-2 w-40 rounded-full bg-slate-200 md:flex-1'>
        <div
          className='absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-400'
          style={{ width: `${p}%` }}
        />
      </div>
      <span className='w-14 shrink-0 text-right text-[13px] font-extrabold tabular-nums text-slate-900'>
        {Math.round(p)}%
      </span>
    </li>
  )
}

const Skeleton = () => (
  <ul className='space-y-2'>
    {Array.from({ length: 5 }).map((_, i) => (
      <li key={i} className='flex items-center gap-2'>
        <span className='w-5 text-sm text-slate-300'>{i + 1}</span>
        <div className='h-4 w-40 rounded bg-slate-200/70 animate-pulse' />
        <div className='relative mx-2 h-2 flex-1 rounded-full bg-slate-200/70 overflow-hidden'>
          <div className='absolute inset-y-0 left-0 w-1/2 animate-pulse bg-slate-300/70' />
        </div>
        <div className='h-4 w-10 rounded bg-slate-200/70 animate-pulse' />
      </li>
    ))}
  </ul>
)

const TopDomains = () => {
  const { data: rows = [], isLoading, isError } = useTopDomains(10)

  return (
    <WidgetCard
      icon={<TrendingUpIcon />}
      title='Top 10 도메인'
      description='트래픽 순위'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('Top 10 도메인 설정')}
      onClose={() => console.log('Top 10 도메인 닫기')}
    >
      <div className='py-2'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>데이터를 불러오지 못했어요.</div>
        ) : isLoading ? (
          <Skeleton />
        ) : rows.length ? (
          <ol className='space-y-2'>
            {rows.map((r, i) => (
              <Row key={r.domain} rank={i + 1} domain={r.domain} pct={r.pct} />
            ))}
          </ol>
        ) : (
          <div className='py-8 text-center text-sm text-slate-500'>표시할 데이터가 없습니다.</div>
        )}
      </div>
    </WidgetCard>
  )
}

export default TopDomains
