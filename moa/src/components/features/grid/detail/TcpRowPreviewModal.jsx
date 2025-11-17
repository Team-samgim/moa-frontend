import { memo, useEffect, useRef, useState } from 'react'
import EnhancedGeoMap from '@/components/features/grid/detail/EnhancedGeoMap'
import useTcpMetrics from '@/hooks/detail/useTcpMetrics'

// ===== 유틸리티 함수 =====
const prettyBytes = (n = 0) => {
  if (n === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

const pct = (v) => `${((v || 0) * 100).toFixed(2)}%`

// 빈 값 처리
const emptyValue = (value, defaultText = '값 없음') => {
  if (value === null || value === undefined || value === '') return defaultText
  if (typeof value === 'number' && isNaN(value)) return defaultText
  return value
}

// 타임스탬프 포맷팅
const formatTimestamp = (epoch) => {
  if (!epoch) return '값 없음'
  try {
    return new Date(epoch * 1000).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return String(epoch)
  }
}

// 지속 시간 포맷팅
const formatDuration = (sec) => {
  if (!sec || sec < 0) return '0초'
  if (sec < 0.001) return `${(sec * 1000000).toFixed(0)} μs`
  if (sec < 1) return `${(sec * 1000).toFixed(2)} ms`
  if (sec < 60) return `${sec.toFixed(2)}초`
  const min = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(0)
  if (min < 60) return `${min}분 ${s}초`
  const hr = Math.floor(min / 60)
  const m = min % 60
  return `${hr}시간 ${m}분`
}

// ===== 공통 UI 컴포넌트들 =====
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
const TcpRowPreviewModal = memo(function TcpRowPreviewModal({ open, onClose, rowKey }) {
  const q = useTcpMetrics(rowKey)
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

  // 환경 정보 확인
  const hasEnv =
    d.env &&
    (d.env.countryReq || d.env.countryRes || d.env.domesticPrimaryReq || d.env.domesticPrimaryRes)

  // 진단 메시지 확인
  const diagEntries = Object.entries(d.diagnostics || {})

  // 품질 이슈 확인
  const hasQualityIssue =
    (d.retransRateBytes || 0) > 0.05 ||
    (d.oooRatePkts || 0) > 0.05 ||
    (d.lossRatePkts || 0) > 0.05 ||
    (d.ackRtoTotal || 0) > 0

  // 품질 등급 계산
  const qualityLevel =
    (d.retransRateBytes || 0) >= 0.05 || (d.lossRatePkts || 0) >= 0.05
      ? 'crit'
      : (d.retransRateBytes || 0) > 0 || (d.oooRatePkts || 0) > 0
        ? 'warn'
        : 'ok'

  return (
    <div className='fixed inset-0 z-[100]' aria-hidden={!open}>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' onClick={onClose} />

      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='tcp-dialog-title'
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
              <div id='tcp-dialog-title' className='text-lg font-semibold'>
                TCP 세션 상세 분석
              </div>
              {d.qualityScore && (
                <Badge level={qualityLevel}>
                  품질: {d.qualityScore.grade || d.qualityScore.score + '점'}
                </Badge>
              )}
              {hasQualityIssue && !d.qualityScore && <Badge level='warn'>⚠️ 품질 이슈 감지</Badge>}
              {d.app && <Chip color='purple'>{d.app}</Chip>}
              {d.master && <Chip color='blue'>{d.master}</Chip>}
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
            <TabButton id='quality' activeId={activeTab} onClick={setActiveTab}>
              {hasQualityIssue ? '⚠️ ' : '📊 '}품질 분석
            </TabButton>
            <TabButton id='session' activeId={activeTab} onClick={setActiveTab}>
              🔌 세션 정보
            </TabButton>
            {hasEnv && (
              <TabButton id='geo' activeId={activeTab} onClick={setActiveTab}>
                🌍 위치 정보
              </TabButton>
            )}
            <TabButton id='advanced' activeId={activeTab} onClick={setActiveTab}>
              📈 상세 통계
            </TabButton>
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
                    {/* 세션 헤더 카드 */}
                    <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                      <div className='text-sm text-gray-600 mb-1'>TCP 세션</div>
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

                      {/* 프로토콜 칩들 */}
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {d.app && <Chip color='purple'>App: {d.app}</Chip>}
                        {d.master && <Chip color='blue'>Proto: {d.master}</Chip>}
                        {d.sni && <Chip color='amber'>SNI: {d.sni}</Chip>}
                        {d.handshake && <Chip color='green'>핸드셰이크: {d.handshake}</Chip>}
                        {d.termination && <Chip color='red'>종료: {d.termination}</Chip>}
                        {hasQualityIssue && <Chip color='red'>⚠️ 품질 이슈</Chip>}
                        {d.env?.sensorDeviceName && <Chip>센서: {d.env.sensorDeviceName}</Chip>}
                      </div>
                    </div>

                    {/* 품질 점수 (있는 경우) */}
                    {d.qualityScore && (
                      <div className='rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-5'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='text-sm text-gray-600 mb-1'>연결 품질 점수</div>
                            <div className='text-3xl font-bold text-blue-700'>
                              {d.qualityScore.score}/100
                            </div>
                            <div className='text-sm font-medium text-blue-600 mt-1'>
                              {d.qualityScore.grade}
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='text-xs text-gray-500 mb-1'>주요 이슈</div>
                            <div className='text-sm text-gray-700'>
                              {emptyValue(d.qualityScore.summary, '이슈 없음')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 핵심 지표 */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>평균 처리량</div>
                        <div className='text-lg font-bold text-blue-700'>
                          {prettyBytes((d.bps || 0) / 8)}/s
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {Math.round(d.bps || 0)} bps
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 데이터</div>
                        <div className='text-lg font-bold text-emerald-700'>
                          {prettyBytes(d.len)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 패킷</div>
                        <div className='text-lg font-bold text-purple-700'>
                          {(d.pkts || 0).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`rounded-xl border bg-gradient-to-br p-4 ${
                          hasQualityIssue
                            ? 'from-amber-50 to-white border-amber-200'
                            : 'from-green-50 to-white'
                        }`}
                      >
                        <div className='text-xs text-gray-500'>평균 패킷 크기</div>
                        <div
                          className={`text-lg font-bold ${hasQualityIssue ? 'text-amber-700' : 'text-green-700'}`}
                        >
                          {d.avgPktSize ? `${d.avgPktSize.toFixed(0)} bytes` : '값 없음'}
                        </div>
                      </div>
                    </div>

                    {/* 품질 이슈 경고 */}
                    {hasQualityIssue && (
                      <div className='rounded-xl border-2 border-amber-300 bg-amber-50 p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='text-2xl'>⚠️</div>
                          <div className='flex-1'>
                            <div className='mb-2 text-sm font-semibold text-amber-800'>
                              TCP 품질 이슈가 감지되었습니다
                            </div>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3'>
                              {(d.retransRateBytes || 0) > 0 && (
                                <div className='bg-white/60 p-2 rounded'>
                                  <div className='text-xs text-gray-600'>재전송율</div>
                                  <div className='font-bold text-orange-700'>
                                    {pct(d.retransRateBytes)}
                                  </div>
                                </div>
                              )}
                              {(d.lossRatePkts || 0) > 0 && (
                                <div className='bg-white/60 p-2 rounded'>
                                  <div className='text-xs text-gray-600'>패킷 손실률</div>
                                  <div className='font-bold text-red-700'>
                                    {pct(d.lossRatePkts)}
                                  </div>
                                </div>
                              )}
                              {(d.oooRatePkts || 0) > 0 && (
                                <div className='bg-white/60 p-2 rounded'>
                                  <div className='text-xs text-gray-600'>순서 오류율</div>
                                  <div className='font-bold text-amber-700'>
                                    {pct(d.oooRatePkts)}
                                  </div>
                                </div>
                              )}
                              {(d.ackRtoTotal || 0) > 0 && (
                                <div className='bg-white/60 p-2 rounded'>
                                  <div className='text-xs text-gray-600'>RTO</div>
                                  <div className='font-bold text-red-700'>
                                    {(d.ackRtoTotal || 0).toLocaleString()}회
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className='text-xs text-amber-700 space-y-1'>
                              <div>
                                💡 TCP 품질 저하는 네트워크 성능에 직접적인 영향을 미칩니다.
                              </div>
                              <div>
                                • 재전송, 패킷 손실, 순서 오류는 대역폭 낭비와 지연을 유발합니다.
                              </div>
                              <div>• 자세한 분석은 "품질 분석" 탭에서 확인하세요.</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 진단 메시지 */}
                    {diagEntries.length > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🔍 진단 메시지
                        </div>
                        <ul className='space-y-2'>
                          {diagEntries.map(([k, msg]) => {
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

                    {/* 시간 정보 */}
                    {(d.tsFirst || d.tsLast || d.durSec) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>⏱️ 시간 정보</div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          <LV label='세션 시작' value={formatTimestamp(d.tsFirst)} />
                          <LV label='세션 종료' value={formatTimestamp(d.tsLast)} />
                          {d.durSec !== null && d.durSec !== undefined && (
                            <LV label='지속 시간' value={formatDuration(d.durSec)} />
                          )}
                          <LV label='샘플링 시작' value={formatTimestamp(d.tsSampleBegin)} />
                          <LV label='샘플링 종료' value={formatTimestamp(d.tsSampleEnd)} />
                        </div>
                      </div>
                    )}

                    {/* 트래픽 통계 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📊 트래픽 통계</div>
                      <div className='grid grid-cols-3 gap-4'>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>전체</div>
                          <div className='space-y-2 text-sm'>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>패킷</span>
                                <span className='font-medium'>
                                  {(d.pkts || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>{prettyBytes(d.len)}</span>
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
                                  {(d.pktsReq || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>{prettyBytes(d.lenReq)}</span>
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
                                  {(d.pktsRes || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>{prettyBytes(d.lenRes)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 연결 상태 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔌 연결 상태</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='핸드셰이크' value={d.handshake} />
                        <LV label='종료' value={d.termination} />
                        <LV label='ACK-only' value={d.ackOnly ? '예' : '아니오'} />
                        {d.reqResRatio !== null && d.reqResRatio !== undefined && (
                          <LV label='Req/Res 비율' value={d.reqResRatio.toFixed(2)} />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* === Tab: 품질 분석 === */}
                {activeTab === 'quality' && (
                  <>
                    {/* 핵심 품질 지표 */}
                    <div className='rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5'>
                      <div className='mb-4 text-base font-bold text-blue-800'>
                        📊 핵심 품질 지표
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <div className='bg-white rounded-lg p-4 border'>
                          <div className='text-xs text-gray-500 mb-2'>재전송율</div>
                          <div className='text-2xl font-bold text-orange-700 mb-2'>
                            {pct(d.retransRateBytes)}
                          </div>
                          <Badge level={d.badges?.retrans || 'ok'}>
                            {d.badges?.retrans === 'crit'
                              ? '위험'
                              : d.badges?.retrans === 'warn'
                                ? '경고'
                                : '정상'}
                          </Badge>
                        </div>
                        <div className='bg-white rounded-lg p-4 border'>
                          <div className='text-xs text-gray-500 mb-2'>순서 오류율</div>
                          <div className='text-2xl font-bold text-amber-700 mb-2'>
                            {pct(d.oooRatePkts)}
                          </div>
                          <Badge level={d.badges?.ooo || 'ok'}>
                            {d.badges?.ooo === 'crit'
                              ? '위험'
                              : d.badges?.ooo === 'warn'
                                ? '경고'
                                : '정상'}
                          </Badge>
                        </div>
                        <div className='bg-white rounded-lg p-4 border'>
                          <div className='text-xs text-gray-500 mb-2'>패킷 손실률</div>
                          <div className='text-2xl font-bold text-red-700 mb-2'>
                            {pct(d.lossRatePkts)}
                          </div>
                          <Badge level={d.badges?.loss || 'ok'}>
                            {d.badges?.loss === 'crit'
                              ? '위험'
                              : d.badges?.loss === 'warn'
                                ? '경고'
                                : '정상'}
                          </Badge>
                        </div>
                        <div className='bg-white rounded-lg p-4 border'>
                          <div className='text-xs text-gray-500 mb-2'>체크섬 에러율</div>
                          <div className='text-2xl font-bold text-purple-700 mb-2'>
                            {pct(d.csumRatePkts)}
                          </div>
                          <Badge level={d.badges?.csum || 'ok'}>
                            {d.badges?.csum === 'crit'
                              ? '위험'
                              : d.badges?.csum === 'warn'
                                ? '경고'
                                : '정상'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* RTT/RTO */}
                    {(d.ackRttCntReq || d.ackRttCntRes || d.ackRtoCntReq || d.ackRtoCntRes) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          ⚡ RTT / RTO (응답 시간 / 타임아웃)
                        </div>
                        <div className='grid grid-cols-2 gap-3 mb-4'>
                          <div className='bg-blue-50 p-3 rounded-lg'>
                            <div className='text-xs text-gray-600 mb-1'>RTT (Round Trip Time)</div>
                            <div className='text-xl font-bold text-blue-700'>
                              {(d.ackRttCntReq || 0) + (d.ackRttCntRes || 0)}회
                            </div>
                            <div className='text-xs text-gray-500 mt-1'>
                              요청: {d.ackRttCntReq || 0} / 응답: {d.ackRttCntRes || 0}
                            </div>
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              (d.ackRtoTotal || 0) > 0 ? 'bg-red-50' : 'bg-green-50'
                            }`}
                          >
                            <div className='text-xs text-gray-600 mb-1'>
                              RTO (Retransmission Timeout)
                            </div>
                            <div
                              className={`text-xl font-bold ${
                                (d.ackRtoTotal || 0) > 0 ? 'text-red-700' : 'text-green-700'
                              }`}
                            >
                              {d.ackRtoTotal || 0}회
                            </div>
                            <div className='text-xs text-gray-500 mt-1'>
                              요청: {d.ackRtoCntReq || 0} / 응답: {d.ackRtoCntRes || 0}
                            </div>
                          </div>
                        </div>
                        {d.badges?.rto && (
                          <Badge level={d.badges.rto}>RTO 상태: {d.badges.rto}</Badge>
                        )}
                      </div>
                    )}

                    {/* PDU 분석 */}
                    {(d.lenPdu || d.overhead) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📦 PDU 분석 (페이로드 vs 오버헤드)
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                          <LV label='총 PDU' value={prettyBytes(d.lenPdu)} />
                          <LV label='PDU 요청' value={prettyBytes(d.lenPduReq)} />
                          <LV label='PDU 응답' value={prettyBytes(d.lenPduRes)} />
                          <LV label='오버헤드' value={prettyBytes(d.overhead)} />
                          {d.overheadRate !== null && d.overheadRate !== undefined && (
                            <LV label='오버헤드 비율' value={`${d.overheadRate.toFixed(2)}%`} />
                          )}
                        </div>
                        {d.badges?.overhead && (
                          <div className='mt-3'>
                            <Badge level={d.badges.overhead}>오버헤드: {d.badges.overhead}</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 재전송 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔄 재전송 상세</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='재전송 횟수' value={(d.retransCnt || 0).toLocaleString()} />
                        <LV label='재전송 요청' value={(d.retransCntReq || 0).toLocaleString()} />
                        <LV label='재전송 응답' value={(d.retransCntRes || 0).toLocaleString()} />
                        <LV label='재전송 바이트' value={prettyBytes(d.retransLen)} />
                        <LV label='재전송율 (바이트)' value={pct(d.retransRateBytes)} />
                        <LV label='재전송율 (패킷)' value={pct(d.retransRatePkts)} />
                      </div>
                    </div>

                    {/* 윈도우 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🪟 윈도우 상태</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='Zero Window' value={(d.zeroWinCnt || 0).toLocaleString()} />
                        <LV label='Zero Win 요청' value={(d.zeroWinCntReq || 0).toLocaleString()} />
                        <LV label='Zero Win 응답' value={(d.zeroWinCntRes || 0).toLocaleString()} />
                        <LV label='Window Full' value={(d.winFullCnt || 0).toLocaleString()} />
                        <LV label='Win Full 요청' value={(d.winFullCntReq || 0).toLocaleString()} />
                        <LV label='Win Full 응답' value={(d.winFullCntRes || 0).toLocaleString()} />
                        <LV label='Window Update' value={(d.winUpdateCnt || 0).toLocaleString()} />
                      </div>
                      {d.badges?.win && (
                        <div className='mt-3'>
                          <Badge level={d.badges.win}>윈도우: {d.badges.win}</Badge>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* === Tab: 세션 정보 === */}
                {activeTab === 'session' && (
                  <>
                    {/* 세션 상태 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔌 세션 상태</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV
                          label='만료 여부'
                          value={
                            d.expired !== null && d.expired !== undefined
                              ? d.expired
                                ? 'Yes'
                                : 'No'
                              : '값 없음'
                          }
                        />
                        <LV
                          label='타임아웃으로 만료'
                          value={
                            d.expiredByTimeout !== null && d.expiredByTimeout !== undefined
                              ? d.expiredByTimeout
                                ? 'Yes'
                                : 'No'
                              : '값 없음'
                          }
                        />
                        <LV label='세션 타임아웃' value={d.sessionTimeout} />
                      </div>
                      {d.expiredByTimeout === 1 && (
                        <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xl'>⚠️</span>
                            <span className='font-medium'>세션이 타임아웃으로 종료되었습니다</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TCP 플래그 */}
                    {d.flags && Object.keys(d.flags).length > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🚩 TCP 플래그
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-5 gap-3 text-sm'>
                          {Object.entries(d.flags).map(([k, v]) => (
                            <Row key={k} label={k} value={v} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 타임스탬프 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        ⏰ 타임스탬프 상세
                      </div>
                      <div className='grid md:grid-cols-2 gap-4 text-sm'>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>세션 정보</div>
                          <div className='space-y-2'>
                            <LV label='시작' value={formatTimestamp(d.tsFirst)} />
                            <LV label='종료' value={formatTimestamp(d.tsLast)} />
                            <LV label='만료 시각' value={formatTimestamp(d.tsExpired)} />
                            {d.durSec !== null && d.durSec !== undefined && (
                              <LV
                                label='지속 시간'
                                value={`${formatDuration(d.durSec)} (${d.durSec.toFixed(3)}초)`}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>
                            샘플링 정보
                          </div>
                          <div className='space-y-2'>
                            <LV label='시작' value={formatTimestamp(d.tsSampleBegin)} />
                            <LV label='종료' value={formatTimestamp(d.tsSampleEnd)} />
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

                {/* === Tab: 상세 통계 === */}
                {activeTab === 'advanced' && (
                  <>
                    {/* 품질 카운트 */}
                    {d.quality && Object.keys(d.quality).length > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📈 품질 카운트
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                          {Object.entries(d.quality).map(([k, v]) => (
                            <Row key={k} label={k} value={v} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 중복 ACK */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔁 중복 ACK</div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        <LV label='총 중복 ACK' value={(d.dupAckCnt || 0).toLocaleString()} />
                        <LV label='중복 ACK 요청' value={(d.dupAckCntReq || 0).toLocaleString()} />
                        <LV label='중복 ACK 응답' value={(d.dupAckCntRes || 0).toLocaleString()} />
                        {d.dupAckRate !== null && d.dupAckRate !== undefined && (
                          <LV label='중복 ACK 비율' value={`${d.dupAckRate.toFixed(2)}%`} />
                        )}
                      </div>
                    </div>

                    {/* ACK 손실 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>❌ ACK 손실</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='총 ACK 손실' value={(d.ackLostCnt || 0).toLocaleString()} />
                        <LV label='ACK 손실 요청' value={(d.ackLostCntReq || 0).toLocaleString()} />
                        <LV label='ACK 손실 응답' value={(d.ackLostCntRes || 0).toLocaleString()} />
                      </div>
                    </div>

                    {/* 순서 오류 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔀 순서 오류</div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        <LV label='순서 오류 횟수' value={(d.oooCnt || 0).toLocaleString()} />
                        <LV label='순서 오류 요청' value={(d.oooCntReq || 0).toLocaleString()} />
                        <LV label='순서 오류 응답' value={(d.oooCntRes || 0).toLocaleString()} />
                        <LV label='순서 오류 바이트' value={prettyBytes(d.oooLen)} />
                        <LV label='순서 오류율' value={pct(d.oooRatePkts)} />
                      </div>
                    </div>

                    {/* 패킷 손실 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📉 패킷 손실</div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        <LV label='손실 횟수' value={(d.lostCnt || 0).toLocaleString()} />
                        <LV label='손실 요청' value={(d.lostCntReq || 0).toLocaleString()} />
                        <LV label='손실 응답' value={(d.lostCntRes || 0).toLocaleString()} />
                        <LV label='손실 바이트' value={prettyBytes(d.lostLen)} />
                        <LV label='손실률' value={pct(d.lossRatePkts)} />
                      </div>
                    </div>

                    {/* 체크섬 에러 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>✅ 체크섬 에러</div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                        <LV label='에러 횟수' value={(d.csumCnt || 0).toLocaleString()} />
                        <LV label='에러 요청' value={(d.csumCntReq || 0).toLocaleString()} />
                        <LV label='에러 응답' value={(d.csumCntRes || 0).toLocaleString()} />
                        <LV label='에러 바이트' value={prettyBytes(d.csumLen)} />
                        <LV label='에러율' value={pct(d.csumRatePkts)} />
                      </div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div className='text-xs text-gray-400 pt-4 border-t flex justify-between items-center'>
                  <span className='font-mono'>rowKey: {emptyValue(d.rowKey)}</span>
                  {hasQualityIssue && (
                    <span className='text-amber-500 font-medium'>⚠️ TCP 품질 이슈 감지</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default TcpRowPreviewModal
