import { memo, useEffect, useState } from 'react'
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

// 🆕 초 → 읽기 쉬운 문자열
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

// ===== 컴포넌트 =====
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

// 🆕 빈 값 처리가 추가된 LV 컴포넌트
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

const diagLevel = (msg = '') => (msg && msg.includes('crit') ? 'crit' : 'warn')

const EthernetRowPreviewModal = memo(function EthernetRowPreviewModal({ open, onClose, rowKey }) {
  const q = useEthernetMetrics(rowKey)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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

  // 🆕 환경 정보가 있는지 확인
  const hasEnv =
    env &&
    (env.countryReq ||
      env.countryRes ||
      env.domesticPrimaryReq ||
      env.domesticPrimaryRes ||
      env.sensorDeviceName)

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div
        role='dialog'
        aria-modal='true'
        className='relative w-[min(96vw,960px)] max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col'
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b px-5 py-3'>
          <div>
            <h2 className='text-base font-semibold'>Ethernet Flow 상세</h2>
            {flowIdentifier && (
              <p className='text-xs text-gray-500 mt-0.5 font-mono'>{flowIdentifier}</p>
            )}
          </div>
          <button
            className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50'
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {/* Tabs */}
        <div className='px-5 pt-3 border-b flex gap-2 overflow-x-auto'>
          <TabButton id='summary' activeId={activeTab} onClick={setActiveTab}>
            요약
          </TabButton>
          <TabButton id='errors' activeId={activeTab} onClick={setActiveTab}>
            품질 / 에러
          </TabButton>
          <TabButton id='session' activeId={activeTab} onClick={setActiveTab}>
            세션 정보
          </TabButton>
          {hasEnv && (
            <TabButton id='geo' activeId={activeTab} onClick={setActiveTab}>
              위치 정보
            </TabButton>
          )}
        </div>

        {/* Body */}
        <div className='p-5 space-y-5 overflow-y-auto flex-1'>
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
                  {/* 연결 정보 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='text-sm text-gray-500 mb-2'>연결 정보</div>
                    <div className='space-y-2'>
                      <div className='text-[15px] font-semibold'>
                        {emptyValue(srcMac)} <span className='text-gray-400'>→</span>{' '}
                        {emptyValue(dstMac)}
                      </div>
                      {(srcIp || dstIp) && (
                        <div className='text-sm'>
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
                    </div>

                    {/* 프로토콜 칩들 */}
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {ipVersion && <Chip>IPv{ipVersion}</Chip>}
                      {l4ProtoName ? (
                        <Chip>{l4ProtoName}</Chip>
                      ) : l4Proto ? (
                        <Chip>L4: {l4Proto}</Chip>
                      ) : (
                        <Chip className='text-gray-400 italic'>L4: 값 없음</Chip>
                      )}
                      {app && <Chip>App: {app}</Chip>}
                      {master && <Chip>Master: {master}</Chip>}
                      {sniHostname && <Chip>SNI: {sniHostname}</Chip>}
                    </div>
                  </div>

                  {/* 🆕 시간 정보 */}
                  {(tsFirst || tsLast || tsSampleBegin || durSec) && (
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-sm font-semibold text-gray-800 mb-3'>⏱️ 시간 정보</div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                        <LV label='플로우 시작' value={formatTimestamp(tsFirst)} />
                        <LV label='플로우 종료' value={formatTimestamp(tsLast)} />
                        <LV label='샘플링 시작' value={formatTimestamp(tsSampleBegin)} />
                        <LV label='샘플링 종료' value={formatTimestamp(tsSampleEnd)} />
                        {durSec !== null && durSec !== undefined && (
                          <LV label='지속 시간' value={formatDuration(durSec)} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* KPI 카드 */}
                  <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                    <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                      <div className='text-xs text-gray-500'>평균 처리량</div>
                      <div className='text-lg font-bold text-blue-700'>{mbps.toFixed(2)} Mbps</div>
                    </div>
                    <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                      <div className='text-xs text-gray-500'>총 데이터</div>
                      <div className='text-lg font-bold text-emerald-700'>{prettyBytes(bytes)}</div>
                      <div className='text-xs text-gray-500 mt-1'>
                        Req: {prettyBytes(bytesReq)} / Res: {prettyBytes(bytesRes)}
                      </div>
                    </div>
                    <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                      <div className='text-xs text-gray-500'>총 프레임</div>
                      <div className='text-lg font-bold text-purple-700'>
                        {(frames || 0).toLocaleString()}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        Req: {(framesReq || 0).toLocaleString()} / Res:{' '}
                        {(framesRes || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className='rounded-xl border bg-gradient-to-br from-amber-50 to-white p-4'>
                      <div className='text-xs text-gray-500'>CRC 에러</div>
                      <div className='text-lg font-bold text-amber-700'>
                        {(crcErrorCnt || 0).toLocaleString()}
                      </div>
                      {crcErrorRateFrames > 0 && (
                        <div className='text-xs text-amber-600 mt-1'>
                          에러율: {(crcErrorRateFrames * 100).toFixed(3)}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 진단 메시지 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-3 text-sm font-semibold text-gray-800'>🔍 진단 메시지</div>
                    {diagEntries.length === 0 ? (
                      <div className='text-sm text-gray-400 italic py-2'>특이사항 없음</div>
                    ) : (
                      <ul className='space-y-2'>
                        {diagEntries.map(([k, msg]) => (
                          <li
                            key={k}
                            className='flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm'
                          >
                            <Badge level={diagLevel(msg)}>{k}</Badge>
                            <span className='text-gray-700'>{msg}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              {/* === Tab: 품질/에러 === */}
              {activeTab === 'errors' && (
                <>
                  {/* CRC 에러 상세 */}
                  {crcErrorCnt > 0 ? (
                    <div className='rounded-xl border bg-red-50 p-4'>
                      <div className='mb-3 text-sm font-semibold text-red-800'>⚠️ CRC 에러</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                        <div className='bg-white rounded-lg p-3'>
                          <LV label='총 에러' value={(crcErrorCnt || 0).toLocaleString()} />
                          <Badge level='crit'>{pct(rate(crcErrorCnt))}</Badge>
                        </div>
                        <div className='bg-white rounded-lg p-3'>
                          <LV label='요청 에러' value={(crcErrorCntReq || 0).toLocaleString()} />
                          <Badge level={levelByRate(rate(crcErrorCntReq))}>
                            {pct(rate(crcErrorCntReq))}
                          </Badge>
                        </div>
                        <div className='bg-white rounded-lg p-3'>
                          <LV label='응답 에러' value={(crcErrorCntRes || 0).toLocaleString()} />
                          <Badge level={levelByRate(rate(crcErrorCntRes))}>
                            {pct(rate(crcErrorCntRes))}
                          </Badge>
                        </div>
                        {(crcErrorLen || crcErrorLenReq || crcErrorLenRes) && (
                          <>
                            <div className='bg-white rounded-lg p-3'>
                              <LV label='에러 데이터' value={prettyBytes(crcErrorLen)} />
                            </div>
                            <div className='bg-white rounded-lg p-3'>
                              <LV label='요청 에러 데이터' value={prettyBytes(crcErrorLenReq)} />
                            </div>
                            <div className='bg-white rounded-lg p-3'>
                              <LV label='응답 에러 데이터' value={prettyBytes(crcErrorLenRes)} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='rounded-xl border bg-emerald-50 p-4'>
                      <div className='text-sm text-emerald-800'>
                        ✅ CRC 에러 없음 - 정상 상태입니다
                      </div>
                    </div>
                  )}

                  {/* 패킷 크기 통계 */}
                  {packetStats && (
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📊 패킷 크기 통계
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>요청 방향</div>
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
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>응답 방향</div>
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
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📈 전체 카운터</div>
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
                      <div className='mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800'>
                        ⚠️ 세션이 타임아웃으로 종료되었습니다
                      </div>
                    )}
                  </div>

                  {/* 시간 상세 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-3 text-sm font-semibold text-gray-800'>
                      ⏰ 타임스탬프 상세
                    </div>
                    <div className='space-y-2 text-sm'>
                      <LV label='플로우 시작' value={formatTimestamp(tsFirst)} />
                      <LV label='플로우 종료' value={formatTimestamp(tsLast)} />
                      <LV label='샘플링 시작' value={formatTimestamp(tsSampleBegin)} />
                      <LV label='샘플링 종료' value={formatTimestamp(tsSampleEnd)} />
                      {durSec !== null && durSec !== undefined && (
                        <LV
                          label='지속 시간'
                          value={`${formatDuration(durSec)} (${durSec.toFixed(3)}초)`}
                        />
                      )}
                    </div>
                  </div>

                  {/* 프로토콜 상세 */}
                  <div className='rounded-xl border bg-white p-4'>
                    <div className='mb-3 text-sm font-semibold text-gray-800'>🔢 프로토콜 정보</div>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                      <LV label='L2 프로토콜' value={l2Proto} />
                      <LV label='L3 프로토콜' value={l3Proto} />
                      <LV label='L4 프로토콜' value={l4Proto} />
                      <LV label='L4 프로토콜 이름' value={l4ProtoName} />
                      <LV label='L7 프로토콜' value={l7proto} />
                      <LV label='IP 버전' value={ipVersion ? `IPv${ipVersion}` : null} />
                    </div>
                  </div>
                </>
              )}

              {/* === Tab: 위치 정보 === */}
              {activeTab === 'geo' && hasEnv && (
                <>
                  <div className='grid md:grid-cols-2 gap-4'>
                    {/* 출발지 위치 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📍 출발지 (요청)
                      </div>
                      <div className='space-y-2 text-sm'>
                        <LV label='국가' value={env?.countryReq} />
                        <LV label='대륙' value={env?.continentReq} />
                        <LV label='시/도' value={env?.domesticPrimaryReq} />
                        <LV label='시/군/구' value={env?.domesticSub1Req} />
                        <LV label='읍/면/동' value={env?.domesticSub2Req} />
                      </div>
                    </div>

                    {/* 목적지 위치 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📍 목적지 (응답)
                      </div>
                      <div className='space-y-2 text-sm'>
                        <LV label='국가' value={env?.countryRes} />
                        <LV label='대륙' value={env?.continentRes} />
                        <LV label='시/도' value={env?.domesticPrimaryRes} />
                        <LV label='시/군/구' value={env?.domesticSub1Res} />
                        <LV label='읍/면/동' value={env?.domesticSub2Res} />
                      </div>
                    </div>
                  </div>

                  {/* 센서 정보 */}
                  {env?.sensorDeviceName && (
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🖥️ 센서 정보</div>
                      <LV label='센서 장치명' value={env.sensorDeviceName} />
                    </div>
                  )}
                </>
              )}

              {/* Footer - rowKey */}
              <div className='text-xs text-gray-400 pt-4 border-t'>
                <span className='font-mono'>rowKey: {emptyValue(_rk)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export default EthernetRowPreviewModal
