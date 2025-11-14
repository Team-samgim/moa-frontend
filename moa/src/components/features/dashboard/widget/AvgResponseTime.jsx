import React from 'react'
import PropTypes from 'prop-types' // 🔥 추가
import ClockIcon from '@/assets/icons/clock.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useResponseTime } from '@/hooks/queries/useDashboard'

const nf = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 })
const formatMs = (ms) => {
  const v = Number(ms) || 0
  if (v >= 1000) return `${nf.format(v / 1000)}s`
  return `${Math.round(v)}ms`
}

const Stat = ({ label, value }) => {
  return (
    <div className='text-center'>
      <div className='text-xs text-slate-500'>{label}</div>
      <div className='mt-1 text-base font-extrabold text-slate-900'>{formatMs(value)}</div>
    </div>
  )
}

// 🔥 onClose prop 추가
const AvgResponseTime = ({ onClose }) => {
  const { data, isError } = useResponseTime()

  const avg = Number(data?.avg ?? 0)
  const min = Number(data?.min ?? 0)
  const med = Number(data?.p50 ?? 0)
  const max = Number(data?.max ?? 0)

  const vals = [avg, min, med, max]
  const secondsLike = vals.some((v) => v > 0 && v < 1) && Math.max(...vals) < 20
  const toMs = (v) => (secondsLike ? v * 1000 : v)

  const avgMs = toMs(avg)
  const minMs = toMs(min)
  const medMs = toMs(med)
  const maxMs = toMs(max)

  const prev = Number(data?.prevAvg)
  const hasPrev = Number.isFinite(prev) && prev > 0
  const deltaPct = hasPrev ? ((avg - prev) / prev) * 100 : null
  const deltaUp = (deltaPct ?? 0) > 0

  return (
    <WidgetCard
      icon={<ClockIcon />}
      title='평균 응답 시간'
      description='성능 지표'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('평균 응답 시간 설정')}
      onClose={onClose} // 🔥 DashboardPage에서 받은 onClose 전달
    >
      <div className='flex min-h-[260px] flex-col'>
        {isError ? (
          <div className='p-3 text-sm text-red-500'>데이터를 불러오지 못했어요.</div>
        ) : (
          <>
            <div className='flex flex-1 flex-col items-center justify-center py-2'>
              <div className='text-5xl font-extrabold leading-none text-blue-600 md:text-6xl'>
                {formatMs(avgMs)}
              </div>
              {hasPrev && (
                <div
                  className={`mt-2 text-sm font-semibold ${deltaUp ? 'text-red-600' : 'text-emerald-600'}`}
                >
                  <span>{deltaUp ? '↑' : '↓'}</span>
                  <span className='ml-1'>
                    {Math.abs(deltaPct).toFixed(1)}% {deltaUp ? '증가' : '감소'}
                  </span>
                </div>
              )}
            </div>

            <hr className='my-4 w-full border-slate-200' />

            <div className='grid w-full grid-cols-3 gap-4'>
              <Stat label='최소' value={minMs} />
              <Stat label='중간값' value={medMs} />
              <Stat label='최대' value={maxMs} />
            </div>
          </>
        )}
      </div>
    </WidgetCard>
  )
}

// 🔥 PropTypes 추가
AvgResponseTime.propTypes = {
  onClose: PropTypes.func,
}

export default AvgResponseTime
