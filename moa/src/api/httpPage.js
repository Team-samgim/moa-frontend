/**
 * HTTP Page Metrics API 모듈
 *
 * 기능:
 * - 특정 rowKey에 대한 HTTP 상세 메트릭 조회
 * - 한글 인코딩 깨짐 필터링
 * - 모달에서 활용하기 좋은 형태로 후처리(normalization)
 *
 * AUTHOR        : 방대혁
 */

import axiosInstance from '@/api/axios'

/* ------------------------------------------------------------------
 * HTTP 페이지 메트릭 조회
 *
 * 요청: GET /details/http-page/{rowKey}
 *
 * 동작:
 *  - rowKey는 필수
 *  - 404 → null (데이터 없음)
 *  - 정상 응답은 normalizeHttpPageMetrics로 가공하여 반환
 *  - 취소된 요청은 그대로 throw해서 react-query가 처리
 *
 * 반환 형식 예:
 *  {
 *    httpStatus,
 *    methods: {...},
 *    tcpQuality: {...},
 *    env: {...},          // 인코딩 정리 완료
 *    delaySummary: {...}, // 지연 구간 분석
 *    ...raw
 *  }
 * ------------------------------------------------------------------ */
export async function getHttpPageMetrics(rowKey, { signal } = {}) {
  if (!rowKey) {
    throw new Error('rowKey가 없습니다.')
  }

  try {
    const res = await axiosInstance.get(`/details/http-page/${encodeURIComponent(rowKey)}`, {
      signal,
    })

    // 204 또는 null → 데이터 없음
    if (res.status === 204 || res.data === null) return null

    return normalizeHttpPageMetrics(res.data)
  } catch (e) {
    // react-query 요청 취소
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') throw e

    if (e.response && e.response.status === 404) return null
    throw e
  }
}

/* ------------------------------------------------------------------
 * 인코딩 깨짐 필터링
 *
 * DB에서 깨진 인코딩(���� / � / U+FFFD 등)이 들어올 수 있어
 * 이를 null 처리하여 UI에서 "값 없음" 또는 기본값 사용하도록 함.
 * ------------------------------------------------------------------ */
function cleanBrokenEncoding(value) {
  if (!value || typeof value !== 'string') return null

  // Unicode Replacement Character(�) 연속 패턴 감지
  const brokenPattern = /[\uFFFD�]{2,}/g

  if (brokenPattern.test(value)) {
    console.warn('🔧 Broken encoding detected and filtered:', value)
    return null
  }

  return value.trim() || null
}

/* ------------------------------------------------------------------
 * 백엔드 raw 응답 → 모달 표시용 데이터로 정규화
 *
 * 다루는 항목:
 *  - httpStatus: string → number
 *  - methods: hasErrors 보정
 *  - tcpQuality: 세션 정보 보정
 *  - env: 인코딩 깨짐 필터링
 *  - delaySummary: 페이지 지연 구간 분석
 * ------------------------------------------------------------------ */
