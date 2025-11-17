import { memo, useEffect, useRef, useState } from 'react'
import EnhancedGeoMap from '@/components/features/grid/detail/EnhancedGeoMap'
import useEthernetMetrics from '@/hooks/detail/useEthernetMetrics'

// 유틸리티 함수
const prettyBytes = (n = 0) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

const pct = (v = 0) => `${((v || 0) * 100).toFixed(2)}%`

// 빈 값 처리 헬퍼
const emptyValue = (value, defaultText = '값 없음') => {
  if (value === null || value === undefined || value === '') return defaultText
  if (typeof value === 'number' && isNaN(value)) return defaultText
  return value
}

// epoch seconds → 로컬 시간 문자열
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

// 초 → 읽기 쉬운 문자열
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

const levelByRate = (r = 0) => (r >= 0.05 ? 'crit' : r > 0 ? 'warn' : 'ok')

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
const EthernetRowPreviewModal = memo(function EthernetRowPreviewModal({ open, onClose, rowKey }) {
  const q = useEthernetMetrics(rowKey)
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

  const {
    rowKey: _rk,
    flowIdentifier,
    srcMac,
    dstMac,
    srcIp,
    dstIp,
    srcPort,
    dstPort,
    l2Proto,
    l3Proto,
    l4Proto,
    l4ProtoName,
    l7proto,
    ipVersion,
    app,
    master,
    sniHostname,
    tsFirst,
    tsLast,
    tsSampleBegin,
    tsSampleEnd,
    durSec,
    expired,
    expiredByTimeout,
    bps,
    bytes,
    bytesReq,
    bytesRes,
    frames,
    framesReq,
    framesRes,
    crcErrorCnt,
    crcErrorCntReq,
    crcErrorCntRes,
    crcErrorRateFrames,
    crcErrorLen,
    crcErrorLenReq,
    crcErrorLenRes,
    packetStats,
    env,
    counters,
    diagnostics,
  } = d

  const mbps = (bps || 0) / 1_000_000
  const diagEntries = Object.entries(diagnostics || {})
  const cntEntries = Object.entries(counters || {})

  const totalFrames = frames || 0
  const rate = (cnt = 0) => (totalFrames > 0 ? cnt / totalFrames : 0)

  // 환경 정보가 있는지 확인
  const hasEnv =
    env &&
    (env.countryReq ||
      env.countryRes ||
      env.domesticPrimaryReq ||
      env.domesticPrimaryRes ||
      env.sensorDeviceName)

  // CRC 에러 여부
  const hasCrcError = (crcErrorCnt || 0) > 0

  // 시간 정보: 값이 0이어도 필드가 존재하면 노출
  const hasTimeInfoSummary =
    tsFirst !== null ||
    tsLast !== null ||
    tsSampleBegin !== null ||
    tsSampleEnd !== null ||
    durSec !== null

  // CRC 에러 데이터 길이: 0이어도 필드가 존재하면 노출
  const hasCrcErrorLen = crcErrorLen !== null || crcErrorLenReq !== null || crcErrorLenRes !== null

  return (
    <div className='fixed inset-0 z-[100]' aria-hidden={!open}>
      <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' onClick={onClose} />

      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='ethernet-dialog-title'
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
              <div id='ethernet-dialog-title' className='text-lg font-semibold'>
                Ethernet Flow 상세 분석
              </div>
              {hasCrcError && (
                <Badge level='crit'>⚠️ CRC 에러 {(crcErrorCnt || 0).toLocaleString()}건</Badge>
              )}
              {app && <Chip color='purple'>{app}</Chip>}
              {master && <Chip color='blue'>{master}</Chip>}
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
            <TabButton id='errors' activeId={activeTab} onClick={setActiveTab}>
              {hasCrcError ? '⚠️ ' : '📊 '}품질 / 에러
            </TabButton>
            <TabButton id='session' activeId={activeTab} onClick={setActiveTab}>
              🔌 세션 정보
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
                      <div className='text-[15px] font-semibold mb-1'>
                        {emptyValue(srcMac)} <span className='text-gray-400'>→</span>{' '}
                        {emptyValue(dstMac)}
                      </div>
                      {(srcIp || dstIp) && (
                        <div className='text-sm text-gray-600'>
                          <span className='text-gray-500'>IP: </span>
                          {srcIp ? (
                            <>
                              <span className='font-medium'>{srcIp}</span>
                              {srcPort && <span className='text-gray-500'>:{srcPort}</span>}
                            </>
                          ) : (
                            <span className='text-gray-400 italic'>값 없음</span>
                          )}
                          {srcIp && dstIp && <span className='mx-2 text-gray-400'>→</span>}
                          {dstIp ? (
                            <>
                              <span className='font-medium'>{dstIp}</span>
                              {dstPort && <span className='text-gray-500'>:{dstPort}</span>}
                            </>
                          ) : (
                            <span className='text-gray-400 italic'>값 없음</span>
                          )}
                        </div>
                      )}
                      {flowIdentifier && (
                        <div className='mt-2 text-xs text-gray-500 font-mono'>
                          Flow ID: {flowIdentifier}
                        </div>
                      )}

                      {/* 프로토콜 칩들 */}
                      <div className='mt-3 flex flex-wrap gap-2'>
                        {ipVersion && <Chip color='blue'>IPv{ipVersion}</Chip>}
                        {l4ProtoName ? (
                          <Chip color='green'>{l4ProtoName}</Chip>
                        ) : l4Proto ? (
                          <Chip color='green'>L4: {l4Proto}</Chip>
                        ) : null}
                        {app && <Chip color='purple'>App: {app}</Chip>}
                        {master && <Chip color='purple'>Master: {master}</Chip>}
                        {sniHostname && <Chip color='amber'>SNI: {sniHostname}</Chip>}
                        {hasCrcError && <Chip color='red'>⚠️ CRC 에러 발생</Chip>}
                        {env?.sensorDeviceName && <Chip>센서: {env.sensorDeviceName}</Chip>}
                      </div>
                    </div>

                    {/* 핵심 지표 */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>평균 처리량</div>
                        <div className='text-lg font-bold text-blue-700'>
                          {mbps.toFixed(2)} Mbps
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 데이터</div>
                        <div className='text-lg font-bold text-emerald-700'>
                          {prettyBytes(bytes)}
                        </div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>총 프레임</div>
                        <div className='text-lg font-bold text-purple-700'>
                          {(frames || 0).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`rounded-xl border bg-gradient-to-br p-4 ${
                          hasCrcError
                            ? 'from-red-50 to-white border-red-200'
                            : 'from-green-50 to-white'
                        }`}
                      >
                        <div className='text-xs text-gray-500'>CRC 에러</div>
                        <div
                          className={`text-lg font-bold ${hasCrcError ? 'text-red-700' : 'text-green-700'}`}
                        >
                          {(crcErrorCnt || 0).toLocaleString()}
                        </div>
                        {crcErrorRateFrames > 0 && (
                          <div className='text-xs text-red-600 mt-1'>
                            에러율: {(crcErrorRateFrames * 100).toFixed(3)}%
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CRC 에러 경고 */}
                    {hasCrcError && (
                      <div className='rounded-xl border-2 border-red-300 bg-red-50 p-4'>
                        <div className='flex items-start gap-3'>
                          <div className='text-2xl'>⚠️</div>
                          <div className='flex-1'>
                            <div className='mb-2 text-sm font-semibold text-red-800'>
                              CRC 에러가 감지되었습니다
                            </div>
                            <div className='grid grid-cols-3 gap-3 text-sm mb-3'>
                              <div className='bg-white/60 p-2 rounded'>
                                <div className='text-xs text-gray-600'>총 에러</div>
                                <div className='font-bold text-red-700'>
                                  {(crcErrorCnt || 0).toLocaleString()}건
                                </div>
                              </div>
                              <div className='bg-white/60 p-2 rounded'>
                                <div className='text-xs text-gray-600'>요청 에러</div>
                                <div className='font-bold text-red-700'>
                                  {(crcErrorCntReq || 0).toLocaleString()}건
                                </div>
                              </div>
                              <div className='bg-white/60 p-2 rounded'>
                                <div className='text-xs text-gray-600'>응답 에러</div>
                                <div className='font-bold text-red-700'>
                                  {(crcErrorCntRes || 0).toLocaleString()}건
                                </div>
                              </div>
                            </div>
                            <div className='text-xs text-red-700 space-y-1'>
                              <div>💡 CRC 에러는 데이터 전송 중 손상이 발생했음을 의미합니다.</div>
                              <div>
                                • 네트워크 케이블 불량, EMI 간섭, 또는 하드웨어 문제가 원인일 수
                                있습니다.
                              </div>
                              <div>• 자세한 분석은 "품질 / 에러" 탭에서 확인하세요.</div>
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

                    {/* 시간 정보: 값이 0이어도 필드만 존재하면 보여줌 */}
                    {hasTimeInfoSummary && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>⏱️ 시간 정보</div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          <LV label='플로우 시작' value={formatTimestamp(tsFirst)} />
                          <LV label='플로우 종료' value={formatTimestamp(tsLast)} />
                          {durSec !== null && durSec !== undefined && (
                            <LV label='지속 시간' value={formatDuration(durSec)} />
                          )}
                          <LV label='샘플링 시작' value={formatTimestamp(tsSampleBegin)} />
                          <LV label='샘플링 종료' value={formatTimestamp(tsSampleEnd)} />
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
                                <span className='text-gray-500'>프레임</span>
                                <span className='font-medium'>
                                  {(frames || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-gray-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>{prettyBytes(bytes)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>요청</div>
                          <div className='space-y-2 text-sm'>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>프레임</span>
                                <span className='font-medium'>
                                  {(framesReq || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-blue-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>{prettyBytes(bytesReq)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>응답</div>
                          <div className='space-y-2 text-sm'>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>프레임</span>
                                <span className='font-medium'>
                                  {(framesRes || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className='bg-green-50 p-2 rounded'>
                              <div className='flex justify-between'>
                                <span className='text-gray-500'>바이트</span>
                                <span className='font-medium'>{prettyBytes(bytesRes)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* === Tab: 품질/에러 === */}
                {activeTab === 'errors' && (
                  <>
                    {/* CRC 에러 상세 */}
                    {hasCrcError ? (
                      <div className='rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-5'>
                        <div className='flex items-center gap-2 mb-4'>
                          <span className='text-2xl'>⚠️</span>
                          <div className='text-base font-bold text-red-800'>CRC 에러 상세 분석</div>
                        </div>

                        <div className='grid md:grid-cols-3 gap-4 mb-4'>
                          <div className='bg-white rounded-lg p-4 border-2 border-red-200'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div className='w-3 h-3 rounded-full bg-red-500'></div>
                              <div className='font-semibold text-red-900'>총 에러</div>
                            </div>
                            <div className='text-2xl font-bold text-red-700 mb-1'>
                              {(crcErrorCnt || 0).toLocaleString()}건
                            </div>
                            <Badge level='crit'>{pct(rate(crcErrorCnt))}</Badge>
                          </div>

                          <div className='bg-white rounded-lg p-4 border-2 border-orange-200'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div className='w-3 h-3 rounded-full bg-orange-500'></div>
                              <div className='font-semibold text-orange-900'>요청 에러</div>
                            </div>
                            <div className='text-2xl font-bold text-orange-700 mb-1'>
                              {(crcErrorCntReq || 0).toLocaleString()}건
                            </div>
                            <Badge level={levelByRate(rate(crcErrorCntReq))}>
                              {pct(rate(crcErrorCntReq))}
                            </Badge>
                          </div>

                          <div className='bg-white rounded-lg p-4 border-2 border-amber-200'>
                            <div className='flex items-center gap-2 mb-2'>
                              <div className='w-3 h-3 rounded-full bg-amber-500'></div>
                              <div className='font-semibold text-amber-900'>응답 에러</div>
                            </div>
                            <div className='text-2xl font-bold text-amber-700 mb-1'>
                              {(crcErrorCntRes || 0).toLocaleString()}건
                            </div>
                            <Badge level={levelByRate(rate(crcErrorCntRes))}>
                              {pct(rate(crcErrorCntRes))}
                            </Badge>
                          </div>
                        </div>

                        {/* 에러 데이터 크기: 값이 0이어도 필드만 존재하면 노출 */}
                        {hasCrcErrorLen && (
                          <div className='grid grid-cols-3 gap-3 mb-4'>
                            <div className='bg-white/60 p-3 rounded'>
                              <div className='text-xs text-gray-600 mb-1'>총 에러 데이터</div>
                              <div className='font-bold text-red-700'>
                                {prettyBytes(crcErrorLen)}
                              </div>
                            </div>
                            <div className='bg-white/60 p-3 rounded'>
                              <div className='text-xs text-gray-600 mb-1'>요청 에러 데이터</div>
                              <div className='font-bold text-orange-700'>
                                {prettyBytes(crcErrorLenReq)}
                              </div>
                            </div>
                            <div className='bg-white/60 p-3 rounded'>
                              <div className='text-xs text-gray-600 mb-1'>응답 에러 데이터</div>
                              <div className='font-bold text-amber-700'>
                                {prettyBytes(crcErrorLenRes)}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className='bg-white/80 rounded-lg p-4 text-sm text-gray-700'>
                          <div className='font-semibold text-red-800 mb-2'>
                            💡 CRC 에러 원인 분석
                          </div>
                          <ul className='space-y-1.5 ml-4 list-disc'>
                            <li>
                              <strong>케이블 불량:</strong> 손상되거나 품질이 낮은 네트워크 케이블
                            </li>
                            <li>
                              <strong>EMI/RFI 간섭:</strong> 전자기 간섭 또는 무선 주파수 간섭
                            </li>
                            <li>
                              <strong>하드웨어 문제:</strong> NIC, 스위치, 라우터 등의 하드웨어 오류
                            </li>
                            <li>
                              <strong>커넥터 문제:</strong> 느슨하거나 산화된 연결부
                            </li>
                            <li>
                              <strong>과부하:</strong> 네트워크 장비의 과도한 트래픽 부하
                            </li>
                          </ul>
                        </div>

                        <div className='mt-3 text-xs text-red-700 font-medium'>
                          ⚠️ CRC 에러가 지속적으로 발생하면 물리적 네트워크 점검이 필요합니다.
                        </div>
                      </div>
                    ) : (
                      <div className='rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6'>
                        <div className='flex items-center justify-center gap-3'>
                          <div className='text-4xl'>✅</div>
                          <div>
                            <div className='text-lg font-bold text-green-800'>
                              CRC 에러 없음 - 완벽한 연결!
                            </div>
                            <div className='text-sm text-green-700 mt-1'>
                              데이터 무결성이 보장되고 있습니다.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 패킷 크기 통계 */}
                    {packetStats && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📊 패킷 크기 통계
                        </div>
                        <div className='grid md:grid-cols-2 gap-4'>
                          <div className='border rounded-lg p-4 bg-blue-50'>
                            <div className='text-sm font-semibold text-blue-800 mb-3'>
                              요청 방향
                            </div>
                            <div className='space-y-2 text-sm'>
                              <LV
                                label='최소'
                                value={`${emptyValue(packetStats.pktLenMinReq, '0')} bytes`}
                              />
                              <LV
                                label='최대'
                                value={`${emptyValue(packetStats.pktLenMaxReq, '0')} bytes`}
                              />
                              <LV
                                label='평균'
                                value={`${(packetStats.pktLenAvgReq || 0).toFixed(1)} bytes`}
                              />
                            </div>
                          </div>
                          <div className='border rounded-lg p-4 bg-green-50'>
                            <div className='text-sm font-semibold text-green-800 mb-3'>
                              응답 방향
                            </div>
                            <div className='space-y-2 text-sm'>
                              <LV
                                label='최소'
                                value={`${emptyValue(packetStats.pktLenMinRes, '0')} bytes`}
                              />
                              <LV
                                label='최대'
                                value={`${emptyValue(packetStats.pktLenMaxRes, '0')} bytes`}
                              />
                              <LV
                                label='평균'
                                value={`${(packetStats.pktLenAvgRes || 0).toFixed(1)} bytes`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 카운터 전체 */}
                    {cntEntries.length > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          📈 전체 카운터
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-sm'>
                          {cntEntries.map(([k, v]) => (
                            <LV key={k} label={k} value={(v || 0).toLocaleString()} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: 세션 정보 === */}
                {activeTab === 'session' && (
                  <>
                    {/* 세션 상태 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔌 세션 상태</div>
                      <div className='grid grid-cols-2 gap-3 text-sm'>
                        <LV
                          label='만료 여부'
                          value={
                            expired !== null && expired !== undefined
                              ? expired
                                ? 'Yes'
                                : 'No'
                              : '값 없음'
                          }
                        />
                        <LV
                          label='타임아웃으로 만료'
                          value={
                            expiredByTimeout !== null && expiredByTimeout !== undefined
                              ? expiredByTimeout
                                ? 'Yes'
                                : 'No'
                              : '값 없음'
                          }
                        />
                      </div>
                      {expiredByTimeout === 1 && (
                        <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xl'>⚠️</span>
                            <span className='font-medium'>세션이 타임아웃으로 종료되었습니다</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 시간 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        ⏰ 타임스탬프 상세
                      </div>
                      <div className='grid md:grid-cols-2 gap-4 text-sm'>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>
                            플로우 정보
                          </div>
                          <div className='space-y-2'>
                            <LV label='시작' value={formatTimestamp(tsFirst)} />
                            <LV label='종료' value={formatTimestamp(tsLast)} />
                            {durSec !== null && durSec !== undefined && (
                              <LV
                                label='지속 시간'
                                value={`${formatDuration(durSec)} (${durSec.toFixed(3)}초)`}
                              />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className='text-xs text-gray-500 mb-3 font-semibold'>
                            샘플링 정보
                          </div>
                          <div className='space-y-2'>
                            <LV label='시작' value={formatTimestamp(tsSampleBegin)} />
                            <LV label='종료' value={formatTimestamp(tsSampleEnd)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 프로토콜 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        🔢 프로토콜 정보
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='L2 프로토콜' value={l2Proto} />
                        <LV label='L3 프로토콜' value={l3Proto} />
                        <LV label='L4 프로토콜' value={l4Proto} />
                        <LV label='L4 프로토콜 이름' value={l4ProtoName} />
                        <LV label='L7 프로토콜' value={l7proto} />
                        <LV label='IP 버전' value={ipVersion ? `IPv${ipVersion}` : null} />
                      </div>
                    </div>

                    {/* 애플리케이션 정보 */}
                    {(app || master || sniHostname) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🎯 애플리케이션 정보
                        </div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          <LV label='애플리케이션' value={app} />
                          <LV label='마스터 프로토콜' value={master} />
                          <LV label='SNI Hostname' value={sniHostname} />
                        </div>
                      </div>
                    )}
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

export default EthernetRowPreviewModal
