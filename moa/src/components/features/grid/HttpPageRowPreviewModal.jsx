import { memo, useEffect, useState } from 'react'
import useHttpPageMetrics from '@/hooks/detail/useHttpPageMetrics'

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

const HttpPageRowPreviewModal = memo(function HttpPageRowPreviewModal({ open, onClose, rowKey }) {
  const q = useHttpPageMetrics(rowKey)
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'timing' | 'transport' | 'http'

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

  // DTO 필드 매핑 (백엔드 HttpPageMetricsDTO)
  const {
    rowKey: _rk,
    srcIp,
    srcPort,
    dstIp,
    dstPort,
    app,
    master,
    https,
    host,
    uri,
    method,
    resCode,
    resPhrase,

    // 규모/시간/속도
    durSec,
    bps,
    bytes,
    bytesReq,
    bytesRes,
    pkts,
    pktsReq,
    pktsRes,

    // 품질 비율 (모두 '...Pkts')
    retransRatePkts,
    oooRatePkts,
    lossRatePkts,
    csumRatePkts,

    // 카운트/배지/세부
    qualityCounts,
    badges,
    timings,
    transport,
    http: httpInfo,
    env,
    diagnostics,
  } = d

  // Mbps 파생
  const mbps = (bps || 0) / 1_000_000
  const diagEntries = Object.entries(diagnostics || {})
  const qCounts = qualityCounts || {}

  const t = timings || {}
  const tr = transport || {}
  const h = httpInfo || {}
  const e = env || {}

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center'>
      {/* overlay */}
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      {/* dialog */}
      <div
        role='dialog'
        aria-modal='true'
        className='relative w-[min(96vw,980px)] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col'
      >
        {/* header */}
        <div className='flex items-center justify-between border-b px-5 py-3'>
          <h2 className='text-base font-semibold'>HTTP 페이지 상세</h2>
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
          <TabButton id='timing' activeId={activeTab} onClick={setActiveTab}>
            타이밍 / 성능
          </TabButton>
          <TabButton id='transport' activeId={activeTab} onClick={setActiveTab}>
            전송 / 품질
          </TabButton>
          <TabButton id='http' activeId={activeTab} onClick={setActiveTab}>
            HTTP / 환경
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
              {/* 공통: 엔드포인트 / 태그 */}
              <div className='rounded-xl border bg-white p-4'>
                <div className='text-sm text-gray-500 mb-1'>세션</div>
                <div className='text-[15px] font-semibold'>
                  {srcIp}:{srcPort} <span className='text-gray-400'>→</span> {dstIp}:{dstPort}
                </div>
                <div className='mt-2 flex flex-wrap gap-2'>
                  {app && <Chip>App: {app}</Chip>}
                  {master && <Chip>Proto: {master}</Chip>}
                  {host && <Chip>Host: {host}</Chip>}
                  {method && <Chip>Method: {method}</Chip>}
                  {Number.isInteger(resCode) && <Chip>Status: {resCode}</Chip>}
                  {https && <Chip>HTTPS</Chip>}
                  {badges && badges.res && <Chip>Resp: {badges.res}</Chip>}
                  {badges && badges.timeout && <Chip>Timeout</Chip>}
                  {badges && badges.incomplete && <Chip>Incomplete</Chip>}
                  {badges && badges.stopped && <Chip>Stopped</Chip>}
                </div>
                {uri && <div className='text-xs text-gray-500 mt-2 break-all'>URI: {uri}</div>}
                {resPhrase && <div className='text-xs text-gray-500 mt-1'>Reason: {resPhrase}</div>}
              </div>

              {/* === 탭별 콘텐츠 === */}
              {activeTab === 'summary' && (
                <>
                  {/* KPI 4칸 */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>기간</div>
                      <div className='text-base font-semibold'>{(durSec || 0).toFixed(3)}s</div>
                    </div>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>평균 처리량</div>
                      <div className='text-base font-semibold'>{mbps.toFixed(2)} Mbps</div>
                    </div>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>바이트</div>
                      <div className='text-base font-semibold'>
                        {prettyBytes(bytes || 0)}{' '}
                        <span className='text-gray-500'>
                          (req {prettyBytes(bytesReq || 0)}, res {prettyBytes(bytesRes || 0)})
                        </span>
                      </div>
                    </div>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-xs text-gray-500'>패킷</div>
                      <div className='text-base font-semibold'>
                        {(pkts || 0).toLocaleString()}{' '}
                        <span className='text-gray-500'>
                          (req {(pktsReq || 0).toLocaleString()}, res{' '}
                          {(pktsRes || 0).toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 품질 지표 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-3 text-sm font-semibold text-gray-800'>품질 지표</div>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      <div>
                        <LV label='재전송율' value={pct(retransRatePkts)} />
                        <div className='mt-1'>
                          <Badge level={levelByRate(retransRatePkts)}>
                            Retrans {pct(retransRatePkts)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <LV label='순서 뒤바뀜율 (OOO)' value={pct(oooRatePkts)} />
                        <div className='mt-1'>
                          <Badge level={levelByRate(oooRatePkts)}>
                            Out-of-Order {pct(oooRatePkts)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <LV label='손실율' value={pct(lossRatePkts)} />
                        <div className='mt-1'>
                          <Badge level={levelByRate(lossRatePkts)}>Loss {pct(lossRatePkts)}</Badge>
                        </div>
                      </div>
                      <div>
                        <LV label='TCP 오류율 (Checksum)' value={pct(csumRatePkts)} />
                        <div className='mt-1'>
                          <Badge level={levelByRate(csumRatePkts)}>
                            TCP Error {pct(csumRatePkts)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 서버 진단 메시지 */}
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

                  {/* 카운트 섹션 */}
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

              {activeTab === 'timing' && (
                <div className='space-y-4'>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>연결 / 요청 준비</div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <LV
                        label='TCP 연결 평균'
                        value={t.connectAvg !== null ? `${t.connectAvg.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='TCP 연결 최소'
                        value={t.connectMin !== null ? `${t.connectMin.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='TCP 연결 최대'
                        value={t.connectMax !== null ? `${t.connectMax.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='요청 생성 평균'
                        value={t.reqMakingAvg !== null ? `${t.reqMakingAvg.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='요청 생성 합계'
                        value={t.reqMakingSum !== null ? `${t.reqMakingSum.toFixed(3)}s` : '-'}
                      />
                    </div>
                  </div>

                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>응답 타이밍</div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <LV
                        label='첫 응답 시각 평균'
                        value={t.resInit !== null ? `${t.resInit.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='첫 응답까지 지연'
                        value={t.resInitGap !== null ? `${t.resInitGap.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='앱 처리 완료 시각'
                        value={t.resApp !== null ? `${t.resApp.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='앱 처리 지연'
                        value={t.resAppGap !== null ? `${t.resAppGap.toFixed(3)}s` : '-'}
                      />
                    </div>
                  </div>

                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>전송 구간</div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      <LV
                        label='요청 전송 시간'
                        value={t.transferReq !== null ? `${t.transferReq.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='요청 전송 구간 지연'
                        value={t.transferReqGap !== null ? `${t.transferReqGap.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='응답 전송 시간'
                        value={t.transferRes !== null ? `${t.transferRes.toFixed(3)}s` : '-'}
                      />
                      <LV
                        label='응답 전송 구간 지연'
                        value={t.transferResGap !== null ? `${t.transferResGap.toFixed(3)}s` : '-'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transport' && (
                <div className='space-y-4'>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>
                      전송 품질 (카운트/비율)
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='재전송 (cnt)' value={(tr.retransCnt || 0).toLocaleString()} />
                        <LV label='재전송율' value={pct(retransRatePkts)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Out-of-Order (cnt)' value={(tr.oooCnt || 0).toLocaleString()} />
                        <LV label='OOO율' value={pct(oooRatePkts)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='손실 (cnt)' value={(tr.lossCnt || 0).toLocaleString()} />
                        <LV label='손실율' value={pct(lossRatePkts)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='체크섬 오류 (cnt)' value={(tr.csumCnt || 0).toLocaleString()} />
                        <LV label='체크섬 오류율' value={pct(csumRatePkts)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='Dup ACK (cnt)' value={(tr.dupAckCnt || 0).toLocaleString()} />
                        <LV label='Dup ACK율' value={pct(tr.dupAckRate)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV
                          label='Window Update (cnt)'
                          value={(tr.winUpdateCnt || 0).toLocaleString()}
                        />
                        <LV label='WinUpdate율' value={pct(tr.winUpdateRate)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV
                          label='Zero Window (cnt)'
                          value={(tr.zeroWinCnt || 0).toLocaleString()}
                        />
                        <LV label='ZeroWin율' value={pct(tr.zeroWinRate)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV
                          label='Window Full (cnt)'
                          value={(tr.windowFullCnt || 0).toLocaleString()}
                        />
                        <LV label='WinFull율' value={pct(tr.windowFullRate)} />
                      </div>
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <LV label='ACK 손실 (cnt)' value={(tr.ackLostCnt || 0).toLocaleString()} />
                        <LV label='ACK 손실율' value={pct(tr.ackLostRate)} />
                      </div>
                    </div>
                  </div>

                  {Object.keys(qCounts).length > 0 && (
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-2 text-sm font-semibold text-gray-800'>
                        원시 카운트 (qualityCounts)
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

              {activeTab === 'http' && (
                <div className='space-y-4'>
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>상태 코드 분포</div>
                    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm'>
                      <LV label='1xx' value={h.code1xx || 0} />
                      <LV label='2xx' value={h.code2xx || 0} />
                      <LV label='3xx' value={h.code3xx || 0} />
                      <LV label='304' value={h.code304 || 0} />
                      <LV label='4xx' value={h.code4xx || 0} />
                      <LV label='5xx' value={h.code5xx || 0} />
                    </div>
                  </div>

                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>HTTP 메서드 분포</div>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                      <LV label='GET' value={h.methodGetCnt || 0} />
                      <LV label='POST' value={h.methodPostCnt || 0} />
                      <LV label='PUT' value={h.methodPutCnt || 0} />
                      <LV label='DELETE' value={h.methodDeleteCnt || 0} />
                      <LV label='HEAD' value={h.methodHeadCnt || 0} />
                      <LV label='OPTIONS' value={h.methodOptionsCnt || 0} />
                      <LV label='PATCH' value={h.methodPatchCnt || 0} />
                      <LV label='TRACE' value={h.methodTraceCnt || 0} />
                      <LV label='CONNECT' value={h.methodConnectCnt || 0} />
                      <LV label='OTHER' value={h.methodOthCnt || 0} />
                    </div>
                  </div>

                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>
                      HTTP 버전 / 컨텐츠 타입
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3'>
                      <LV label='HTTP Version' value={h.httpVersion || '-'} />
                      <LV label='Req Version' value={h.httpVersionReq || '-'} />
                      <LV label='Res Version' value={h.httpVersionRes || '-'} />
                    </div>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                      <LV
                        label='HTML (req / res)'
                        value={`${h.contentHtmlReq || 0} / ${h.contentHtmlRes || 0}`}
                      />
                      <LV
                        label='CSS (req / res)'
                        value={`${h.contentCssReq || 0} / ${h.contentCssRes || 0}`}
                      />
                      <LV
                        label='JS (req / res)'
                        value={`${h.contentJsReq || 0} / ${h.contentJsRes || 0}`}
                      />
                      <LV
                        label='IMG (req / res)'
                        value={`${h.contentImgReq || 0} / ${h.contentImgRes || 0}`}
                      />
                      <LV
                        label='기타 (req / res)'
                        value={`${h.contentOthReq || 0} / ${h.contentOthRes || 0}`}
                      />
                    </div>
                  </div>

                  {/* 요청 / 응답 메타 & 크기 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>
                      요청 / 응답 메타 & 크기
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                      <LV label='Referer' value={h.referer || '-'} />
                      <LV label='Cookie' value={h.cookie || '-'} />
                      <LV label='User-Agent' value={h.userAgent || '-'} />
                      <LV label='대표 Content-Type' value={h.contentType || '-'} />
                    </div>
                    <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                      <LV label='요청 헤더 크기' value={prettyBytes(h.headerBytesReq || 0)} />
                      <LV label='응답 헤더 크기' value={prettyBytes(h.headerBytesRes || 0)} />
                      <LV label='요청 바디 크기' value={prettyBytes(h.bodyBytesReq || 0)} />
                      <LV label='응답 바디 크기' value={prettyBytes(h.bodyBytesRes || 0)} />
                      <LV
                        label='요청 Content-Length'
                        value={h.contentLengthReq !== null ? prettyBytes(h.contentLengthReq) : '-'}
                      />
                      <LV
                        label='응답 Content-Length'
                        value={h.contentLengthRes !== null ? prettyBytes(h.contentLengthRes) : '-'}
                      />
                      <LV label='요청 페이로드 총 길이' value={prettyBytes(h.pktLenReq || 0)} />
                      <LV label='응답 페이로드 총 길이' value={prettyBytes(h.pktLenRes || 0)} />
                    </div>
                  </div>

                  {/* 환경 정보 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-2 text-sm font-semibold text-gray-800'>환경 정보</div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                      <LV label='요청 국가' value={e.countryReq || '-'} />
                      <LV label='응답 국가' value={e.countryRes || '-'} />
                      <LV label='요청 대륙' value={e.continentReq || '-'} />
                      <LV label='응답 대륙' value={e.continentRes || '-'} />
                      <LV label='OS' value={e.os || '-'} />
                      <LV label='브라우저' value={e.browser || '-'} />
                      <LV label='디바이스' value={e.deviceType || '-'} />
                      <LV label='렌더링 엔진' value={e.layoutEngine || '-'} />
                    </div>
                  </div>
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

export default HttpPageRowPreviewModal
