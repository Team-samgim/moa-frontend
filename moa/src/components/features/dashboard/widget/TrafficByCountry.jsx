/**
 * 작성자: 정소영
 */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import world from 'echarts-countries-js/echarts-countries-js/world.js'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'
import { useDashboardStore } from '@/stores/dashboardStore'

// 세계 지도 GeoJSON 등록 (중복 등록 방지)
if (!echarts.getMap('world')) {
  echarts.registerMap('world', world)
}

const WINDOW_MS = 60 * 60 * 1000 // 1시간 슬라이딩 윈도우

// 국가명 매핑 (SSE 데이터의 국가명을 지도 국가명으로 변환)
const COUNTRY_NAME_MAP = {
  'South Korea': 'South Korea',
  Korea: 'South Korea',
  'United States': 'United States of America',
  USA: 'United States of America',
  US: 'United States of America',
  // 필요시 추가 매핑
}

const GeoTrafficDistribution = ({ onClose }) => {
  const chartRef = useRef(null)
  const [trafficDataPoints, setTrafficDataPoints] = useState([]) // 시간별 트래픽 데이터 포인트
  const [isInitialized, setIsInitialized] = useState(false) // DB 데이터 로드 완료

  // 1. DB에서 초기 데이터 로드
  const { data: dbData, isLoading, error } = useDashboardAggregated()

  // 2. SSE 실시간 데이터
  const realtimeData = useDashboardStore((state) => state.realtimeData)
  const isConnected = useDashboardStore((state) => state.isWebSocketConnected)

  // 3. 초기 DB 데이터 로드
  useEffect(() => {
    if (!isLoading && dbData?.trafficByCountry && !isInitialized) {
      // 실제 timestamp 사용 (백엔드에서 제공)
      const now = Date.now()
      const points = dbData.trafficByCountry.flatMap((item) => {
        // 요청 건수만큼 포인트 생성
        const count = Math.min(item.requestCount ?? 1, 100)

        // 백엔드에서 timestamp가 오면 사용, 없으면 현재 시간
        const baseTimestamp = item.timestamp ? new Date(item.timestamp).getTime() : now

        return Array(count)
          .fill(null)
          .map((_, idx) => ({
            // 실제 timestamp 사용 (같은 시간대 데이터는 약간의 오프셋만 추가)
            timestamp: baseTimestamp + idx,
            country: normalizeCountryName(item.country),
            responseTime: item.avgResponseTime ?? 0,
          }))
      })

      setTrafficDataPoints(points)
      setIsInitialized(true)
    }
  }, [dbData, isLoading, isInitialized])

  // 4. SSE 연결되면 실시간 데이터 추가
  useEffect(() => {
    if (!isConnected || !isInitialized) {
      return
    }

    if (realtimeData.length === 0) {
      return
    }

    // ⚠️ 실제 SSE 데이터 구조 확인용 로그 (필드명 확인 후 제거 가능)
    // if (realtimeData.length > 0) {
    //   const sample = realtimeData[0]
    //   console.log('📦 [GeoTrafficDistribution] 첫 번째 실시간 데이터 샘플:', {
    //     countryNameReq: sample.countryNameReq,
    //     countryNameRes: sample.countryNameRes,
    //     country: sample.country,
    //     geoCountry: sample.geoCountry,
    //     tsPage: sample.tsPage,
    //     responseTime: sample.responseTime,
    //     avgResponseTime: sample.avgResponseTime,
    //   })
    // }

    setTrafficDataPoints((prev) => {
      // 실시간 데이터를 포인트로 변환
      // ⚠️ 실제 SSE 데이터 필드명: countryNameReq (요청 국가), tsPage (페이지 로드 시간, 초 단위)
      const newPoints = realtimeData
        .map((item) => {
          // 국가 필드 확인: countryNameReq (요청 국가, 우선), countryNameRes, country, geoCountry (fallback)
          const country =
            normalizeCountryName(
              item.countryNameReq || item.countryNameRes || item.country || item.geoCountry,
            ) || 'Unknown'

          // 응답 시간 필드 확인: tsPage (페이지 로드 시간, 초 단위) 또는 responseTime
          const responseTime = item.tsPage || item.responseTime || item.avgResponseTime || 0

          return {
            // 실제 timestamp 사용
            timestamp: new Date(item.tsServer || new Date()).getTime(),
            country,
            responseTime,
          }
        })
        .filter((p) => p.country && p.country !== 'Unknown') // Unknown 제외

      // 기존 데이터와 병합
      const combined = [...prev, ...newPoints]

      // 1시간 이내 데이터만 유지 (슬라이딩 윈도우)
      const cutoff = Date.now() - WINDOW_MS
      return combined.filter((p) => p.timestamp >= cutoff)
    })
  }, [realtimeData, isConnected, isInitialized])

  // 5. 국가별로 집계된 데이터 계산
  const { mapped, unknown, maxValue } = useMemo(() => {
    if (trafficDataPoints.length === 0) {
      return { mapped: [], unknown: null, maxValue: 0 }
    }

    // 국가별로 그룹화
    const countryMap = new Map()

    trafficDataPoints.forEach((point) => {
      const country = point.country
      const existing = countryMap.get(country)

      if (existing) {
        existing.requestCount += 1
        existing.totalResponseTime += point.responseTime
      } else {
        countryMap.set(country, {
          country,
          requestCount: 1,
          totalResponseTime: point.responseTime,
        })
      }
    })

    // 평균 계산
    const aggregated = Array.from(countryMap.values()).map((item) => ({
      country: item.country,
      requestCount: item.requestCount,
      avgResponseTime: item.requestCount > 0 ? item.totalResponseTime / item.requestCount : 0,
    }))

    // Unknown 분리
    const unknownData = aggregated.find((d) => !d.country || d.country === 'Unknown')

    // Unknown 제외 + 요청 수 기준으로 히트맵
    const validCountries = aggregated
      .filter((d) => d.country && d.country !== 'Unknown')
      .map((d) => ({
        name: d.country,
        value: d.requestCount,
        avgResponseTime: d.avgResponseTime,
      }))

    const max = validCountries.length > 0 ? Math.max(...validCountries.map((d) => d.value)) : 0

    return {
      mapped: validCountries,
      unknown: unknownData,
      maxValue: max,
    }
  }, [trafficDataPoints])

  // 6. 차트 옵션 생성
  const option = useMemo(() => {
    if (mapped.length === 0) return {}

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const { name, value, data } = params
          const avg = data?.avgResponseTime ?? 0
          return [
            `<b>${name}</b>`,
            `요청 수: ${value.toLocaleString()}`,
            `평균 응답시간: ${avg.toFixed(2)} s`,
          ].join('<br/>')
        },
      },
      visualMap: {
        min: 0,
        max: maxValue || 1,
        left: 16,
        bottom: 16,
        text: ['트래픽 많음', '트래픽 적음'],
        calculable: true,
        inRange: {
          color: ['#E0E7FF', '#3877BE'],
        },
      },
      // geo 컴포넌트를 사용해서 세계 지도를 카드 전체에 명확하게 표시
      geo: {
        map: 'world',
        roam: false,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        itemStyle: {
          areaColor: '#F3F4F6',
          borderColor: '#E5E7EB',
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#BFDBFE',
          },
          label: {
            show: false,
          },
        },
      },
      series: [
        {
          name: '트래픽',
          type: 'map',
          geoIndex: 0,
          data: mapped,
        },
      ],
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 600,
      animationEasingUpdate: 'cubicOut',
    }
  }, [mapped, maxValue])

  // 7. Top 5 국가 리스트
  const topCountries = useMemo(() => {
    return [...mapped].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5)
  }, [mapped])

  // 컨테이너 크기 변화 대응
  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return

    const el = inst.getDom()
    const ro = new ResizeObserver(() => {
      if (!inst.isDisposed()) {
        inst.resize()
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
    }
  }, [])

  // 데이터 소스 표시
  const dataSource = isConnected ? '실시간' : 'DB'
  const totalTraffic = trafficDataPoints.length

  let content

  if (isLoading && trafficDataPoints.length === 0) {
    // 처음에 DB에서 아직 아무 데이터도 안 들어온 상태일 때만 로딩 표시
    content = (
      <div className='flex h-72 items-center justify-center text-sm text-gray-400'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
          <p>국가별 트래픽 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-72 items-center justify-center text-sm text-red-500'>
        국가별 트래픽 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (trafficDataPoints.length === 0) {
    // 요청은 끝났는데도 데이터가 없을 때
    content = (
      <div className='flex h-72 items-center justify-center text-sm text-gray-400'>
        표시할 국가별 트래픽 데이터가 없습니다.
      </div>
    )
  } else {
    // 데이터가 한 번이라도 들어오면, 이후 refetch로 isLoading이 true가 돼도 차트는 그대로 유지
    content = (
      <div className='grid h-80 grid-cols-3 gap-4'>
        {/* 왼쪽: 세계 지도 */}
        <div className='col-span-2 h-full'>
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={option}
            notMerge={false}
            lazyUpdate={true}
            style={{ height: '100%' }}
          />
        </div>

        {/* 오른쪽: Top 국가 리스트 */}
        <div className='col-span-1 flex h-full flex-col text-xs'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='font-semibold text-gray-700'>Top 5 국가</span>
            <span className='text-[10px] text-gray-400'>요청 수 기준</span>
          </div>
          <div className='flex-1 space-y-1 overflow-y-auto pr-1'>
            {topCountries.map((c, index) => (
              <div
                key={c.name}
                className='flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5 transition-all duration-300'
              >
                <div className='flex items-center gap-2'>
                  <span className='text-[10px] font-semibold text-gray-500'>{index + 1}</span>
                  <span className='text-[11px] font-medium text-gray-800'>{c.name}</span>
                </div>
                <div className='text-right'>
                  <div className='text-[11px] font-semibold text-gray-700 transition-all duration-300'>
                    {(c.value ?? 0).toLocaleString()}건
                  </div>
                  <div className='text-[10px] text-gray-500 transition-all duration-300'>
                    평균 {c.avgResponseTime?.toFixed?.(2) ?? c.avgResponseTime} s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <WidgetCard
      title='국가별 트래픽 분포'
      description={`요청 수 기준 국가별 트래픽 히트맵 (${dataSource} - ${totalTraffic}건, 최근 1시간)`}
      icon='🗺️'
      onClose={onClose}
      showSettings={false}
    >
      {content}
      {unknown && (
        <div className='mt-2 text-xs text-gray-500 text-right transition-all duration-300'>
          기타 / Unknown: {unknown.requestCount ?? 0}건 ( 평균 응답{' '}
          {unknown.avgResponseTime?.toFixed?.(2) ?? unknown.avgResponseTime} s)
        </div>
      )}
    </WidgetCard>
  )
}

GeoTrafficDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default GeoTrafficDistribution

// 국가명 정규화 (지도 국가명과 일치시키기)
function normalizeCountryName(countryName) {
  if (!countryName || countryName === 'Unknown') return 'Unknown'

  // 매핑 테이블에 있으면 변환
  if (COUNTRY_NAME_MAP[countryName]) {
    return COUNTRY_NAME_MAP[countryName]
  }

  // 그대로 반환 (지도와 일치하는 경우)
  return countryName
}
