import { memo, useEffect, useRef, useState } from 'react'
import useTcpMetrics from '@/hooks/detail/useTcpMetrics'

const prettyBytes = (n = 0) => {
  if (n === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}
const pct = (v) => `${(v * 100).toFixed(2)}%`

const Badge = ({ level, children }) => {
  const cls =
    level === 'crit'
      ? 'bg-red-100 text-red-700 border-red-200'
      : level === 'warn'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${cls}`}>
      {children}
    </span>
  )
}

const TinyBadge = ({ level, children }) => {
  const cls =
    level === 'crit'
      ? 'bg-red-100 text-red-700 border-red-200'
      : level === 'warn'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border ${cls}`}>
      {children}
    </span>
  )
}

const KV = ({ label, value }) => (
  <div className='flex items-center gap-5 text-sm leading-tight'>
    <span className='text-gray-500 whitespace-nowrap'>{label}</span>
    <span className='font-medium'>{value}</span>
  </div>
)

const Row = ({ label, value }) => (
  <div className='flex items-center justify-between py-1'>
    <span className='text-gray-500 text-sm'>{label}</span>
    <span className='text-sm font-medium'>{String(value)}</span>
  </div>
)

const Dim = ({ children }) => <span className='text-gray-500'>{children}</span>

const TcpRowPreviewModal = memo(function TcpRowPreviewModal({ open, onClose, rowKey }) {
  const q = useTcpMetrics(rowKey)

  // ESC 닫기
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 바디 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // 포커스 이동(접근성)
  const closeBtnRef = useRef(null)
  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  // 등장 트랜지션
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(t)
    } else {
      setMounted(false)
    }
  }, [open])

  if (!open) return null

  return (
    <div className='fixed inset-0 z-[100]' aria-hidden={!open}>
      {/* overlay */}
      <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' onClick={onClose} />
      {/* centered dialog */}
      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='tcp-dialog-title'
          className={[
            'w-full max-w-[900px] max-h-[85vh] overflow-hidden rounded-2xl',
            'border bg-white shadow-2xl',
            'transform transition duration-200 ease-out',
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          ].join(' ')}
        >
          {/* header */}
          <div className='flex items-center justify-between border-b px-6 py-4'>
            <div id='tcp-dialog-title' className='text-lg font-semibold'>
              TCP 세션 요약
            </div>
            <button
              ref={closeBtnRef}
              className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              onClick={onClose}
            >
              닫기
            </button>
          </div>

          {/* body */}
          <div className='p-6 space-y-6 overflow-auto' style={{ maxHeight: 'calc(85vh - 60px)' }}>
            {/* 로딩/에러/빈 */}
            {q.isLoading && <div className='text-sm text-gray-500'>불러오는 중…</div>}
            {q.isError && (
              <div className='text-sm text-red-600'>
                요약을 불러오지 못했습니다. {q.error?.message || ''}
              </div>
            )}
            {q.isSuccess && !q.data && <div className='text-sm text-gray-500'>데이터 없음</div>}

            {q.isSuccess && q.data && (
              <>
                {/* 헤더 (엔드포인트) */}
                <div className='rounded-xl border bg-white p-4'>
                  <div className='text-sm text-gray-500 mb-1'>세션</div>
                  <div className='text-[15px] font-semibold'>
                    {q.data.srcIp}:{q.data.srcPort} <span className='text-gray-400'>→</span>{' '}
                    {q.data.dstIp}:{q.data.dstPort}
                  </div>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {q.data.app && (
                      <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                        App: {q.data.app}
                      </span>
                    )}
                    {q.data.master && (
                      <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                        Proto: {q.data.master}
                      </span>
                    )}
                    {q.data.sni && (
                      <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                        SNI: {q.data.sni}
                      </span>
                    )}
                  </div>
                </div>

                {/* KPI */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='text-xs text-gray-500'>기간</div>
                    <div className='text-base font-semibold'>{q.data.durSec.toFixed(3)}s</div>
                  </div>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='text-xs text-gray-500'>평균 처리량</div>
                    <div className='text-base font-semibold'>
                      {prettyBytes((q.data.bps || 0) / 8)}/s{' '}
                      <Dim>({Math.round(q.data.bps)} bps)</Dim>
                    </div>
                  </div>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='text-xs text-gray-500'>바이트</div>
                    <div className='text-base font-semibold'>
                      {prettyBytes(q.data.len)}{' '}
                      <Dim>
                        (req {prettyBytes(q.data.lenReq)}, res {prettyBytes(q.data.lenRes)})
                      </Dim>
                    </div>
                  </div>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='text-xs text-gray-500'>패킷</div>
                    <div className='text-base font-semibold'>
                      {q.data.pkts.toLocaleString()}{' '}
                      <Dim>
                        (req {q.data.pktsReq?.toLocaleString?.() || 0}, res{' '}
                        {q.data.pktsRes?.toLocaleString?.() || 0})
                      </Dim>
                    </div>
                  </div>
                </div>

                {/* 품질/배지 */}
                <div className='rounded-xl border bg-white p-3'>
                  <div className='mb-2 text-[13px] font-semibold text-gray-800 leading-tight'>
                    품질 지표
                  </div>

                  {/* 4개 핵심 지표 */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 text-[13px] leading-tight'>
                    <div className='space-y-1'>
                      <KV label='재전송율' value={pct(q.data.retransRateBytes)} />
                      <TinyBadge level={q.data.badges?.retrans}>
                        Retrans {pct(q.data.retransRateBytes)}
                      </TinyBadge>
                    </div>
                    <div className='space-y-1'>
                      <KV label='순서 불일치율' value={pct(q.data.oooRatePkts)} />
                      <TinyBadge level={q.data.badges?.ooo}>
                        Out-of-Order {pct(q.data.oooRatePkts)}
                      </TinyBadge>
                    </div>
                    <div className='space-y-1'>
                      <KV label='손실율' value={pct(q.data.lossRatePkts)} />
                      <TinyBadge level={q.data.badges?.loss}>
                        Loss {pct(q.data.lossRatePkts)}
                      </TinyBadge>
                    </div>
                    <div className='space-y-1'>
                      <KV label='체크섬오류율' value={pct(q.data.csumRatePkts)} />
                      <TinyBadge level={q.data.badges?.csum}>
                        Checksum {pct(q.data.csumRatePkts)}
                      </TinyBadge>
                    </div>
                  </div>

                  {/* 패턴/상태 */}
                  <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-[13px] leading-tight'>
                    <KV label='ACK-only 추정' value={q.data.ackOnly ? '예' : '아니오'} />
                    <KV label='핸드셰이크' value={q.data.handshake} />
                    <KV label='종료' value={q.data.termination} />
                  </div>
                </div>

                {/* 플래그/카운트 */}
                <div className='rounded-xl border bg-white p-4'>
                  <div className='mb-2 text-sm font-semibold text-gray-800'>플래그/품질 카운트</div>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                    {Object.entries(q.data.flags || {}).map(([k, v]) => (
                      <Row key={`f-${k}`} label={k} value={v} />
                    ))}
                    {Object.entries(q.data.qualityCounts || {}).map(([k, v]) => (
                      <Row key={`q-${k}`} label={k} value={v} />
                    ))}
                  </div>
                </div>

                {/* 내부 키 확인용 */}
                <div className='text-xs text-gray-400 mt-2'>rowKey: {q.data.rowKey}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default TcpRowPreviewModal