function normalizeHttpPageMetrics(raw) {
  if (!raw) return null

  /* -----------------------------
   * 1) HTTP 상태 코드 숫자화
   * --------------------------- */
  const httpStatus =
    raw.httpResCode !== null && Number.isFinite(Number(raw.httpResCode))
      ? Number(raw.httpResCode)
      : null

  /* -----------------------------
   * 2) methods: hasErrors 보정
   * --------------------------- */
  const methods = raw.methods
    ? {
        ...raw.methods,
        hasErrors:
          raw.methods.hasErrors ??
          [
            raw.methods.getCntError,
            raw.methods.postCntError,
            raw.methods.putCntError,
            raw.methods.deleteCntError,
            raw.methods.headCntError,
            raw.methods.optionsCntError,
            raw.methods.patchCntError,
            raw.methods.traceCntError,
            raw.methods.connectCntError,
            raw.methods.othCntError,
          ]
            .filter((v) => v !== null && v !== undefined)
            .some((v) => v > 0),
      }
    : undefined

  /* -----------------------------
   * 3) TCP 품질 보정
   * --------------------------- */
  const tcpQuality = raw.tcpQuality
    ? {
        ...raw.tcpQuality,
        tcpSessionCnt: raw.pageSessionCnt ?? null,
        tcpErrorSessionCnt: raw.tcpQuality.connErrSessionCnt ?? null,
      }
    : undefined

  /* -----------------------------
   * 4) 위치 정보(env) 정규화
   * --------------------------- */
  const env = raw.env
    ? {
        // 국가/대륙: 깨짐 → 기본값
        countryReq: cleanBrokenEncoding(raw.env.countryReq) || 'South Korea',
        countryRes: cleanBrokenEncoding(raw.env.countryRes) || 'South Korea',
        continentReq: cleanBrokenEncoding(raw.env.continentReq) || 'Asia',
        continentRes: cleanBrokenEncoding(raw.env.continentRes) || 'Asia',

        // 시·도·군·구: 깨짐 → null
        domesticPrimaryReq: cleanBrokenEncoding(raw.env.domesticPrimaryReq),
        domesticPrimaryRes: cleanBrokenEncoding(raw.env.domesticPrimaryRes),
        domesticSub1Req: cleanBrokenEncoding(raw.env.domesticSub1Req),
        domesticSub1Res: cleanBrokenEncoding(raw.env.domesticSub1Res),
        domesticSub2Req: cleanBrokenEncoding(raw.env.domesticSub2Req),
        domesticSub2Res: cleanBrokenEncoding(raw.env.domesticSub2Res),
      }
    : undefined

  /* -----------------------------
   * 5) 지연 구간 분석(Delay Summary)
   * --------------------------- */
  const delaySummary = raw.timing
    ? buildDelaySummary({
        tsPage: raw.timing.tsPage,
        tsPageReqMakingAvg: raw.timing.tsPageReqMakingAvg,
        tsPageTcpConnectAvg: raw.timing.tsPageTcpConnectAvg,
        tsPageResInit: raw.timing.tsPageResInit,
        tsPageTransferRes: raw.timing.tsPageTransferRes,
      })
    : null

  /* -----------------------------
   * 최종 반환
   * --------------------------- */
  return {
    ...raw,
    httpStatus,
    isHttps: !!raw.isHttps,
    methods,
    tcpQuality,
    env,
    delaySummary,
  }
}

/* ------------------------------------------------------------------
 * 지연(Delay) 구간 요약 생성
 *  - Client Ready / TCP Connect / Server Init(TTFB) / Transfer
 *  - 가장 지연이 큰 구간(dominant) 계산
 * ------------------------------------------------------------------ */
function buildDelaySummary({
  tsPage,
  tsPageReqMakingAvg,
  tsPageTcpConnectAvg,
  tsPageResInit,
  tsPageTransferRes,
}) {
  const total = tsPage ?? null
  if (!total || total <= 0) return null

  const segments = [
    { key: 'client', label: '클라이언트 요청 준비', value: tsPageReqMakingAvg ?? 0 },
    { key: 'tcp', label: 'TCP 연결', value: tsPageTcpConnectAvg ?? 0 },
    { key: 'server', label: '서버 처리(TTFB)', value: tsPageResInit ?? 0 },
    { key: 'transfer', label: '응답 전송', value: tsPageTransferRes ?? 0 },
  ]

  const nonZero = segments.filter((s) => s.value && s.value > 0)
  if (!nonZero.length) return null

  const dominant = nonZero.reduce((prev, cur) => (cur.value > prev.value ? cur : prev), nonZero[0])

  return {
    total,
    segments,
    dominantKey: dominant.key,
    dominantLabel: dominant.label,
    dominantValue: dominant.value,
    dominantRatio: dominant.value / total,
  }
}
