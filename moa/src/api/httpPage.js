import axiosInstance from '@/api/axios'

export async function getHttpPageMetrics(rowKey, { signal } = {}) {
  if (!rowKey) {
    throw new Error('rowKey가 없습니다.')
  }

  try {
    const res = await axiosInstance.get(`/details/http-page/${encodeURIComponent(rowKey)}`, {
      signal,
    })

    // 404는 null
    if (res.status === 204 || res.data === null) return null

    return normalizeHttpPageMetrics(res.data)
  } catch (e) {
    if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') throw e
    if (e.response && e.response.status === 404) return null
    throw e
  }
}

/**
 * 한글 인코딩 깨짐 필터링 헬퍼
 *
 * DB에서 인코딩이 깨진 값(���� 같은 패턴)이 올 경우 null로 처리
 */
function cleanBrokenEncoding(value) {
  if (!value || typeof value !== 'string') return null

  // 깨진 인코딩 패턴 감지
  // \uFFFD: Unicode Replacement Character (�)
  // 연속된 ���� 패턴도 감지
  const brokenPattern = /[\uFFFD�]{2,}/g

  if (brokenPattern.test(value)) {
    console.warn('🔧 Broken encoding detected and filtered:', value)
    return null // 깨진 값은 null로 처리 → LV 컴포넌트에서 "값 없음" 표시
  }

  // 정상 값은 그대로 반환 (trim 처리)
  return value.trim() || null
}

/**
 * 백엔드 raw 응답 → 모달에서 쓰기 좋은 형태로 정규화
 */
function normalizeHttpPageMetrics(raw) {
  if (!raw) return null

  // 1) HTTP 상태 코드: 문자열 → 숫자
  const httpStatus =
    raw.httpResCode !== null && Number.isFinite(Number(raw.httpResCode))
      ? Number(raw.httpResCode)
      : null

  // 2) methods: 백엔드에서 hasErrors 안 줄 수도 있으니 한 번 더 보정
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

  // 3) TCP 품질 파생값
  const tcpQuality = raw.tcpQuality
    ? {
        ...raw.tcpQuality,
        // 총 세션 수는 상위 pageSessionCnt 그대로 노출
        tcpSessionCnt: raw.pageSessionCnt ?? null,
        // 에러 세션 수는 connErrSessionCnt 사용 (이게 더 의미에 맞음)
        tcpErrorSessionCnt: raw.tcpQuality.connErrSessionCnt ?? null,
      }
    : undefined

  // 4) Environment (지리 정보) - 깨진 인코딩 필터링 ✅
  const env = raw.env
    ? {
        // 국가/대륙: 깨진 값이면 기본값(South Korea/Asia) 적용
        countryReq: cleanBrokenEncoding(raw.env.countryReq) || 'South Korea',
        countryRes: cleanBrokenEncoding(raw.env.countryRes) || 'South Korea',
        continentReq: cleanBrokenEncoding(raw.env.continentReq) || 'Asia',
        continentRes: cleanBrokenEncoding(raw.env.continentRes) || 'Asia',
        // 시/도/군/구: 깨진 값이면 null (LV 컴포넌트에서 "값 없음" 표시)
        domesticPrimaryReq: cleanBrokenEncoding(raw.env.domesticPrimaryReq),
        domesticPrimaryRes: cleanBrokenEncoding(raw.env.domesticPrimaryRes),
        domesticSub1Req: cleanBrokenEncoding(raw.env.domesticSub1Req),
        domesticSub1Res: cleanBrokenEncoding(raw.env.domesticSub1Res),
        domesticSub2Req: cleanBrokenEncoding(raw.env.domesticSub2Req),
        domesticSub2Res: cleanBrokenEncoding(raw.env.domesticSub2Res),
      }
    : undefined

  // 5) 지연 요약 빌더
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
      {
        key: 'client',
        label: '클라이언트 요청 준비',
        value: tsPageReqMakingAvg ?? 0,
      },
      {
        key: 'tcp',
        label: 'TCP 연결',
        value: tsPageTcpConnectAvg ?? 0,
      },
      {
        key: 'server',
        label: '서버 처리(TTFB)',
        value: tsPageResInit ?? 0,
      },
      {
        key: 'transfer',
        label: '응답 전송',
        value: tsPageTransferRes ?? 0,
      },
    ]

    const nonZero = segments.filter((s) => s.value && s.value > 0)
    if (!nonZero.length) return null

    const dominant = nonZero.reduce((max, s) => (s.value > max.value ? s : max), nonZero[0])

    const dominantRatio = total > 0 ? dominant.value / total : null

    return {
      total, // 전체 페이지 시간(초)
      segments, // 각 구간별 시간(초)
      dominantKey: dominant.key,
      dominantLabel: dominant.label,
      dominantValue: dominant.value,
      dominantRatio, // 전체 중 이 구간이 차지하는 비율(0~1)
    }
  }

  // 6) timing 안에서 값 꺼내서 지연 요약 계산
  const delaySummary = raw.timing
    ? buildDelaySummary({
        tsPage: raw.timing.tsPage,
        tsPageReqMakingAvg: raw.timing.tsPageReqMakingAvg,
        tsPageTcpConnectAvg: raw.timing.tsPageTcpConnectAvg,
        tsPageResInit: raw.timing.tsPageResInit,
        tsPageTransferRes: raw.timing.tsPageTransferRes,
      })
    : null

  // 7) 최종 반환: 나머지 필드는 그대로 두고 필요한 것만 덮어쓰기
  return {
    ...raw,
    httpStatus, // 숫자 상태 코드
    isHttps: !!raw.isHttps, // 혹시 null/0/1 들어와도 boolean으로 강제
    methods,
    tcpQuality,
    env, // ✅ 깨진 인코딩 필터링된 env
    delaySummary, // ✅ 지연 요약 추가
  }
}
