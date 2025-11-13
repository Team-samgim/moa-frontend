// src/components/detail/EthernetRowPreviewModal.jsx
import { memo, useEffect, useState } from 'react'
import useEthernetMetrics from '@/hooks/detail/useEthernetMetrics'

// bytes pretty print
const prettyBytes = (n = 0) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

const pct = (v = 0) => `${((v || 0) * 100).toFixed(2)}%`

// 임계치: 프로젝트 기준 자유 조정
const levelByRate = (r = 0) => (r >= 0.05 ? 'crit' : r > 0 ? 'warn' : 'ok')

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

const Chip = ({ children }) => (
  <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>{children}</span>
)

// 라벨/값
const LV = ({ label, value }) => (
  <div className='text-sm'>
    <span className='text-gray-500'>{label}</span>
    <span className='ml-2 font-medium break-all'>{value}</span>
  </div>
)

const TabButton = ({ id, activeId, onClick, children }) => {
  const active = id === activeId
  return (
    <button
      type='button'
      onClick={() => onClick(id)}
      className={[
        'px-3 py-2 text-xs md:text-sm border-b-2 -mb-px',
        active
          ? 'border-blue-500 text-blue-600 font-semibold'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// 진단 메시지 severity 추정 (문구에 crit 들어가면 crit)
const diagLevel = (msg = '') => (msg && msg.includes('crit') ? 'crit' : 'warn')

const EthernetRowPreviewModal = memo(function EthernetRowPreviewModal({ open, onClose, rowKey }) {
  const q = useEthernetMetrics(rowKey)
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'errors'

  // ESC close
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // 모달 닫힐 때 탭 초기화
  useEffect(() => {
    if (!open) setActiveTab('summary')
  }, [open])

  if (!open) return null

  const d = q.data || {}

  // DTO 필드 매핑 (백엔드 EthernetMetricsDTO 기준)
  const {
    rowKey: _rk,
    srcMac,
    dstMac,
    srcIp,
    dstIp,

    // 프로토콜 정보
    l2Proto,
    l3Proto,
    l4Proto,
    l7Proto,
    ipVersion,

    // 규모/시간/속도
    durSec,
    bps,
    frames,
    framesTx,
    framesRx,
    bytes,
    bytesTx,
    bytesRx,

    // 오류 카운트 (플랫)
    crcErrorCnt,
    alignmentErrorCnt,
    runtCnt,
    giantCnt,
    jabberCnt,
    pauseCnt,
    collisionCnt,
    lateCollisionCnt,

    // 품질 / 진단
    qualityCounts,
    badges,
    diagnostics,
  } = d

  const mbps = (bps || 0) / 1_000_000
  const diagEntries = Object.entries(diagnostics || {})
  const qCounts = qualityCounts || {}

  // 에러 비율 계산 (전체 프레임 대비)
  const totalFrames = frames || 0
  const rate = (cnt = 0) => (totalFrames > 0 ? cnt / totalFrames : 0)

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center'>
      {/* overlay */}
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      {/* dialog */}
      <div
        role='dialog'
        aria-modal='true'
        className='relative w-[min(96vw,920px)] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col'
      >
        {/* header */}
        <div className='flex items-center justify-between border-b px-5 py-3'>
          <h2 className='text-base font-semibold'>Ethernet 상세</h2>
          <button
            className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50'
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* 탭 헤더 */}
        <div className='px-5 pt-3 border-b flex gap-2 overflow-x-auto'>
          <TabButton id='summary' activeId={activeTab} onClick={setActiveTab}>
            요약
          </TabButton>
          <TabButton id='errors' activeId={activeTab} onClick={setActiveTab}>
            오류 / 품질
          </TabButton>
        </div>

        {/* body */}
        <div className='p-5 space-y-5 overflow-y-auto flex-1'>
          {q.isLoading && <div className='text-sm text-gray-500'>불러오는 중…</div>}
          {q.isError && (
            <div className='text-sm text-red-600'>
              요약을 불러오지 못했습니다. {q.error && q.error.message ? q.error.message : ''}
            </div>
          )}
          {q.isSuccess && !q.data && <div className='text-sm text-gray-500'>데이터 없음</div>}

          {q.isSuccess && q.data && (
            <>
              {/* 공통: L2 세션 정보 */}
              <div className='rounded-xl border bg-white p-4'>
                <div className='text-sm text-gray-500 mb-1'>L2 세션</div>
                <div className='text-[15px] font-semibold'>
                  {srcMac} <span className='text-gray-400'>→</span> {dstMac}
                </div>
                {(srcIp || dstIp) && (
                  <div className='mt-1 text-xs text-gray-500'>
                    {srcIp && <span>Src IP: {srcIp}</span>}
                    {srcIp && dstIp && <span className='mx-2'>|</span>}
                    {dstIp && <span>Dst IP: {dstIp}</span>}
                  </div>
                )}
                <div className='mt-2 flex flex-wrap gap-2'>
                  {typeof ipVersion !== 'undefined' && ipVersion !== null && (
                    <Chip>IP v{ipVersion}</Chip>
                  )}
                  {typeof l2Proto !== 'undefined' && l2Proto !== null && <Chip>L2: {l2Proto}</Chip>}
                  {typeof l3Proto !== 'undefined' && l3Proto !== null && <Chip>L3: {l3Proto}</Chip>}
                  {typeof l4Proto !== 'undefined' && l4Proto !== null && <Chip>L4: {l4Proto}</Chip>}
                  {typeof l7Proto !== 'undefined' && l7Proto !== null && <Chip>L7: {l7Proto}</Chip>}
                  {badges && badges.bcast && <Chip>Broadcast</Chip>}
                  {badges && badges.mcast && <Chip>Multicast</Chip>}
                  {badges && badges.jumbo && <Chip>Jumbo Frame</Chip>}
                  {badges && badges.error && <Chip>Error</Chip>}
                </div>
              </div>

              {/* === 탭별 콘텐츠 === */}
              {activeTab === 'summary' && (
                <>
                  {/* KPI 4칸 */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>기간</div>
                      <div className='text-base font-semibold'>
                        {Number(durSec || 0).toFixed(3)}s
                      </div>
                    </div>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>평균 처리량</div>
                      <div className='text-base font-semibold'>{mbps.toFixed(2)} Mbps</div>
                    </div>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>프레임 수</div>
                      <div className='text-base font-semibold'>
                        {(frames || 0).toLocaleString()}
                        <span className='text-gray-500'>
                          {' '}
                          (tx {(framesTx || 0).toLocaleString()}, rx{' '}
                          {(framesRx || 0).toLocaleString()})
                        </span>
                      </div>
                    </div>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>바이트</div>
                      <div className='text-base font-semibold'>
                        {prettyBytes(bytes || 0)}
                        <span className='text-gray-500'>
                          {' '}
                          (tx {prettyBytes(bytesTx || 0)}, rx {prettyBytes(bytesRx || 0)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 진단 요약 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>진단 요약</div>
                    {diagEntries.length === 0 && (
                      <div className='text-xs text-gray-500'>특이사항 없음</div>
                    )}
                    {diagEntries.length > 0 && (
                      <ul className='space-y-2 text-xs'>
                        {diagEntries.map(([k, msg]) => (
                          <li
                            key={k}
                            className='flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2'
                          >
                            <Badge level={diagLevel(msg)}>{k}</Badge>
                            <span className='text-gray-700'>{msg}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 품질 관련 카운트(전체) */}
                  {Object.keys(qCounts).length > 0 && (
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-2 text-sm font-semibold text-gray-800'>카운트</div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        {Object.entries(qCounts).map(([k, v]) => (
                          <LV key={k} label={k} value={(v || 0).toLocaleString()} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'errors' && (
                <div className='space-y-4'>
                  {/* 오류 상세 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>
                      프레임 오류 / 품질
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm'>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='CRC 오류' value={(crcErrorCnt || 0).toLocaleString()} />
                        <Badge level={levelByRate(rate(crcErrorCnt || 0))}>
                          {pct(rate(crcErrorCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV
                          label='Alignment 오류'
                          value={(alignmentErrorCnt || 0).toLocaleString()}
                        />
                        <Badge level={levelByRate(rate(alignmentErrorCnt || 0))}>
                          {pct(rate(alignmentErrorCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Runt 프레임' value={(runtCnt || 0).toLocaleString()} />
                        <Badge level={levelByRate(rate(runtCnt || 0))}>
                          {pct(rate(runtCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Giant 프레임' value={(giantCnt || 0).toLocaleString()} />
                        <Badge level={levelByRate(rate(giantCnt || 0))}>
                          {pct(rate(giantCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Jabber' value={(jabberCnt || 0).toLocaleString()} />
                        <Badge level={levelByRate(rate(jabberCnt || 0))}>
                          {pct(rate(jabberCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Pause 프레임' value={(pauseCnt || 0).toLocaleString()} />
                        <Badge level={levelByRate(rate(pauseCnt || 0))}>
                          {pct(rate(pauseCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Collision' value={(collisionCnt || 0).toLocaleString()} />
                        <Badge level={levelByRate(rate(collisionCnt || 0))}>
                          {pct(rate(collisionCnt || 0))}
                        </Badge>
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV
                          label='Late Collision'
                          value={(lateCollisionCnt || 0).toLocaleString()}
                        />
                        <Badge level={levelByRate(rate(lateCollisionCnt || 0))}>
                          {pct(rate(lateCollisionCnt || 0))}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 품질 카운트 (qualityCounts) */}
                  {Object.keys(qCounts).length > 0 && (
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-2 text-sm font-semibold text-gray-800'>
                        품질 관련 카운트 (qualityCounts)
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        {Object.entries(qCounts).map(([k, v]) => (
                          <LV key={k} label={k} value={(v || 0).toLocaleString()} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 내부 키 */}
              <div className='text-xs text-gray-400 mt-2'>rowKey: {_rk}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export default EthernetRowPreviewModal
