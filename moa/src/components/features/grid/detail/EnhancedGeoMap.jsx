/**
 * EnhancedGeoMap 컴포넌트
 *
 * 기능:
 * - ECharts 기반 세계 지도 시각화
 * - 요청/응답 국가 좌표 기반 선(Flow) 시각화
 * - 출발·도착지 마커 및 상세정보 Tooltip 제공
 * - 동일 위치일 경우 루프 애니메이션 처리
 * - 세계 지도 GeoJSON 동적 로딩 및 Error 처리
 * - 반응형 크기 조절(resize)
 *
 * 주요 매개변수:
 * - countryReq: 요청 국가
 * - countryRes: 응답 국가
 * - srcIp: 요청 IP
 * - dstIp: 응답 IP
 * - env: 국가 및 국내 지역 정보(env.*)
 *
 * AUTHOR : 방대혁
 */
import { useEffect, useRef } from 'react'
import { COUNTRY_COORDS } from '@/constants/countryCoords'
import useEcharts from '@/hooks/detail/useEcharts'
import useWorldMap from '@/hooks/detail/useWorldMap'

const EnhancedGeoMap = ({ countryReq, countryRes, srcIp, dstIp, env }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const echarts = useEcharts()

  const { data: worldJson, isError } = useWorldMap()

  useEffect(() => {
    if (!echarts || !chartRef.current) return
    if (!worldJson) return

    echarts.registerMap('world', worldJson)

    const instance = echarts.init(chartRef.current)
    chartInstance.current = instance

    const defaultCoords = COUNTRY_COORDS.default || COUNTRY_COORDS['South Korea']

    // raw 기준 위치 정보 존재 여부
    const hasAnyLocationInfo =
      countryReq ||
      countryRes ||
      env?.domesticPrimaryReq ||
      env?.domesticPrimaryRes ||
      env?.continentReq ||
      env?.continentRes

    if (!hasAnyLocationInfo) {
      instance.setOption({
        title: {
          text: '위치 정보 없음',
          subtext: 'IP/Geo 정보가 존재하지 않습니다',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#9ca3af', fontSize: 14 },
        },
      })
      return () => {
        instance.dispose()
        chartInstance.current = null
      }
    }

    // 출발/도착 좌표: 없으면 한국으로 fallback
    const coordsReq = COUNTRY_COORDS[countryReq] || defaultCoords
    const coordsRes = COUNTRY_COORDS[countryRes] || defaultCoords

    // 좌표가 거의 같으면 sameLocation 으로 간주
    const sameLocation =
      coordsReq &&
      coordsRes &&
      Math.abs(coordsReq[0] - coordsRes[0]) < 0.5 &&
      Math.abs(coordsReq[1] - coordsRes[1]) < 0.5

    let geoCenter
    let geoZoom = 1.5
    let layoutSize = '120%'

    if (coordsReq && coordsRes) {
      const mid = [(coordsReq[0] + coordsRes[0]) / 2, (coordsReq[1] + coordsRes[1]) / 2]
      const dx = Math.abs(coordsReq[0] - coordsRes[0])
      const dy = Math.abs(coordsReq[1] - coordsRes[1])
      const maxDelta = Math.max(dx, dy)

      if (maxDelta < 3) {
        geoZoom = 8
        layoutSize = '260%'
      } else if (maxDelta < 20) {
        geoZoom = 5
        layoutSize = '200%'
      } else if (maxDelta < 60) {
        geoZoom = 3
        layoutSize = '130%'
      } else {
        geoZoom = 2
        layoutSize = '80%'
      }

      geoCenter = mid
    } else if (coordsReq || coordsRes) {
      const only = coordsReq || coordsRes
      geoCenter = only
      geoZoom = 8
      layoutSize = '260%'
    }

    const markers = []
    let lines = [] // 출발≠도착 선
    let sameLocationLoop = [] // 출발=도착 루프 경로

    // --- 출발 마커 ---
    if (coordsReq) {
      const location = [
        countryReq,
        env?.domesticPrimaryReq,
        env?.domesticSub1Req,
        env?.domesticSub2Req,
      ]
        .filter(Boolean)
        .join(', ')

      markers.push({
        name: '출발지',
        value: coordsReq.concat([1]),
        itemStyle: {
          color: '#2563eb',
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 8,
          shadowColor: 'rgba(15,23,42,0.25)',
        },
        label: {
          show: true,
          formatter: `출발\n${srcIp || ''}`,
          position: 'left',
          offset: [6, -4],
          fontSize: 10,
          color: '#1f2937',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: [3, 5],
          borderRadius: 6,
        },
        tooltip: {
          formatter: () => `
            <div style="padding: 8px;">
              <strong>출발지 정보</strong><br/>
              IP: ${srcIp || '알 수 없음'}<br/>
              위치: ${location || 'South Korea, 서울특별시'}<br/>
              대륙: ${env?.continentReq || 'Asia'}
            </div>
          `,
        },
      })
    }

    // --- 도착 마커 ---
    if (coordsRes) {
      const location = [
        countryRes,
        env?.domesticPrimaryRes,
        env?.domesticSub1Res,
        env?.domesticSub2Res,
      ]
        .filter(Boolean)
        .join(', ')

      markers.push({
        name: '도착지',
        value: coordsRes.concat([1]),
        itemStyle: {
          color: '#2563eb',
          borderColor: '#ffffff',
          borderWidth: 1.5,
          shadowBlur: 8,
          shadowColor: 'rgba(15,23,42,0.25)',
        },
        label: {
          show: true,
          formatter: `도착\n${dstIp || ''}`,
          position: 'right',
          offset: [6, -4],
          fontSize: 10,
          color: '#1f2937',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: [3, 5],
          borderRadius: 6,
        },
        tooltip: {
          formatter: () => `
            <div style="padding: 8px;">
              <strong>도착지 정보</strong><br/>
              IP: ${dstIp || '알 수 없음'}<br/>
              위치: ${location || 'South Korea, 서울특별시'}<br/>
              대륙: ${env?.continentRes || 'Asia'}
            </div>
          `,
        },
      })
    }

    // --- 출발 ≠ 도착: 기존 라인 그대로 ---
    if (!sameLocation && coordsReq && coordsRes) {
      lines = [
        {
          fromName: countryReq || '출발',
          toName: countryRes || '도착',
          coords: [coordsReq, coordsRes],
        },
      ]
    }

    // --- 출발 = 도착: 점에서 나갔다가 다시 그 점으로 돌아오는 루프 경로 ---
    if (sameLocation && coordsReq) {
      const [lng, lat] = coordsReq
      const radiusLng = 1
      const radiusLat = 0.7
      const segments = 64

      const loopCoords = []
      for (let i = 0; i <= segments; i++) {
        const theta = (Math.PI * 2 * i) / segments
        const xOffset = radiusLng * (1 - Math.cos(theta))
        const yOffset = radiusLat * Math.sin(theta)
        loopCoords.push([lng + xOffset, lat + yOffset])
      }

      sameLocationLoop = [{ coords: loopCoords }]
    }

    const option = {
      title: {
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtext:
          markers.length === 2
            ? `${countryReq || '출발'} → ${countryRes || '도착'}`
            : countryReq || countryRes || '',
        subtextStyle: { fontSize: 11, color: '#6b7280' },
      },
      tooltip: { trigger: 'item' },
      geo: {
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 10 },
        itemStyle: {
          areaColor: '#f9fafb',
          borderColor: '#e5e7eb',
        },
        emphasis: {
          itemStyle: { areaColor: '#e0f2fe' },
        },
        layoutCenter: ['50%', '50%'],
        layoutSize,
        zoom: geoZoom,
        center: geoCenter,
      },
      series: [
        // 1) 출발/도착 점
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: markers,
          symbol: 'circle',
          symbolSize: 10,
          emphasis: { scale: true, scaleSize: 1.3 },
          zlevel: 3,
        },

        // 2) 출발≠도착: 회색 점선 베이스 라인
        ...(!sameLocation && lines.length > 0
          ? [
              {
                type: 'lines',
                coordinateSystem: 'geo',
                data: lines,
                lineStyle: {
                  color: '#9ca3af',
                  width: 1.2,
                  type: 'dashed',
                  opacity: 0.8,
                  curveness: 0.3,
                },
                silent: true,
                zlevel: 1,
              },
            ]
          : []),

        // 3) 출발≠도착: 흐릿한 파란 화살표 선
        ...(!sameLocation && lines.length > 0
          ? [
              {
                type: 'lines',
                coordinateSystem: 'geo',
                data: lines,
                lineStyle: {
                  color: '#3877BE',
                  width: 3,
                  opacity: 0.1,
                  curveness: 0.3,
                },
                symbol: ['none', 'arrow'],
                symbolSize: 20,
                symbolKeepAspect: true,
                zlevel: 10,
              },
            ]
          : []),

        ...(sameLocation && sameLocationLoop.length > 0
          ? [
              // 1) 회색 루프
              {
                type: 'lines',
                coordinateSystem: 'geo',
                polyline: true,
                data: sameLocationLoop,
                lineStyle: {
                  color: '#9ca3af',
                  width: 1.2,
                  type: 'dashed',
                  opacity: 0.8,
                },
                silent: true,
                zlevel: 1,
              },

              // 2) 화살표 1회 애니메이션
              {
                id: 'loopArrow',
                type: 'lines',
                coordinateSystem: 'geo',
                polyline: true,
                data: sameLocationLoop,
                effect: {
                  show: true,
                  symbol: 'arrow',
                  color: '#3877BE',
                  constantSpeed: 150,
                  loop: false,
                  trailLength: 0,
                  symbolSize: 10,
                },
                lineStyle: {
                  width: 0,
                },
                zlevel: 20,
              },
            ]
          : []),
      ],
    }

    instance.setOption(option)

    return () => {
      instance.dispose()
      chartInstance.current = null
    }
  }, [echarts, worldJson, countryReq, countryRes, srcIp, dstIp, env])

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isError) {
    return (
      <div className='flex items-center justify-center w-full h-[300px] text-sm text-red-600'>
        세계 지도 데이터를 불러오지 못했습니다.
      </div>
    )
  }

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
}

export default EnhancedGeoMap
