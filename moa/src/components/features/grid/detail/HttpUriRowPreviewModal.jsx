/**
 * HttpUriRowPreviewModal
 *
 * HTTP URI 단건 상세 분석 모달 컴포넌트.
 * rowKey를 기반으로 HTTP 요청/응답, 타이밍, 트래픽, TCP 품질, 위치 정보 등을
 * 탭 구조로 분리하여 시각적으로 분석할 수 있도록 구성한다.
 *
 * 주요 기능:
 * 1) 요약(Summary)
 *    - IP/Port/MAC, Host, Method, Status 등 핵심 정보 표시
 *    - 응답 시간, 트래픽 크기, 패킷 수, Mbps, TCP 품질 등의 주요 지표 제공
 *    - 네트워크 지연(reqDelayTransfer, resDelayTransfer) 여부 판단
 *
 * 2) 시간 분석(Timing)
 *    - EnhancedUriTimelineChart를 이용한 전체 워터폴 타임라인 시각화
 *    - 요청/서버 처리/응답 전송 단계별 시간 분석
 *    - 타임스탬프 상세(tsFirst, reqPktFirst/Last, resPktFirst/Last)
 *    - 응답 처리 시간(resProcessFirst, resProcessPush) 표시
 *
 * 3) HTTP 요청(Request)
 *    - 요청 메소드, URI, 버전, Host, Referer 등 메타데이터
 *    - User-Agent 및 브라우저/OS/엔진/디바이스 정보 분석
 *    - 요청 트래픽(헤더/본문/총 크기, 패킷 수, 요청 횟수)
 *
 * 4) HTTP 응답(Response)
 *    - HTTP 상태 코드 및 상태 구문
 *    - Content-Type, Location 등 응답 메타데이터
 *    - 응답 트래픽(헤더/본문/총 크기, 패킷 수, 응답 횟수)
 *
 * 5) 성능 / TCP 품질(Performance)
 *    - RTT(Round Trip Time), RTO(Retransmission Timeout)
 *    - 재전송, 패킷 손실, 순서 오류 등 TCP 에러 분석
 *    - Mbps, PPS 관련 대역폭 및 패킷 속도 메트릭
 *    - 요청/응답/전체 트래픽 상세 통계
 *
 * 6) 위치 정보(Geo)
 *    - EnhancedGeoMap을 이용한 요청/응답 IP 기반 지리 정보 시각화
 *    - 국가, 대륙, 국내 행정단계(Primary/Sub1/Sub2) 표시
 *
 * UI 특징:
 * - ESC 닫기, 포커스 이동, 모달 진입 애니메이션 적용
 * - Body 스크롤 잠금 처리
 * - Chip/Badge/LV 등 공통 컴포넌트를 이용한 일관된 UI
 * - 데이터 존재 여부를 검증하며 안전한 렌더링 처리
 *
 * props:
 * - open (boolean): 모달 표시 여부
 * - onClose (function): 모달 닫기 핸들러
 * - rowKey (string): 상세 데이터를 조회하기 위한 식별값
 *
 * AUTHOR : 방대혁
 */

import { memo, useEffect, useRef, useState } from 'react'
import EnhancedGeoMap from '@/components/features/grid/detail/EnhancedGeoMap'
import EnhancedUriTimelineChart from '@/components/features/grid/detail/EnhancedUriTimelineChart'
import useHttpUriMetrics from '@/hooks/detail/useHttpUriMetrics'
import { emptyValue, formatMs, formatTimestamp } from '@/utils/httpPageFormat'

const prettyBytes = (n = 0) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

