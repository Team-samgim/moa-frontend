import { useEffect, useRef } from 'react'
import { COUNTRY_COORDS } from '@/constants/countryCoords'
import useEcharts from '@/hooks/detail/useEcharts'
import useWorldMap from '@/hooks/detail/useWorldMap'

const EnhancedGeoMap = ({ countryReq, countryRes, srcIp, dstIp, env }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const echarts = useEcharts()

  const PLANE_SYMBOL = 'path://M0,10 L24,0 L20,10 L24,20 L0,10 L6,10 L6,10 L6,10 Z'

  const { data: worldJson, isError } = useWorldMap()

  useEffect(() => {
    if (!echarts || !chartRef.current) return
    if (!worldJson) return

    echarts.registerMap('world', worldJson)

    const instance = echarts.init(chartRef.current)
    chartInstance.current = instance

    const defaultCoords = COUNTRY_COORDS.default || COUNTRY_COORDS['South Korea']

    // ← 여기서 raw 데이터 기준으로 "정보 완전 없음" 체크
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

    let geoCenter
    let geoZoom = 1.5
    let layoutSize = '120%' // 👈 기본값

    if (coordsReq && coordsRes) {
      const mid = [(coordsReq[0] + coordsRes[0]) / 2, (coordsReq[1] + coordsRes[1]) / 2]
      const dx = Math.abs(coordsReq[0] - coordsRes[0])
      const dy = Math.abs(coordsReq[1] - coordsRes[1])
      const maxDelta = Math.max(dx, dy)

      // ✨ 거리 기준 단계 확 차이 나게 설정
      if (maxDelta < 3) {
        // 거의 같은 나라 / 인접 도시 수준
        geoZoom = 8
        layoutSize = '260%'
      } else if (maxDelta < 20) {
        // 같은 대륙 안 / 근접 국가
        geoZoom = 5
        layoutSize = '200%'
      } else if (maxDelta < 60) {
        // 대륙 간 이동 (한국 ↔ 동유럽 등)
        geoZoom = 3
        layoutSize = '120%'
      } else {
        // 아주 멀리 (한국 ↔ 미국, 서유럽 등)
        geoZoom = 2
        layoutSize = '90%'
      }

      geoCenter = mid
    } else if (coordsReq || coordsRes) {
      const only = coordsReq || coordsRes
      geoCenter = only
      geoZoom = 8
      layoutSize = '260%'
    }

    const markers = []
    const lines = []

    if (coordsReq) {
      const location = [
        countryReq || '알 수 없음',
        env?.domesticPrimaryReq,
        env?.domesticSub1Req,
        env?.domesticSub2Req,
      ]
        .filter(Boolean)
        .join(', ')

      markers.push({
        name: '출발지',
        value: coordsReq.concat([1]),
        itemStyle: { color: '#3b82f6' },
        label: {
          show: true,
          formatter: `출발\n${srcIp || ''}`,
          position: 'top',
          fontSize: 10,
          color: '#1d4ed8',
        },
        tooltip: {
          formatter: () => `
            <div style="padding: 8px;">
              <strong>출발지 정보</strong><br/>
              IP: ${srcIp || '알 수 없음'}<br/>
              위치: ${location}<br/>
              대륙: ${env?.continentReq || '알 수 없음'}
            </div>
          `,
        },
      })
    }

    if (coordsRes) {
      const location = [
        countryRes || '알 수 없음',
        env?.domesticPrimaryRes,
        env?.domesticSub1Res,
        env?.domesticSub2Res,
      ]
        .filter(Boolean)
        .join(', ')

      markers.push({
        name: '도착지',
        value: coordsRes.concat([1]),
        itemStyle: { color: '#f97316' },
        label: {
          show: true,
          formatter: `도착\n${dstIp || ''}`,
          position: 'top',
          fontSize: 10,
          color: '#c2410c',
        },
        tooltip: {
          formatter: () => `
            <div style="padding: 8px;">
              <strong>도착지 정보</strong><br/>
              IP: ${dstIp || '알 수 없음'}<br/>
              위치: ${location}<br/>
              대륙: ${env?.continentRes || '알 수 없음'}
            </div>
          `,
        },
      })
    }

    if (coordsReq && coordsRes) {
      lines.push({
        fromName: countryReq || '출발',
        toName: countryRes || '도착',
        coords: [coordsReq, coordsRes],
      })
    }

    const option = {
      title: {
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtext: markers.length === 2 ? `${countryReq || '출발'} → ${countryRes || '도착'}` : '',
        subtextStyle: { fontSize: 11 },
      },
      tooltip: { trigger: 'item' },
      geo: {
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 10 },
        itemStyle: {
          areaColor: '#f3f4f6',
          borderColor: '#d1d5db',
        },
        emphasis: {
          itemStyle: { areaColor: '#e5e7eb' },
        },
        layoutCenter: ['50%', '50%'],
        layoutSize,
        zoom: geoZoom,
        center: geoCenter,
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: markers,
          symbolSize: 25,
          emphasis: { symbolSize: 30 },
        },
        ...(lines.length > 0
          ? [
              {
                type: 'lines',
                coordinateSystem: 'geo',
                data: lines,
                lineStyle: {
                  color: '#3877BE',
                  width: 3,
                  curveness: 0.3,
                  opacity: 0.7,
                },
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
