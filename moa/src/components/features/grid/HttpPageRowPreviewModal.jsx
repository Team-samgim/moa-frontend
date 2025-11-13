import { memo, useEffect } from 'react'
import useHttpPageMetrics from '@/hooks/detail/useHttpPageMetrics'

const prettyBytes = (n = 0) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}
const pct = (v = 0) => `${((v || 0) * 100).toFixed(2)}%`

const Badge = ({ level = 'ok', children }) => {
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

// 라벨과 값이 딱 붙어서 보이도록(“멀다” 이슈 해결)
const LV = ({ label, value }) => (
  <div className='text-sm'>
    <span className='text-gray-500'>{label}</span>
    <span className='ml-2 font-medium'>{value}</span>
  </div>
)

const HttpPageRowPreviewModal = memo(function HttpPageRowPreviewModal({ open, onClose, rowKey }) {
  const q = useHttpPageMetrics(rowKey)

  // ESC로 닫기
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const d = q.data || {}

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center'>
      {/* overlay */}
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      {/* dialog */}
      <div
        role='dialog'
        aria-modal='true'
        className='relative w-[min(96vw,860px)] max-h-[90vh] bg-white rounded-2xl shadow-xl'
      >
        {/* header */}
        <div className='flex items-center justify-between border-b px-5 py-3'>
          <h2 className='text-base font-semibold'>HTTP 페이지 요약</h2>
          <button
            className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50'
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* body */}
        <div className='p-5 space-y-5 overflow-y-auto'>
          {q.isLoading && <div className='text-sm text-gray-500'>불러오는 중…</div>}
          {q.isError && (
            <div className='text-sm text-red-600'>
              요약을 불러오지 못했습니다. {q.error?.message || ''}
            </div>
          )}
          {q.isSuccess && !q.data && <div className='text-sm text-gray-500'>데이터 없음</div>}

          {q.isSuccess && q.data && (
            <>
              {/* 엔드포인트 / 태그 */}
              <div className='rounded-xl border bg-white p-4'>
                <div className='text-sm text-gray-500 mb-1'>세션</div>
                <div className='text-[15px] font-semibold'>
                  {d.srcIp}:{d.srcPort} <span className='text-gray-400'>→</span> {d.dstIp}:
                  {d.dstPort}
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {d.app && (
                    <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                      App: {d.app}
                    </span>
                  )}
                  {d.master && (
                    <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                      Proto: {d.master}
                    </span>
                  )}
                  {d.host && (
                    <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                      Host: {d.host}
                    </span>
                  )}
                  {d.method && (
                    <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                      Method: {d.method}
                    </span>
                  )}
                  {d.resCode !== null && (
                    <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>
                      Status: {d.resCode}
                    </span>
                  )}
                </div>
                {d.uri && <div className='text-xs text-gray-500 mt-2 break-all'>URI: {d.uri}</div>}
              </div>

              {/* KPI 4칸 */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                <div className='rounded-xl border bg-white p-4'>
                  <div className='text-xs text-gray-500'>기간</div>
                  <div className='text-base font-semibold'>{(d.durSec ?? 0).toFixed(3)}s</div>
                </div>
                <div className='rounded-xl border bg-white p-4'>
                  <div className='text-xs text-gray-500'>평균 처리량</div>
                  <div className='text-base font-semibold'>
                    {(d.mbps ?? (d.bps ? d.bps / 1_000_000 : 0)).toFixed(2)} Mbps
                  </div>
                </div>
                <div className='rounded-xl border bg-white p-4'>
                  <div className='text-xs text-gray-500'>바이트</div>
                  <div className='text-base font-semibold'>
                    {prettyBytes(d.len || 0)}{' '}
                    <span className='text-gray-500'>
                      (req {prettyBytes(d.lenReq || 0)}, res {prettyBytes(d.lenRes || 0)})
                    </span>
                  </div>
                </div>
                <div className='rounded-xl border bg-white p-4'>
                  <div className='text-xs text-gray-500'>패킷</div>
                  <div className='text-base font-semibold'>
                    {(d.pkts || 0).toLocaleString()}{' '}
                    <span className='text-gray-500'>
                      (req {(d.pktsReq || 0).toLocaleString()}, res{' '}
                      {(d.pktsRes || 0).toLocaleString()})
                    </span>
                  </div>
                </div>
              </div>

              {/* 품질 지표 + 배지 */}
              <div className='rounded-xl border bg-white p-4'>
                <div className='mb-3 text-sm font-semibold text-gray-800'>품질 지표</div>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <div>
                    <LV label='재전송율' value={pct(d.retransRateBytes)} />
                    <div className='mt-1'>
                      <Badge level={d.badges?.retrans}>Retrans {pct(d.retransRateBytes)}</Badge>
                    </div>
                  </div>
                  <div>
                    {/* OOO → 사용자 친화 라벨 */}
                    <LV label='순서 뒤바뀜율 (OOO)' value={pct(d.oooRatePkts)} />
                    <div className='mt-1'>
                      <Badge level={d.badges?.ooo}>Out-of-Order {pct(d.oooRatePkts)}</Badge>
                    </div>
                  </div>
                  <div>
                    <LV label='손실율' value={pct(d.lossRatePkts)} />
                    <div className='mt-1'>
                      <Badge level={d.badges?.loss}>Loss {pct(d.lossRatePkts)}</Badge>
                    </div>
                  </div>
                  <div>
                    <LV label='TCP 오류율' value={pct(d.tcpErrorRatePkts ?? d.csumRatePkts)} />
                    <div className='mt-1'>
                      <Badge level={d.badges?.tcpError ?? d.badges?.csum}>
                        TCP Error {pct(d.tcpErrorRatePkts ?? d.csumRatePkts)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 아래 4칸 그리드 → 앞의 3칸만 사용해서 위와 폭 맞춤 */}
                <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <div className='rounded-lg bg-gray-50 p-3'>
                    <LV label='HTTPS' value={d.isHttps ? '예' : '아니오'} />
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3'>
                    <LV label='HTTP 메서드' value={d.method || '-'} />
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3'>
                    <LV label='응답 코드' value={d.resCode !== null ? String(d.resCode) : '-'} />
                  </div>
                  {/* 4번째 칸은 레이아웃 정렬용 더미 */}
                  <div className='hidden md:block' />
                </div>
              </div>

              {/* 카운트 섹션 (필요 시 확장) */}
              {d.qualityCounts && Object.keys(d.qualityCounts).length > 0 && (
                <div className='rounded-xl border bg-white p-4'>
                  <div className='mb-2 text-sm font-semibold text-gray-800'>카운트</div>
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                    {Object.entries(d.qualityCounts).map(([k, v]) => (
                      <LV key={k} label={k} value={(v ?? 0).toLocaleString()} />
                    ))}
                  </div>
                </div>
              )}

              {/* 내부 키 */}
              <div className='text-xs text-gray-400 mt-2'>rowKey: {d.rowKey}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export default HttpPageRowPreviewModal
