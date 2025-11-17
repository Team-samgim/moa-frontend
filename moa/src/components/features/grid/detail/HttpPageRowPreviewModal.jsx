import { memo, useEffect, useRef, useState } from 'react'
import EnhancedGeoMap from '@/components/features/grid/detail/EnhancedGeoMap'
import EnhancedTimelineChart from '@/components/features/grid/detail/EnhancedTimelineChart'
import TcpQualityGauge from '@/components/features/grid/detail/TcpQualityGauge'
import useHttpPageMetrics from '@/hooks/detail/useHttpPageMetrics'
import { emptyValue, formatMs, formatTimestamp } from '@/utils/httpPageFormat'

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

const prettyBytes = (n = 0) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

const Chip = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-[#F5F5F7] text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

const LV = ({ label, value, showEmpty = true }) => {
  const displayValue = emptyValue(value, showEmpty ? '값 없음' : '')
  const isEmpty = displayValue === '값 없음' || displayValue === ''

  return (
    <div className='text-sm'>
      <span className='text-gray-500'>{label}</span>
      <span className={`ml-2 font-medium break-all ${isEmpty ? 'text-gray-400 italic' : ''}`}>
        {displayValue}
      </span>
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className='flex items-center justify-between py-1'>
    <span className='text-gray-500 text-sm'>{label}</span>
    <span className='text-sm font-medium'>{emptyValue(String(value))}</span>
  </div>
)

const TabButton = ({ id, activeId, onClick, children }) => {
  const active = id === activeId

  return (
    <button
      type='button'
      onClick={() => onClick(id)}
      className={[
        'px-3 py-2 text-xs md:text-sm border-b-2 -mb-px whitespace-nowrap',
        active
          ? 'border-blue-500 text-blue-600 font-semibold'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ===== Main Modal Component =====
const HttpPageRowPreviewModal = memo(function HttpPageRowPreviewModal({ open, onClose, rowKey }) {
  const q = useHttpPageMetrics(rowKey)
  const [activeTab, setActiveTab] = useState('summary')

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

  // 닫기 버튼 포커스 이동
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
    }
    setMounted(false)
  }, [open])

  // 탭 리셋
  useEffect(() => {
    if (!open) setActiveTab('summary')
  }, [open])

  if (!open) return null

  const d = q.data || {}

  // 문자열 httpResCode → 숫자 httpStatus (정규화 실패 시 null)
  const httpStatus =
    d.httpStatus !== null && Number.isFinite(Number(d.httpStatus))
      ? Number(d.httpStatus)
      : d.httpResCode !== null && Number.isFinite(Number(d.httpResCode))
        ? Number(d.httpResCode)
        : null

  const hasEnv =
    d.env &&
    (d.env.countryReq || d.env.countryRes || d.env.domesticPrimaryReq || d.env.domesticPrimaryRes)

  // TCP 품질 점수 / 에러율 계산
  const tcpErrorRaw = d.tcpQuality?.tcpErrorPercentage ?? 0
  const tcpErrorPct = tcpErrorRaw <= 1 ? tcpErrorRaw * 100 : tcpErrorRaw
  const tcpQualityScore = Math.max(0, Math.min(100, 100 - tcpErrorPct))
  const tcpErrorDisplay = d.tcpQuality ? `${tcpErrorPct.toFixed(2)}%` : '값 없음'

  // 지연 요약 (정규화에서 계산된 delaySummary 사용)
  const delaySummary = d.delaySummary
  const dominantRatioPct =
    delaySummary && delaySummary.dominantRatio !== null
      ? (delaySummary.dominantRatio * 100).toFixed(1)
      : null

  return (
    <div className='fixed inset-0 z-[100]' aria-hidden={!open}>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' onClick={onClose} />

      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='http-page-dialog-title'
          className={[
            'w-full max-w-[1400px] max-h-[95vh] overflow-hidden rounded-2xl',
            'border bg-white shadow-2xl flex flex-col min-h-0',
            'transform transition duration-200 ease-out',
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          ].join(' ')}
        >
          {/* Header */}
          <div className='flex-none flex items-center justify-between border-b px-6 py-4'>
            <div className='flex items-center gap-4'>
              <div id='http-page-dialog-title' className='text-lg font-semibold'>
                HTTP Page 상세 분석
              </div>
              {d.httpResCode && (
                <Badge
                  level={
                    httpStatus >= 200 && httpStatus < 300
                      ? 'ok'
                      : httpStatus >= 400
                        ? 'crit'
                        : 'warn'
                  }
                >
                  HTTP {httpStatus}
                </Badge>
              )}
              {d.ndpiProtocolApp && <Chip color='purple'>{d.ndpiProtocolApp}</Chip>}
            </div>
            <button
              ref={closeBtnRef}
              className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
              onClick={onClose}
            >
              닫기
            </button>
          </div>

          {/* Tabs */}
          <div className='flex-none px-6 pt-3 border-b flex gap-2 overflow-x-auto'>
            <TabButton id='summary' activeId={activeTab} onClick={setActiveTab}>
              요약
            </TabButton>
            <TabButton id='timing' activeId={activeTab} onClick={setActiveTab}>
              ⏱️ 시간 분석
            </TabButton>
            <TabButton id='methods' activeId={activeTab} onClick={setActiveTab}>
              📊 HTTP 메소드
            </TabButton>
            <TabButton id='status' activeId={activeTab} onClick={setActiveTab}>
              🎯 응답 코드
            </TabButton>
            <TabButton id='quality' activeId={activeTab} onClick={setActiveTab}>
              📈 TCP 품질
            </TabButton>
            <TabButton id='performance' activeId={activeTab} onClick={setActiveTab}>
              ⚡ 성능
            </TabButton>
            {hasEnv && (
              <TabButton id='geo' activeId={activeTab} onClick={setActiveTab}>
                🌍 위치 정보
              </TabButton>
            )}
          </div>

          {/* Body */}
          <div className='p-6 space-y-5 overflow-auto flex-1 min-h-0'>
            {q.isLoading && <div className='text-sm text-gray-500'>불러오는 중…</div>}
            {q.isError && (
              <div className='text-sm text-red-600'>
                데이터를 불러오지 못했습니다. {q.error?.message || ''}
              </div>
            )}
            {q.isSuccess && !q.data && <div className='text-sm text-gray-500'>데이터 없음</div>}

            {q.isSuccess && q.data && (
              <>
                {/* === Tab: 요약 === */}
                {activeTab === 'summary' && (
                  <>
                    {/* 연결 정보 카드 */}
                    <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                      <div className='text-sm text-gray-600 mb-1'>네트워크 연결</div>
                      <div className='text-[15px] font-semibold'>
                        {emptyValue(d.srcIp)}:{emptyValue(d.srcPort)}{' '}
                        <span className='text-gray-400'>→</span> {emptyValue(d.dstIp)}:
                        {emptyValue(d.dstPort)}
                      </div>
                      {(d.srcMac || d.dstMac) && (
                        <div className='mt-1 text-xs text-gray-500'>
                          MAC: {emptyValue(d.srcMac)} → {emptyValue(d.dstMac)}
                        </div>
                      )}
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {d.httpMethod && <Chip color='blue'>Method: {d.httpMethod}</Chip>}
                        {d.httpHost && <Chip color='green'>Host: {d.httpHost}</Chip>}
                        {httpStatus !== null && (
                          <Chip
                            color={
                              httpStatus >= 200 && httpStatus < 300
                                ? 'green'
                                : httpStatus >= 400
                                  ? 'red'
                                  : 'amber'
                            }
                          >
                            <span className='inline-flex items-center gap-1.5'>
                              <span
                                className={[
                                  'inline-block w-2 h-2 rounded-full',
                                  httpStatus >= 200 && httpStatus < 300
                                    ? 'bg-green-500'
                                    : httpStatus >= 400
                                      ? 'bg-red-500'
                                      : 'bg-amber-500',
                                ].join(' ')}
                              />
                              Status: {httpStatus}
                            </span>
                          </Chip>
                        )}
                        {d.ndpiProtocolApp && <Chip color='purple'>App: {d.ndpiProtocolApp}</Chip>}
                        {d.ndpiProtocolMaster && (
                          <Chip color='purple'>Protocol: {d.ndpiProtocolMaster}</Chip>
                        )}
                        {d.isHttps && <Chip color='green'>🔒 HTTPS</Chip>}
                        {d.sensorDeviceName && <Chip>센서: {d.sensorDeviceName}</Chip>}
                        {d.userAgentInfo?.softwareName && (
                          <Chip color='gray'>브라우저: {d.userAgentInfo.softwareName}</Chip>
                        )}
                      </div>
                    </div>

                    {/* 핵심 지표 */}
                    <div className='grid grid-cols-2 md:grid-cols-5 gap-3 mt-4'>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>페이지 로딩</div>
                        <div className='text-lg font-bold text-blue-700'>
                          {formatMs((d.timing?.tsPage || 0) * 1000)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 데이터</div>
                        <div className='text-lg font-bold text-emerald-700'>
                          {prettyBytes(d.traffic?.pageHttpLen || 0)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>URI 수</div>
                        <div className='text-lg font-bold text-purple-700'>
                          {(d.uriCnt || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>세션 수</div>
                        <div className='text-lg font-bold text-amber-700'>
                          {(d.pageSessionCnt || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-rose-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>TCP 품질</div>
                        <div className='text-lg font-bold text-rose-700'>
                          {Number.isFinite(tcpQualityScore)
                            ? `${tcpQualityScore.toFixed(0)}%`
                            : '-'}
                        </div>
                      </div>
                    </div>

                    {/* HTTP 요청/응답 정보 */}
                    {(d.httpMethod || d.httpUri || d.httpContentType) && (
                      <div className='grid md:grid-cols-2 gap-4 mt-4'>
                        <div className='rounded-xl border bg-white p-4'>
                          <div className='mb-3 text-sm font-semibold text-gray-800'>
                            📤 요청 정보
                          </div>
                          <div className='space-y-2'>
                            <LV label='메소드' value={d.httpMethod} />
                            <LV label='URI' value={d.httpUri} />
                            <LV label='Host' value={d.httpHost} />
                            <LV label='Referer' value={d.httpReferer} />
                            <LV label='버전' value={d.httpVersion} />
                          </div>
                        </div>
                        <div className='rounded-xl border bg-white p-4'>
                          <div className='mb-3 text-sm font-semibold text-gray-800'>
                            📥 응답 정보
                          </div>
                          <div className='space-y-2'>
                            <LV label='응답 코드' value={d.httpResCode} />
                            <LV label='응답 구문' value={d.httpResPhrase} />
                            <LV label='Content-Type' value={d.httpContentType} />
                            <LV label='Location' value={d.httpLocation} />
                            <LV label='Cookie' value={d.httpCookie ? '있음' : '없음'} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 세션 & 연결 통계 */}
                    <div className='rounded-xl border bg-white p-4 mt-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        🔌 세션 & 연결 통계
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        <LV label='세션 수' value={(d.pageSessionCnt || 0).toLocaleString()} />
                        <LV label='TCP 연결' value={(d.pageTcpConnectCnt || 0).toLocaleString()} />
                        <LV label='URI 수' value={(d.uriCnt || 0).toLocaleString()} />
                        <LV label='HTTP URI' value={(d.httpUriCnt || 0).toLocaleString()} />
                        <LV label='HTTPS URI' value={(d.httpsUriCnt || 0).toLocaleString()} />
                        <LV label='에러 수' value={(d.pageErrorCnt || 0).toLocaleString()} />
                        <LV label='패킷 수' value={(d.traffic?.pagePktCnt || 0).toLocaleString()} />
                        <LV
                          label='HTTP 요청'
                          value={(d.traffic?.pageHttpCntReq || 0).toLocaleString()}
                        />
                      </div>
                    </div>

                    {/* 타임스탬프 정보 */}
                    {d.tsServer && (
                      <div className='rounded-xl border bg-gray-50 p-4'>
                        <div className='mb-2 text-sm font-semibold text-gray-800'>⏰ 캡처 시간</div>
                        <div className='text-sm text-gray-600'>
                          {d.tsServer}
                          {d.timing?.tsFirst && (
                            <span className='ml-2 text-xs text-gray-500'>
                              (첫 패킷: {formatTimestamp(d.timing.tsFirst)})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: 시간 분석 === */}
                {activeTab === 'timing' && d.timing && (
                  <>
                    {/* ⏱️ 지연 요약 카드 (URI 모달 느낌) */}
                    {delaySummary && (
                      <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4'>
                        <div className='flex items-center justify-between mb-2'>
                          <div className='text-sm font-semibold text-amber-900'>⏱️ 지연 요약</div>
                          {dominantRatioPct && (
                            <span className='inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-white border border-amber-200 text-amber-800'>
                              주요 지연 구간: {delaySummary.dominantLabel} ({dominantRatioPct}%)
                            </span>
                          )}
                        </div>
                        <div className='text-xs text-amber-900'>
                          전체 페이지 시간{' '}
                          <span className='font-semibold'>
                            {formatMs((delaySummary.total || 0) * 1000)}
                          </span>
                          중{' '}
                          <span className='font-semibold'>
                            {delaySummary.dominantLabel}{' '}
                            {formatMs((delaySummary.dominantValue || 0) * 1000)}
                          </span>
                          {dominantRatioPct && <span> (약 {dominantRatioPct}%)</span>} 구간에서 가장
                          오래 걸렸습니다.
                        </div>
                        <div className='mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-amber-900'>
                          {delaySummary.segments?.map((seg) => (
                            <div
                              key={seg.key}
                              className='flex flex-col rounded-lg bg-white/80 border border-amber-100 px-2 py-1.5'
                            >
                              <span className='font-semibold'>{seg.label}</span>
                              <span className='mt-0.5'>
                                {formatMs((seg.value || 0) * 1000)}
                                {delaySummary.total
                                  ? ` (${((seg.value / delaySummary.total) * 100).toFixed(1)}%)`
                                  : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className='rounded-xl border bg-white p-4'>
                      <EnhancedTimelineChart timing={d.timing} delaySummary={delaySummary} />
                    </div>

                    {/* 주요 시간 메트릭 카드 */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>TCP 연결 평균</div>
                        <div className='text-lg font-bold text-purple-700'>
                          {formatMs((d.timing?.tsPageTcpConnectAvg || 0) * 1000)}
                        </div>
                        {d.timing?.tsPageTcpConnectMin && d.timing?.tsPageTcpConnectMax && (
                          <div className='text-xs text-gray-500 mt-1'>
                            {formatMs(d.timing.tsPageTcpConnectMin * 1000)} ~{' '}
                            {formatMs(d.timing.tsPageTcpConnectMax * 1000)}
                          </div>
                        )}
                      </div>

                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>요청 전송</div>
                        <div className='text-lg font-bold text-emerald-700'>
                          {formatMs((d.timing?.tsPageTransferReq || 0) * 1000)}
                        </div>
                        {d.timing?.tsPageTransferReqGap > 0 && (
                          <div className='text-xs text-red-500 mt-1'>
                            갭: {formatMs(d.timing.tsPageTransferReqGap * 1000)}
                          </div>
                        )}
                      </div>

                      <div className='rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>TTFB (서버 처리)</div>
                        <div className='text-lg font-bold text-amber-700'>
                          {formatMs((d.timing?.tsPageResInit || 0) * 1000)}
                        </div>
                        {d.timing?.tsPageResInitGap > 0 && (
                          <div className='text-xs text-red-500 mt-1'>
                            갭: {formatMs(d.timing.tsPageResInitGap * 1000)}
                          </div>
                        )}
                      </div>

                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>응답 전송</div>
                        <div className='text-lg font-bold text-blue-700'>
                          {formatMs((d.timing?.tsPageTransferRes || 0) * 1000)}
                        </div>
                        {d.timing?.tsPageTransferResGap > 0 && (
                          <div className='text-xs text-red-500 mt-1'>
                            갭: {formatMs(d.timing.tsPageTransferResGap * 1000)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gap 분석 */}
                    {(d.timing?.tsPageGap > 0 ||
                      d.timing?.tsPageResInitGap > 0 ||
                      d.timing?.tsPageResAppGap > 0 ||
                      d.timing?.tsPageResGap > 0 ||
                      d.timing?.tsPageTransferReqGap > 0 ||
                      d.timing?.tsPageTransferResGap > 0) && (
                      <div className='rounded-xl border border-red-200 bg-red-50 p-4'>
                        <div className='mb-3 text-sm font-semibold text-red-800'>
                          ⚠️ 지연 구간 감지
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          {d.timing.tsPageGap > 0 && (
                            <LV label='페이지 갭' value={formatMs(d.timing.tsPageGap * 1000)} />
                          )}
                          {d.timing.tsPageResInitGap > 0 && (
                            <LV
                              label='응답 초기화 갭'
                              value={formatMs(d.timing.tsPageResInitGap * 1000)}
                            />
                          )}
                          {d.timing.tsPageResAppGap > 0 && (
                            <LV
                              label='앱 응답 갭'
                              value={formatMs(d.timing.tsPageResAppGap * 1000)}
                            />
                          )}
                          {d.timing.tsPageResGap > 0 && (
                            <LV label='응답 갭' value={formatMs(d.timing.tsPageResGap * 1000)} />
                          )}
                          {d.timing.tsPageTransferReqGap > 0 && (
                            <LV
                              label='요청 전송 갭'
                              value={formatMs(d.timing.tsPageTransferReqGap * 1000)}
                            />
                          )}
                          {d.timing.tsPageTransferResGap > 0 && (
                            <LV
                              label='응답 전송 갭'
                              value={formatMs(d.timing.tsPageTransferResGap * 1000)}
                            />
                          )}
                        </div>
                        <div className='mt-3 text-xs text-red-600'>
                          * 갭(Gap)은 예상 시간보다 추가로 소요된 지연 시간을 의미합니다.
                        </div>
                      </div>
                    )}

                    {/* 타임스탬프 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        🕐 타임스탬프 상세
                      </div>
                      <div className='grid md:grid-cols-2 gap-3 text-sm'>
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>시작 타임스탬프</div>
                          <LV
                            label='첫 패킷'
                            value={
                              d.timing?.tsFirst ? formatTimestamp(d.timing.tsFirst) : '값 없음'
                            }
                          />
                          <LV
                            label='페이지 시작'
                            value={
                              d.timing?.tsPageBegin
                                ? formatTimestamp(d.timing.tsPageBegin)
                                : '값 없음'
                            }
                          />
                          <LV
                            label='SYN 패킷'
                            value={
                              d.timing?.tsPageReqSyn
                                ? formatTimestamp(d.timing.tsPageReqSyn)
                                : '값 없음'
                            }
                          />
                        </div>
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>종료 타임스탬프</div>
                          <LV
                            label='페이지 종료'
                            value={
                              d.timing?.tsPageEnd ? formatTimestamp(d.timing.tsPageEnd) : '값 없음'
                            }
                          />
                          <LV
                            label='응답 초기화'
                            value={
                              d.timing?.tsPageResInit
                                ? formatTimestamp(d.timing.tsPageResInit)
                                : '값 없음'
                            }
                          />
                          <LV
                            label='앱 응답'
                            value={
                              d.timing?.tsPageResApp
                                ? formatTimestamp(d.timing.tsPageResApp)
                                : '값 없음'
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* TCP 연결 시간 통계 */}
                    {(d.timing?.tsPageTcpConnectSum > 0 || d.timing?.tsPageTcpConnectAvg > 0) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🔌 TCP 연결 시간 통계
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                          <LV
                            label='합계'
                            value={formatMs((d.timing.tsPageTcpConnectSum || 0) * 1000)}
                          />
                          <LV
                            label='평균'
                            value={formatMs((d.timing.tsPageTcpConnectAvg || 0) * 1000)}
                          />
                          <LV
                            label='최소'
                            value={formatMs((d.timing.tsPageTcpConnectMin || 0) * 1000)}
                          />
                          <LV
                            label='최대'
                            value={formatMs((d.timing.tsPageTcpConnectMax || 0) * 1000)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 요청 생성 시간 */}
                    {(d.timing?.tsPageReqMakingSum > 0 || d.timing?.tsPageReqMakingAvg > 0) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📝 요청 생성 시간
                        </div>
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <LV
                            label='합계'
                            value={formatMs((d.timing.tsPageReqMakingSum || 0) * 1000)}
                          />
                          <LV
                            label='평균'
                            value={formatMs((d.timing.tsPageReqMakingAvg || 0) * 1000)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: HTTP 메소드 === */}
                {activeTab === 'methods' && (
                  <>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📊 HTTP 메소드 통계
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <Row label='GET' value={d.methods?.getCnt || 0} />
                        <Row label='POST' value={d.methods?.postCnt || 0} />
                        <Row label='PUT' value={d.methods?.putCnt || 0} />
                        <Row label='DELETE' value={d.methods?.deleteCnt || 0} />
                        <Row label='HEAD' value={d.methods?.headCnt || 0} />
                        <Row label='OPTIONS' value={d.methods?.optionsCnt || 0} />
                        <Row label='PATCH' value={d.methods?.patchCnt || 0} />
                        <Row label='TRACE' value={d.methods?.traceCnt || 0} />
                        <Row label='CONNECT' value={d.methods?.connectCnt || 0} />
                        <Row label='기타' value={d.methods?.othCnt || 0} />
                      </div>
                    </div>

                    {d.methods?.hasErrors && (
                      <div className='rounded-xl border border-red-200 bg-red-50 p-4'>
                        <div className='mb-3 text-sm font-semibold text-red-800'>
                          ⚠️ 메소드별 에러
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          {d.methods.getCntError > 0 && (
                            <Row label='GET 에러' value={d.methods.getCntError} />
                          )}
                          {d.methods.postCntError > 0 && (
                            <Row label='POST 에러' value={d.methods.postCntError} />
                          )}
                          {d.methods.putCntError > 0 && (
                            <Row label='PUT 에러' value={d.methods.putCntError} />
                          )}
                          {d.methods.deleteCntError > 0 && (
                            <Row label='DELETE 에러' value={d.methods.deleteCntError} />
                          )}
                          {d.methods.headCntError > 0 && (
                            <Row label='HEAD 에러' value={d.methods.headCntError} />
                          )}
                          {d.methods.optionsCntError > 0 && (
                            <Row label='OPTIONS 에러' value={d.methods.optionsCntError} />
                          )}
                          {d.methods.patchCntError > 0 && (
                            <Row label='PATCH 에러' value={d.methods.patchCntError} />
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: 응답 코드 === */}
                {activeTab === 'status' && (
                  <div className='space-y-6'>
                    {/* 현재 요청의 응답 코드 */}
                    <div className='rounded-xl border bg-white p-6'>
                      <div className='mb-4 text-sm font-semibold text-gray-800'>
                        📊 현재 HTTP 응답 코드
                      </div>
                      <div className='flex items-center justify-center py-8'>
                        <div className='text-center'>
                          <div
                            className={[
                              'inline-flex items-center justify-center w-32 h-32 rounded-full text-5xl font-bold',
                              httpStatus !== null && httpStatus >= 200 && httpStatus < 300
                                ? 'bg-green-100 text-green-700'
                                : httpStatus !== null && httpStatus >= 400 && httpStatus < 500
                                  ? 'bg-amber-100 text-amber-700'
                                  : httpStatus !== null && httpStatus >= 500
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700',
                            ].join(' ')}
                          >
                            {httpStatus ?? d.httpResCode ?? '?'}
                          </div>
                          <div className='mt-4 text-lg font-medium text-gray-700'>
                            {d.httpResPhrase || '상태 알 수 없음'}
                          </div>
                          <div className='mt-2 text-sm text-gray-500'>
                            {httpStatus !== null && httpStatus >= 200 && httpStatus < 300 && '성공'}
                            {httpStatus !== null &&
                              httpStatus >= 300 &&
                              httpStatus < 400 &&
                              '리다이렉트'}
                            {httpStatus !== null &&
                              httpStatus >= 400 &&
                              httpStatus < 500 &&
                              '클라이언트 에러'}
                            {httpStatus !== null && httpStatus >= 500 && '서버 에러'}
                            {httpStatus === null && !d.httpResCode && '응답 코드 정보 없음'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 코드 구간별 설명 가이드 */}
                    <div className='rounded-xl border bg-gray-50 p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        🧭 HTTP 상태 코드 가이드
                      </div>
                      <div className='grid md:grid-cols-2 gap-3'>
                        <div className='mt-2 p-4 bg-gray-50 rounded-lg text-xs text-gray-600'>
                          <strong>응답 코드 범주:</strong>
                          <ul className='mt-2 space-y-1 ml-4 list-disc'>
                            <li>1xx: 정보성 응답</li>
                            <li>2xx: 성공 (200 OK, 201 Created, 204 No Content 등)</li>
                            <li>3xx: 리다이렉션 (301 Moved, 302 Found, 304 Not Modified 등)</li>
                            <li>4xx: 클라이언트 에러 (400 Bad Request, 404 Not Found 등)</li>
                            <li>5xx: 서버 에러 (500 Internal Server Error, 503 Unavailable 등)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* === Tab: TCP 품질 === */}
                {activeTab === 'quality' && (
                  <div className='space-y-4'>
                    <div className='rounded-xl border bg-white p-4'>
                      {d.tcpQuality ? (
                        <TcpQualityGauge tcpQuality={d.tcpQuality} />
                      ) : (
                        <div className='text-sm text-gray-500 text-center py-8'>
                          TCP 품질 데이터가 없습니다.
                        </div>
                      )}
                    </div>

                    {d.tcpQuality && (
                      <div className='rounded-xl border bg-gray-50 p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🔍 TCP 품질 상세
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          <LV label='에러율' value={tcpErrorDisplay} />
                          <LV
                            label='총 세션 수'
                            value={d.tcpQuality.tcpSessionCnt?.toLocaleString() ?? '값 없음'}
                          />
                          <LV
                            label='에러 세션 수'
                            value={d.tcpQuality.tcpErrorSessionCnt?.toLocaleString() ?? '값 없음'}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* === Tab: 성능 === */}
                {activeTab === 'performance' && (
                  <>
                    {/* 대역폭 & 패킷 속도 */}
                    <div className='grid md:grid-cols-2 gap-4'>
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📊 대역폭 (Mbps)
                        </div>
                        <div className='grid grid-cols-3 gap-3 mb-4'>
                          <div className='bg-blue-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-500'>평균</div>
                            <div className='text-lg font-bold text-blue-700'>
                              {(d.performance?.mbps || 0).toFixed(3)}
                            </div>
                          </div>
                          <div className='bg-green-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-500'>최소</div>
                            <div className='text-lg font-bold text-green-700'>
                              {(d.performance?.mbpsMin || 0).toFixed(3)}
                            </div>
                          </div>
                          <div className='bg-purple-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-500'>최대</div>
                            <div className='text-lg font-bold text-purple-700'>
                              {(d.performance?.mbpsMax || 0).toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📦 패킷 속도 (PPS)
                        </div>
                        <div className='grid grid-cols-3 gap-3 mb-4'>
                          <div className='bg-blue-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-500'>평균</div>
                            <div className='text-lg font-bold text-blue-700'>
                              {(d.performance?.pps || 0).toFixed(1)}
                            </div>
                          </div>
                          <div className='bg-green-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-500'>최소</div>
                            <div className='text-lg font-bold text-green-700'>
                              {(d.performance?.ppsMin || 0).toFixed(1)}
                            </div>
                          </div>
                          <div className='bg-purple-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-500'>최대</div>
                            <div className='text-lg font-bold text-purple-700'>
                              {(d.performance?.ppsMax || 0).toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 트래픽 상세 통계 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📈 트래픽 상세 통계
                      </div>
                      <div className='grid grid-cols-3 gap-4'>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>전체</div>
                          <div className='space-y-2 text-sm'>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>HTTP</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pageHttpLen || 0)}
                                </span>
                              </div>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pagePktLen || 0)}
                                </span>
                              </div>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>TCP</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pageTcpLen || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>요청</div>
                          <div className='space-y-2 text-sm'>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>HTTP</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pageHttpLenReq || 0)}
                                </span>
                              </div>
                            </div>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pagePktLenReq || 0)}
                                </span>
                              </div>
                            </div>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>TCP</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pageTcpLenReq || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>응답</div>
                          <div className='space-y-2 text-sm'>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>HTTP</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pageHttpLenRes || 0)}
                                </span>
                              </div>
                            </div>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pagePktLenRes || 0)}
                                </span>
                              </div>
                            </div>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>TCP</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pageTcpLenRes || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* === Tab: 위치 정보 === */}
                {activeTab === 'geo' && hasEnv && (
                  <>
                    <div className='rounded-xl border bg-white p-4'>
                      <EnhancedGeoMap
                        countryReq={d.env?.countryReq}
                        countryRes={d.env?.countryRes}
                        srcIp={d.srcIp}
                        dstIp={d.dstIp}
                        env={d.env}
                      />
                    </div>

                    <div className='grid md:grid-cols-2 gap-4'>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📍 출발지 (요청)
                        </div>
                        <div className='space-y-2 text-sm'>
                          <LV label='IP 주소' value={d.srcIp} />
                          <LV label='포트' value={d.srcPort} />
                          <LV label='MAC 주소' value={d.srcMac} />
                          <div className='pt-2 border-t'>
                            <LV label='국가' value={d.env?.countryReq} />
                            <LV label='대륙' value={d.env?.continentReq} />
                            <LV label='시/도' value={d.env?.domesticPrimaryReq} />
                            <LV label='시/군/구' value={d.env?.domesticSub1Req} />
                            <LV label='읍/면/동' value={d.env?.domesticSub2Req} />
                          </div>
                        </div>
                      </div>

                      <div className='rounded-xl border bg-gradient-to-br from-red-50 to-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📍 목적지 (응답)
                        </div>
                        <div className='space-y-2 text-sm'>
                          <LV label='IP 주소' value={d.dstIp} />
                          <LV label='포트' value={d.dstPort} />
                          <LV label='MAC 주소' value={d.dstMac} />
                          <div className='pt-2 border-t'>
                            <LV label='국가' value={d.env?.countryRes} />
                            <LV label='대륙' value={d.env?.continentRes} />
                            <LV label='시/도' value={d.env?.domesticPrimaryRes} />
                            <LV label='시/군/구' value={d.env?.domesticSub1Res} />
                            <LV label='읍/면/동' value={d.env?.domesticSub2Res} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className='text-xs text-gray-400 pt-4 border-t flex justify-between items-center'>
                  <span className='font-mono'>rowKey: {emptyValue(d.rowKey)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default HttpPageRowPreviewModal