// ===== 공통 UI 컴포넌트들 =====
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
const HttpUriRowPreviewModal = memo(function HttpUriRowPreviewModal({ open, onClose, rowKey }) {
  const q = useHttpUriMetrics(rowKey)
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

  // 포커스 이동
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

  // 탭 초기화
  useEffect(() => {
    if (!open) setActiveTab('summary')
  }, [open])

  if (!open) return null

  const d = q.data || {}

  const hasEnv =
    d.env &&
    (d.env.countryReq || d.env.countryRes || d.env.domesticPrimaryReq || d.env.domesticPrimaryRes)

  // TCP 품질 점수 계산
  const tcpQualityScore = d.tcpQuality?.quality?.score ?? 0

  // RTT / RTO 값 존재 여부
  const hasRttRaw = d.tcpQuality?.ackRttCntReq ?? d.tcpQuality?.ackRttCntRes

  const hasRtoRaw =
    d.tcpQuality?.ackRtoTotal ?? d.tcpQuality?.ackRtoCntReq ?? d.tcpQuality?.ackRtoCntRes

  const hasRtt = hasRttRaw !== null
  const hasRto = hasRtoRaw !== null

  // 지연 여부 확인
  const hasDelay = (d.timing?.reqDelayTransfer || 0) > 0 || (d.timing?.resDelayTransfer || 0) > 0

  // 응답 처리 시간 존재 여부 (0이어도 필드만 있으면 true)
  const hasResProcess =
    d.timing && (d.timing.resProcessFirst !== null || d.timing.resProcessPush !== null)

  return (
    <div className='fixed inset-0 z-[100]' aria-hidden={!open}>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' onClick={onClose} />

      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='http-uri-dialog-title'
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
              <div id='http-uri-dialog-title' className='text-lg font-semibold'>
                HTTP URI 상세 분석
              </div>
              {d.response?.phrase && (
                <Badge
                  level={
                    d.response.phrase === 'OK' || d.response.phrase.startsWith?.('2')
                      ? 'ok'
                      : d.response.phrase.startsWith?.('5')
                        ? 'crit'
                        : 'warn'
                  }
                >
                  HTTP {d.response.phrase}
                </Badge>
              )}
              {hasDelay && <Badge level='warn'>⚠️ 네트워크 지연 감지</Badge>}
              {d.env?.ndpiProtocolApp && <Chip color='purple'>{d.env.ndpiProtocolApp}</Chip>}
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
              {hasDelay ? '⚠️ ' : '⏱️ '}시간 분석
            </TabButton>
            <TabButton id='request' activeId={activeTab} onClick={setActiveTab}>
              📤 HTTP 요청
            </TabButton>
            <TabButton id='response' activeId={activeTab} onClick={setActiveTab}>
              📥 HTTP 응답
            </TabButton>
            <TabButton id='performance' activeId={activeTab} onClick={setActiveTab}>
              ⚡ 성능 / TCP 품질
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
                        {d.request?.method && <Chip color='blue'>Method: {d.request.method}</Chip>}
                        {d.request?.host && <Chip color='green'>Host: {d.request.host}</Chip>}
                        {d.response?.phrase && (
                          <Chip
                            color={
                              d.response.phrase === 'OK' || d.response.phrase.startsWith?.('2')
                                ? 'green'
                                : d.response.phrase.startsWith?.('5')
                                  ? 'red'
                                  : 'amber'
                            }
                          >
                            <span className='inline-flex items-center gap-1.5'>
                              <span
                                className={[
                                  'inline-block w-2 h-2 rounded-full',
                                  d.response.phrase === 'OK' || d.response.phrase.startsWith?.('2')
                                    ? 'bg-green-500'
                                    : d.response.phrase.startsWith?.('5')
                                      ? 'bg-red-500'
                                      : 'bg-amber-500',
                                ].join(' ')}
                              />
                              Status: {d.response.phrase}
                            </span>
                          </Chip>
                        )}
                        {hasDelay && <Chip color='red'>⚠️ 지연 발생</Chip>}
                        {d.env?.ndpiProtocolApp && (
                          <Chip color='purple'>App: {d.env.ndpiProtocolApp}</Chip>
                        )}
                        {d.env?.ndpiProtocolMaster && (
                          <Chip color='purple'>Protocol: {d.env.ndpiProtocolMaster}</Chip>
                        )}
                        {d.env?.isHttps && <Chip color='green'>🔒 HTTPS</Chip>}
                        {d.env?.sensorDeviceName && <Chip>센서: {d.env.sensorDeviceName}</Chip>}
                      </div>
                    </div>

                    {/* 핵심 지표 */}
                    <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>응답 시간</div>
                        <div className='text-lg font-bold text-blue-700'>
                          {formatMs(d.timing?.responseTime || 0)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 데이터</div>
                        <div className='text-lg font-bold text-emerald-700'>
                          {prettyBytes(d.traffic?.pktLen || 0)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 패킷</div>
                        <div className='text-lg font-bold text-purple-700'>
                          {(d.traffic?.pktCnt || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>평균 Mbps</div>
                        <div className='text-lg font-bold text-amber-700'>
                          {(d.performance?.mbps || 0).toFixed(2)}
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

                    {/* 네트워크 지연 경고 */}
                    {hasDelay && (
                      <div className='rounded-xl border p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='text-2xl'>⚠️</div>
                          <div className='flex-1'>
                            <div className='text-sm font-semibold'>
                              네트워크 지연이 감지되었습니다
                            </div>
                            <div className='grid grid-cols-2 gap-3 text-sm'>
                              {d.timing?.reqDelayTransfer > 0 && (
                                <div className='bg-white/60 p-2 rounded'>
                                  <div className='text-xs text-gray-600'>요청 전송 지연</div>
                                  <div className='font-bold text-gray-600'>
                                    {formatMs((d.timing.reqDelayTransfer || 0) * 1000)}
                                  </div>
                                </div>
                              )}
                              {d.timing?.resDelayTransfer > 0 && (
                                <div className='bg-white/60 p-2 rounded'>
                                  <div className='text-xs text-gray-600'>응답 전송 지연</div>
                                  <div className='font-bold text-gray-600'>
                                    {formatMs((d.timing.resDelayTransfer || 0) * 1000)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 진단 메시지 */}
                    {d.diagnostics && Object.keys(d.diagnostics).length > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🔍 진단 메시지
                        </div>
                        <ul className='space-y-2'>
                          {Object.entries(d.diagnostics).map(([k, msg]) => {
                            const [icon, ...rest] = String(msg).split(' ')
                            return (
                              <li
                                key={k}
                                className='flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm'
                              >
                                <span className='text-xl'>{icon}</span>
                                <span className='flex-1'>{rest.join(' ')}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* HTTP 요청/응답 정보 */}
                    <div className='grid md:grid-cols-2 gap-4'>
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>📤 요청 정보</div>
                        <div className='space-y-2'>
                          <LV label='메소드' value={d.request?.method} />
                          <LV label='URI' value={d.request?.uri} />
                          <LV label='Host' value={d.request?.host} />
                          <LV label='버전' value={d.request?.version} />
                          <LV label='Referer' value={d.request?.referer} />
                        </div>
                      </div>
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>📥 응답 정보</div>
                        <div className='space-y-2'>
                          <LV label='상태' value={d.response?.phrase} />
                          <LV label='버전' value={d.response?.version} />
                          <LV label='Content-Type' value={d.response?.contentType} />
                          <LV label='Location' value={d.response?.location} />
                          <LV label='연결 상태' value={d.status?.connectionStatus} />
                        </div>
                      </div>
                    </div>

                    {/* 통계 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📊 통신 통계</div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        <LV label='총 패킷' value={(d.traffic?.pktCnt || 0).toLocaleString()} />
                        <LV
                          label='요청 패킷'
                          value={(d.traffic?.pktCntReq || 0).toLocaleString()}
                        />
                        <LV
                          label='응답 패킷'
                          value={(d.traffic?.pktCntRes || 0).toLocaleString()}
                        />
                        <LV label='요청 횟수' value={(d.request?.reqCnt || 0).toLocaleString()} />
                        <LV label='응답 횟수' value={(d.response?.resCnt || 0).toLocaleString()} />
                        <LV label='총 데이터' value={prettyBytes(d.traffic?.pktLen || 0)} />
                        <LV label='요청 크기' value={prettyBytes(d.request?.totalLen || 0)} />
                        <LV label='응답 크기' value={prettyBytes(d.response?.totalLen || 0)} />
                      </div>
                    </div>

                    {/* 타임스탬프 */}
                    {d.timing && d.timing.tsFirst !== null && (
                      <div className='rounded-xl border bg-gray-50 p-4'>
                        <div className='mb-2 text-sm font-semibold text-gray-800'>⏰ 세션 시간</div>
                        <div className='text-sm text-gray-600'>
                          시작: {formatTimestamp(d.timing.tsFirst)}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: 시간 분석 === */}
                {activeTab === 'timing' && d.timing && (
                  <>
                    {/* 워터폴 타임라인 차트 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <EnhancedUriTimelineChart timing={d.timing} />
                    </div>

                    {/* 주요 시간 메트릭 */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>요청 전송</div>
                        <div className='text-lg font-bold text-emerald-700'>
                          {formatMs(
                            d.timing.reqPktLast && d.timing.reqPktFirst
                              ? (d.timing.reqPktLast - d.timing.reqPktFirst) * 1000
                              : 0,
                          )}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>TTFB (서버 처리)</div>
                        <div className='text-lg font-bold text-amber-700'>
                          {formatMs(d.timing.responseTime ?? 0)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>응답 전송</div>
                        <div className='text-lg font-bold text-blue-700'>
                          {formatMs(d.timing.transferTime ?? 0)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>전체 시간</div>
                        <div className='text-lg font-bold text-purple-700'>
                          {formatMs(d.timing.totalTime ?? 0)}
                        </div>
                      </div>
                    </div>

                    {/* 지연 시간 분석 - 강조 표시 */}
                    {hasDelay && (
                      <div className='grid md:grid-cols-2 gap-4 mb-4'>
                        {d.timing.reqDelayTransfer > 0 && (
                          <div className='bg-white rounded-lg p-4 border'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div>요청 전송 지연</div>
                            </div>
                            <div className='text-xl font-bold mb-1'>
                              {formatMs(d.timing.reqDelayTransfer * 1000)}
                            </div>
                            <div className='text-xs text-gray-600'>
                              클라이언트 → 서버 구간에서 발생한 추가 지연
                            </div>
                          </div>
                        )}
                        {d.timing.resDelayTransfer > 0 && (
                          <div className='bg-white rounded-lg p-4 border'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div>응답 전송 지연</div>
                            </div>
                            <div className='text-xl font-bold mb-1'>
                              {formatMs(d.timing.resDelayTransfer * 1000)}
                            </div>
                            <div className='text-xs text-gray-600'>
                              서버 → 클라이언트 구간에서 발생한 추가 지연
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 타임스탬프 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        🕐 타임스탬프 상세
                      </div>
                      <div className='grid md:grid-cols-2 gap-4 text-sm'>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>
                            요청 타임라인
                          </div>
                          <div className='space-y-2'>
                            <LV
                              label='세션 시작'
                              value={
                                d.timing?.tsFirst ? formatTimestamp(d.timing.tsFirst) : '값 없음'
                              }
                            />
                            <LV
                              label='요청 시작'
                              value={
                                d.timing?.reqPktFirst
                                  ? formatTimestamp(d.timing.reqPktFirst)
                                  : '값 없음'
                              }
                            />
                            <LV
                              label='요청 완료'
                              value={
                                d.timing?.reqPktLast
                                  ? formatTimestamp(d.timing.reqPktLast)
                                  : '값 없음'
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>
                            응답 타임라인
                          </div>
                          <div className='space-y-2'>
                            <LV
                              label='응답 시작'
                              value={
                                d.timing?.resPktFirst
                                  ? formatTimestamp(d.timing.resPktFirst)
                                  : '값 없음'
                              }
                            />
                            <LV
                              label='응답 완료'
                              value={
                                d.timing?.resPktLast
                                  ? formatTimestamp(d.timing.resPktLast)
                                  : '값 없음'
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 응답 처리 시간 */}
                    {hasResProcess && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          ⚡ 응답 처리 시간
                        </div>
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <LV
                            label='처리 시작'
                            value={formatMs((d.timing.resProcessFirst || 0) * 1000)}
                          />
                          <LV
                            label='처리 PUSH'
                            value={formatMs((d.timing.resProcessPush || 0) * 1000)}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: HTTP 요청 === */}
                {activeTab === 'request' && (
                  <>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📤 요청 정보</div>
                      <div className='space-y-2'>
                        <LV label='메소드' value={d.request?.method} />
                        <LV label='버전' value={d.request?.version} />
                        <LV label='URI' value={d.request?.uri} />
                        <LV label='Host' value={d.request?.host} />
                        {d.request?.referer && <LV label='Referer' value={d.request.referer} />}
                      </div>
                    </div>

                    {d.request?.userAgent && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🖥️ User Agent
                        </div>
                        <div className='mb-3 p-3 bg-gray-50 rounded-lg font-mono text-xs break-all'>
                          {d.request.userAgent}
                        </div>
                        {d.request.userAgentInfo?.softwareName && (
                          <div className='grid grid-cols-2 gap-3 text-sm'>
                            <LV label='브라우저' value={d.request.userAgentInfo.softwareName} />
                            <LV label='OS' value={d.request.userAgentInfo.osName} />
                            <LV label='플랫폼' value={d.request.userAgentInfo.osPlatform} />
                            <LV label='타입' value={d.request.userAgentInfo.softwareType} />
                            <LV label='하드웨어' value={d.request.userAgentInfo.hardwareType} />
                            <LV label='엔진' value={d.request.userAgentInfo.layoutEngineName} />
                          </div>
                        )}
                      </div>
                    )}

                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📊 요청 통계</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='헤더 크기' value={prettyBytes(d.request?.headerLen || 0)} />
                        <LV label='본문 크기' value={prettyBytes(d.request?.contentLen || 0)} />
                        <LV label='전체 크기' value={prettyBytes(d.request?.totalLen || 0)} />
                        <LV label='패킷 수' value={(d.request?.pktCnt || 0).toLocaleString()} />
                        <LV label='요청 횟수' value={(d.request?.reqCnt || 0).toLocaleString()} />
                      </div>
                    </div>

                    {d.request?.cookie && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-2 text-sm font-semibold text-gray-800'>🍪 Cookie</div>
                        <div className='p-3 bg-gray-50 rounded-lg font-mono text-xs break-all'>
                          {d.request.cookie}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: HTTP 응답 === */}
                {activeTab === 'response' && (
                  <>
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📥 응답 정보</div>
                      <div className='space-y-2'>
                        <div>
                          <span className='text-sm text-gray-500'>상태</span>
                          <div className='mt-1'>
                            <Badge
                              level={
                                d.response?.phrase === 'OK' || d.response?.phrase?.startsWith?.('2')
                                  ? 'ok'
                                  : d.response?.phrase?.startsWith?.('5')
                                    ? 'crit'
                                    : 'warn'
                              }
                            >
                              {d.response?.phrase || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <LV label='버전' value={d.response?.version} />
                        <LV label='Content-Type' value={d.response?.contentType} />
                        {d.response?.location && (
                          <LV label='Location' value={d.response.location} />
                        )}
                      </div>
                    </div>

                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📊 응답 통계</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='헤더 크기' value={prettyBytes(d.response?.headerLen || 0)} />
                        <LV label='본문 크기' value={prettyBytes(d.response?.contentLen || 0)} />
                        <LV label='전체 크기' value={prettyBytes(d.response?.totalLen || 0)} />
                        <LV label='패킷 수' value={(d.response?.pktCnt || 0).toLocaleString()} />
                        <LV label='응답 횟수' value={(d.response?.resCnt || 0).toLocaleString()} />
                      </div>
                    </div>
                  </>
                )}

                {/* === Tab: 성능 / TCP 품질 === */}
                {activeTab === 'performance' && (
                  <>
                    {/* 1) TCP 품질 & 에러 분석 */}
                    {d.tcpQuality && (
                      <div className='space-y-4 mb-4'>
                        {/* RTT / RTO: 실제 데이터가 있을 때만 노출 */}
                        {(hasRtt || hasRto) && (
                          <div className='rounded-xl border bg-white p-4'>
                            <div className='mb-3 text-sm font-semibold text-gray-800'>
                              ⚡ RTT / RTO
                            </div>
                            <div className='grid grid-cols-2 gap-3'>
                              {/* RTT 카드 */}
                              {hasRtt && (
                                <div className='bg-blue-50 p-3 rounded-lg'>
                                  <div className='text-xs text-gray-600 mb-1'>
                                    RTT (Round Trip Time)
                                  </div>
                                  <div className='text-xl font-bold text-blue-700'>
                                    {(d.tcpQuality.ackRttCntReq ?? 0) +
                                      (d.tcpQuality.ackRttCntRes ?? 0)}
                                    회
                                  </div>
                                  <div className='text-xs text-gray-500 mt-1'>
                                    요청: {d.tcpQuality.ackRttCntReq ?? 0} / 응답:{' '}
                                    {d.tcpQuality.ackRttCntRes ?? 0}
                                  </div>
                                </div>
                              )}

                              {/* RTO 카드 */}
                              {hasRto && (
                                <div
                                  className={`p-3 rounded-lg ${
                                    (d.tcpQuality.ackRtoTotal ?? 0) > 0
                                      ? 'bg-red-50'
                                      : 'bg-green-50'
                                  }`}
                                >
                                  <div className='text-xs text-gray-600 mb-1'>
                                    RTO (Retransmission Timeout)
                                  </div>
                                  <div
                                    className={`text-xl font-bold ${
                                      (d.tcpQuality.ackRtoTotal ?? 0) > 0
                                        ? 'text-red-700'
                                        : 'text-green-700'
                                    }`}
                                  >
                                    {d.tcpQuality.ackRtoTotal ?? 0}회
                                  </div>
                                  <div className='text-xs text-gray-500 mt-1'>
                                    요청: {d.tcpQuality.ackRtoCntReq ?? 0} / 응답:{' '}
                                    {d.tcpQuality.ackRtoCntRes ?? 0}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TCP 에러 */}
                        <div className='rounded-xl border bg-white p-4'>
                          <div className='mb-3 text-sm font-semibold text-gray-800'>
                            ⚠️ TCP 에러
                          </div>
                          {d.tcpQuality.tcpErrorCnt === 0 ? (
                            <div className='bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-center'>
                              ✅ 에러 없음 - 완벽한 TCP 연결!
                            </div>
                          ) : (
                            <div className='space-y-2 text-sm'>
                              {d.tcpQuality?.retransmission?.cnt > 0 && (
                                <div className='border-l-4 border-orange-500 bg-orange-50 p-3 rounded-r-lg'>
                                  <div className='font-semibold text-orange-900'>재전송</div>
                                  <div className='text-xs text-gray-600 mt-1'>
                                    카운트: {d.tcpQuality.retransmission.cnt} / 비율:{' '}
                                    {d.tcpQuality.retransmission.rate.toFixed(2)}%
                                  </div>
                                </div>
                              )}
                              {d.tcpQuality?.lostSeg?.cnt > 0 && (
                                <div className='border-l-4 border-red-500 bg-red-50 p-3 rounded-r-lg'>
                                  <div className='font-semibold text-red-900'>패킷 손실</div>
                                  <div className='text-xs text-gray-600 mt-1'>
                                    카운트: {d.tcpQuality.lostSeg.cnt} / 비율:{' '}
                                    {d.tcpQuality.lostSeg.rate.toFixed(2)}%
                                  </div>
                                </div>
                              )}
                              {d.tcpQuality?.outOfOrder?.cnt > 0 && (
                                <div className='border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r-lg'>
                                  <div className='font-semibold text-blue-900'>순서 오류</div>
                                  <div className='text-xs text-gray-600 mt-1'>
                                    카운트: {d.tcpQuality.outOfOrder.cnt} / 비율:{' '}
                                    {d.tcpQuality.outOfOrder.rate.toFixed(2)}%
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2) 대역폭 & 패킷 속도 (기존 내용) */}
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
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <LV label='요청 Mbps' value={(d.performance?.mbpsReq || 0).toFixed(3)} />
                          <LV label='응답 Mbps' value={(d.performance?.mbpsRes || 0).toFixed(3)} />
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
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <LV label='요청 PPS' value={(d.performance?.ppsReq || 0).toFixed(1)} />
                          <LV label='응답 PPS' value={(d.performance?.ppsRes || 0).toFixed(1)} />
                        </div>
                      </div>
                    </div>

                    {/* 3) 트래픽 상세 통계 (기존 내용) */}
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
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {(d.traffic?.pktCnt || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pktLen || 0)}
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
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {(d.traffic?.pktCntReq || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pktLenReq || 0)}
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
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {(d.traffic?.pktCntRes || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>
                                  {prettyBytes(d.traffic?.pktLenRes || 0)}
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
                  <div className='grid md:grid-cols-2 gap-4 items-stretch'>
                    {/* 왼쪽: 지도 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <EnhancedGeoMap
                        countryReq={d.env?.countryReq}
                        countryRes={d.env?.countryRes}
                        srcIp={d.srcIp}
                        dstIp={d.dstIp}
                        env={d.env}
                      />
                    </div>

                    {/* 오른쪽: 출발지/도착지 카드를 위아래로 */}
                    <div className='flex flex-col gap-4'>
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
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default HttpUriRowPreviewModal
