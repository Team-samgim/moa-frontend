import { memo, useEffect, useRef, useState } from 'react'
import useHttpPageMetrics from '@/hooks/detail/useHttpPageMetrics'

// ===== 유틸리티 함수 =====
const prettyBytes = (n = 0) => {
  if (n === 0) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(n) / Math.log(1024))
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`
}

const emptyValue = (value, defaultText = '값 없음') => {
  if (value === null || value === undefined || value === '') return defaultText
  if (typeof value === 'number' && isNaN(value)) return defaultText
  return value
}

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

const formatMs = (ms) => {
  if (!ms || ms < 0) return '0ms'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// ===== 컴포넌트 =====
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

const Chip = ({ children }) => (
  <span className='rounded-full bg-[#F5F5F7] px-3 py-1 text-xs'>{children}</span>
)

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

  return (
    <div className='fixed inset-0 z-[100]' aria-hidden={!open}>
      {/* overlay */}
      <div className='absolute inset-0 bg-black/40 backdrop-blur-[2px]' onClick={onClose} />

      {/* centered dialog */}
      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='http-page-dialog-title'
          className={[
            'w-full max-w-[960px] max-h-[90vh] overflow-hidden rounded-2xl',
            'border bg-white shadow-2xl flex flex-col',
            'transform transition duration-200 ease-out',
            mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          ].join(' ')}
        >
          {/* header */}
          <div className='flex items-center justify-between border-b px-6 py-4'>
            <div id='http-page-dialog-title' className='text-lg font-semibold'>
              HTTP Page 상세
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
          <div className='px-6 pt-3 border-b flex gap-2 overflow-x-auto'>
            <TabButton id='summary' activeId={activeTab} onClick={setActiveTab}>
              요약
            </TabButton>
            <TabButton id='timing' activeId={activeTab} onClick={setActiveTab}>
              시간 분석
            </TabButton>
            <TabButton id='methods' activeId={activeTab} onClick={setActiveTab}>
              HTTP 메소드
            </TabButton>
            <TabButton id='status' activeId={activeTab} onClick={setActiveTab}>
              응답 코드
            </TabButton>
            <TabButton id='quality' activeId={activeTab} onClick={setActiveTab}>
              TCP 품질
            </TabButton>
            <TabButton id='performance' activeId={activeTab} onClick={setActiveTab}>
              성능
            </TabButton>
            {hasEnv && (
              <TabButton id='geo' activeId={activeTab} onClick={setActiveTab}>
                위치 정보
              </TabButton>
            )}
          </div>

          {/* body */}
          <div className='p-6 space-y-5 overflow-auto flex-1'>
            {/* 로딩/에러/빈 */}
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
                    {/* 페이지 헤더 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='text-sm text-gray-500 mb-1'>HTTP Page</div>
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
                      <div className='mt-2 flex flex-wrap gap-2'>
                        {d.httpMethod && <Chip>Method: {d.httpMethod}</Chip>}
                        {d.httpHost && <Chip>Host: {d.httpHost}</Chip>}
                        {d.httpResCode && <Chip>Status: {d.httpResCode}</Chip>}
                        {d.ndpiProtocolApp && <Chip>App: {d.ndpiProtocolApp}</Chip>}
                        {d.isHttps && <Chip>HTTPS</Chip>}
                      </div>
                    </div>

                    {/* KPI 카드 */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
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
                    </div>

                    {/* HTTP 정보 */}
                    {(d.httpMethod || d.httpUri) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>📋 HTTP 정보</div>
                        <div className='space-y-2'>
                          <LV label='메소드' value={d.httpMethod} />
                          <LV label='URI' value={d.httpUri} />
                          <LV label='Host' value={d.httpHost} />
                          <LV label='응답 코드' value={d.httpResCode} />
                          <LV label='응답 구문' value={d.httpResPhrase} />
                        </div>
                      </div>
                    )}

                    {/* 세션 & 연결 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔌 세션 & 연결</div>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                        <LV label='세션 수' value={(d.pageSessionCnt || 0).toLocaleString()} />
                        <LV label='TCP 연결' value={(d.pageTcpConnectCnt || 0).toLocaleString()} />
                        <LV label='URI 수' value={(d.uriCnt || 0).toLocaleString()} />
                        <LV label='HTTP URI' value={(d.httpUriCnt || 0).toLocaleString()} />
                        <LV label='HTTPS URI' value={(d.httpsUriCnt || 0).toLocaleString()} />
                      </div>
                    </div>
                  </>
                )}

                {/* === Tab: 시간 분석 === */}
                {activeTab === 'timing' && (
                  <>
                    {/* 주요 시간 메트릭 */}
                    <div className='grid grid-cols-3 gap-3'>
                      <div className='rounded-xl border bg-gradient-to-br from-blue-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>페이지 로딩</div>
                        <div className='text-2xl font-bold text-blue-700'>
                          {formatMs((d.timing?.tsPage || 0) * 1000)}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>Total Page Time</div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>응답 초기화</div>
                        <div className='text-2xl font-bold text-emerald-700'>
                          {formatMs((d.timing?.tsPageResInit || 0) * 1000)}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>Response Init</div>
                      </div>
                      <div className='rounded-xl border bg-gradient-to-br from-purple-50 to-white p-4'>
                        <div className='text-xs text-gray-500'>전송 시간</div>
                        <div className='text-2xl font-bold text-purple-700'>
                          {formatMs((d.timing?.tsPageTransferRes || 0) * 1000)}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>Transfer Time</div>
                      </div>
                    </div>

                    {/* 타임라인 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>⏱️ 타임라인</div>
                      <div className='space-y-3 text-sm'>
                        <LV label='페이지 시작' value={formatTimestamp(d.timing?.tsPageBegin)} />
                        <LV label='요청 SYN' value={formatTimestamp(d.timing?.tsPageReqSyn)} />
                        <LV label='응답 초기화' value={formatTimestamp(d.timing?.tsPageResInit)} />
                        <LV label='응답 App' value={formatTimestamp(d.timing?.tsPageResApp)} />
                        <LV label='응답 완료' value={formatTimestamp(d.timing?.tsPageRes)} />
                        <LV label='페이지 종료' value={formatTimestamp(d.timing?.tsPageEnd)} />
                      </div>
                    </div>

                    {/* 시간 상세 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>🔍 시간 상세</div>
                      <div className='grid grid-cols-2 gap-3 text-sm'>
                        <LV label='페이지 갭' value={formatMs((d.timing?.tsPageGap || 0) * 1000)} />
                        <LV
                          label='응답 초기화 갭'
                          value={formatMs((d.timing?.tsPageResInitGap || 0) * 1000)}
                        />
                        <LV
                          label='응답 App 갭'
                          value={formatMs((d.timing?.tsPageResAppGap || 0) * 1000)}
                        />
                        <LV
                          label='응답 갭'
                          value={formatMs((d.timing?.tsPageResGap || 0) * 1000)}
                        />
                        <LV
                          label='요청 전송 갭'
                          value={formatMs((d.timing?.tsPageTransferReqGap || 0) * 1000)}
                        />
                        <LV
                          label='응답 전송 갭'
                          value={formatMs((d.timing?.tsPageTransferResGap || 0) * 1000)}
                        />
                      </div>
                    </div>

                    {/* TCP 연결 시간 */}
                    {d.timing?.tsPageTcpConnectAvg && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🔌 TCP 연결 시간
                        </div>
                        <div className='grid grid-cols-3 gap-3 text-sm'>
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
                  </>
                )}

                {/* === Tab: HTTP 메소드 === */}
                {activeTab === 'methods' && (
                  <>
                    {/* HTTP 메소드 통계 */}
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

                    {/* 메소드 에러 */}
                    {d.methods?.hasErrors && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          ⚠️ 메소드 에러
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
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: 응답 코드 === */}
                {activeTab === 'status' && (
                  <>
                    {/* 응답 코드 분포 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📊 응답 코드 분포
                      </div>
                      <div className='space-y-2'>
                        {d.statusCodes?.code1xxCnt > 0 && (
                          <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                            <span className='text-sm'>1xx (정보)</span>
                            <Badge level='ok'>{d.statusCodes.code1xxCnt}</Badge>
                          </div>
                        )}
                        {d.statusCodes?.code2xxCnt > 0 && (
                          <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg'>
                            <span className='text-sm'>2xx (성공)</span>
                            <Badge level='ok'>{d.statusCodes.code2xxCnt}</Badge>
                          </div>
                        )}
                        {d.statusCodes?.code3xxCnt > 0 && (
                          <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
                            <span className='text-sm'>3xx (리다이렉트)</span>
                            <Badge level='ok'>{d.statusCodes.code3xxCnt}</Badge>
                          </div>
                        )}
                        {d.statusCodes?.code4xxCnt > 0 && (
                          <div className='flex items-center justify-between p-3 bg-amber-50 rounded-lg'>
                            <span className='text-sm'>4xx (클라이언트 에러)</span>
                            <Badge level='warn'>{d.statusCodes.code4xxCnt}</Badge>
                          </div>
                        )}
                        {d.statusCodes?.code5xxCnt > 0 && (
                          <div className='flex items-center justify-between p-3 bg-red-50 rounded-lg'>
                            <span className='text-sm'>5xx (서버 에러)</span>
                            <Badge level='crit'>{d.statusCodes.code5xxCnt}</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 특정 코드 */}
                    {(d.statusCodes?.code304Cnt > 0 ||
                      d.statusCodes?.code401Cnt > 0 ||
                      d.statusCodes?.code403Cnt > 0 ||
                      d.statusCodes?.code404Cnt > 0) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🔍 특정 응답 코드
                        </div>
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          {d.statusCodes.code304Cnt > 0 && (
                            <Row label='304 (Not Modified)' value={d.statusCodes.code304Cnt} />
                          )}
                          {d.statusCodes.code401Cnt > 0 && (
                            <Row label='401 (Unauthorized)' value={d.statusCodes.code401Cnt} />
                          )}
                          {d.statusCodes.code403Cnt > 0 && (
                            <Row label='403 (Forbidden)' value={d.statusCodes.code403Cnt} />
                          )}
                          {d.statusCodes.code404Cnt > 0 && (
                            <Row label='404 (Not Found)' value={d.statusCodes.code404Cnt} />
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: TCP 품질 === */}
                {activeTab === 'quality' && (
                  <>
                    {/* TCP 에러 요약 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📊 TCP 에러 요약
                      </div>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                        <div className='bg-blue-50 p-3 rounded-lg'>
                          <div className='text-xs text-gray-500'>총 에러</div>
                          <div className='text-lg font-bold text-blue-700'>
                            {d.tcpQuality?.tcpErrorCnt || 0}
                          </div>
                        </div>
                        <div className='bg-orange-50 p-3 rounded-lg'>
                          <div className='text-xs text-gray-500'>재전송</div>
                          <div className='text-lg font-bold text-orange-700'>
                            {d.tcpQuality?.retransmissionCnt || 0}
                          </div>
                        </div>
                        <div className='bg-purple-50 p-3 rounded-lg'>
                          <div className='text-xs text-gray-500'>순서 오류</div>
                          <div className='text-lg font-bold text-purple-700'>
                            {d.tcpQuality?.outOfOrderCnt || 0}
                          </div>
                        </div>
                        <div className='bg-red-50 p-3 rounded-lg'>
                          <div className='text-xs text-gray-500'>패킷 손실</div>
                          <div className='text-lg font-bold text-red-700'>
                            {d.tcpQuality?.lostSegCnt || 0}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 재전송 상세 */}
                    {d.tcpQuality?.retransmissionCnt > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>🔄 재전송</div>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
                          <LV
                            label='총 재전송'
                            value={(d.tcpQuality.retransmissionCnt || 0).toLocaleString()}
                          />
                          <LV
                            label='요청'
                            value={(d.tcpQuality.retransmissionCntReq || 0).toLocaleString()}
                          />
                          <LV
                            label='응답'
                            value={(d.tcpQuality.retransmissionCntRes || 0).toLocaleString()}
                          />
                          <LV
                            label='바이트'
                            value={prettyBytes(d.tcpQuality.retransmissionLen || 0)}
                          />
                        </div>
                      </div>
                    )}

                    {/* 연결 에러 */}
                    {d.tcpQuality?.connErrSessionCnt > 0 && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>⚠️ 연결 에러</div>
                        <div className='grid grid-cols-2 gap-3 text-sm'>
                          <LV label='에러 세션' value={d.tcpQuality.connErrSessionCnt} />
                          <LV label='에러 패킷' value={d.tcpQuality.connErrPktCnt} />
                        </div>
                      </div>
                    )}

                    {/* 트랜잭션 상태 */}
                    {(d.tcpQuality?.stoppedTransactionCnt > 0 ||
                      d.tcpQuality?.incompleteCnt > 0 ||
                      d.tcpQuality?.timeoutCnt > 0) && (
                      <div className='rounded-xl border bg-white p-4'>
                        <div className='mb-3 text-sm font-semibold text-gray-800'>
                          🚫 트랜잭션 상태
                        </div>
                        <div className='grid grid-cols-3 gap-3 text-sm'>
                          <LV label='중단됨' value={d.tcpQuality.stoppedTransactionCnt || 0} />
                          <LV label='불완전' value={d.tcpQuality.incompleteCnt || 0} />
                          <LV label='타임아웃' value={d.tcpQuality.timeoutCnt || 0} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* === Tab: 성능 === */}
                {activeTab === 'performance' && (
                  <>
                    {/* Mbps */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📊 대역폭 (Mbps)
                      </div>
                      <div className='grid grid-cols-3 gap-3 mb-3'>
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

                    {/* PPS */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📦 패킷 속도 (PPS)
                      </div>
                      <div className='grid grid-cols-3 gap-3 mb-3'>
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

                    {/* 트래픽 통계 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>📈 트래픽 통계</div>
                      <div className='grid grid-cols-3 gap-3 text-sm'>
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>전체</div>
                          <LV label='HTTP' value={prettyBytes(d.traffic?.pageHttpLen || 0)} />
                          <LV label='패킷' value={prettyBytes(d.traffic?.pagePktLen || 0)} />
                          <LV label='TCP' value={prettyBytes(d.traffic?.pageTcpLen || 0)} />
                        </div>
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>요청</div>
                          <LV label='HTTP' value={prettyBytes(d.traffic?.pageHttpLenReq || 0)} />
                          <LV label='패킷' value={prettyBytes(d.traffic?.pagePktLenReq || 0)} />
                          <LV label='TCP' value={prettyBytes(d.traffic?.pageTcpLenReq || 0)} />
                        </div>
                        <div>
                          <div className='text-xs text-gray-500 mb-2'>응답</div>
                          <LV label='HTTP' value={prettyBytes(d.traffic?.pageHttpLenRes || 0)} />
                          <LV label='패킷' value={prettyBytes(d.traffic?.pagePktLenRes || 0)} />
                          <LV label='TCP' value={prettyBytes(d.traffic?.pageTcpLenRes || 0)} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* === Tab: 위치 정보 === */}
                {activeTab === 'geo' && hasEnv && (
                  <div className='grid md:grid-cols-2 gap-4'>
                    {/* 출발지 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📍 출발지 (요청)
                      </div>
                      <div className='space-y-2 text-sm'>
                        <LV label='국가' value={d.env?.countryReq} />
                        <LV label='대륙' value={d.env?.continentReq} />
                        <LV label='시/도' value={d.env?.domesticPrimaryReq} />
                        <LV label='시/군/구' value={d.env?.domesticSub1Req} />
                        <LV label='읍/면/동' value={d.env?.domesticSub2Req} />
                      </div>
                    </div>

                    {/* 목적지 */}
                    <div className='rounded-xl border bg-white p-4'>
                      <div className='mb-3 text-sm font-semibold text-gray-800'>
                        📍 목적지 (응답)
                      </div>
                      <div className='space-y-2 text-sm'>
                        <LV label='국가' value={d.env?.countryRes} />
                        <LV label='대륙' value={d.env?.continentRes} />
                        <LV label='시/도' value={d.env?.domesticPrimaryRes} />
                        <LV label='시/군/구' value={d.env?.domesticSub1Res} />
                        <LV label='읍/면/동' value={d.env?.domesticSub2Res} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className='text-xs text-gray-400 pt-4 border-t'>
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
