import { useEffect, useRef } from 'react'
import { COUNTRY_COORDS } from '@/constants/countryCoords'
import useEcharts from '@/hooks/detail/useEcharts'

const EnhancedGeoMap = ({ countryReq, countryRes, srcIp, dstIp, env }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const echarts = useEcharts()

  useEffect(() => {
    if (!echarts || !chartRef.current) return

    const instance = echarts.init(chartRef.current)
    chartInstance.current = instance

    const coordsReq = COUNTRY_COORDS[countryReq] || null
    const coordsRes = COUNTRY_COORDS[countryRes] || null

    if (!coordsReq && !coordsRes) {
      instance.setOption({
        title: {
          text: '위치 정보 없음',
          subtext: 'IP 주소에서 국가 정보를 찾을 수 없습니다',
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

    let geoCenter
    let geoZoom = 1.5

    if (coordsReq && coordsRes) {
      const mid = [(coordsReq[0] + coordsRes[0]) / 2, (coordsReq[1] + coordsRes[1]) / 2]
      const dx = Math.abs(coordsReq[0] - coordsRes[0])
      const dy = Math.abs(coordsReq[1] - coordsRes[1])
      const maxDelta = Math.max(dx, dy)

      if (maxDelta < 15) geoZoom = 5
      else if (maxDelta < 40) geoZoom = 4
      else if (maxDelta < 80) geoZoom = 3
      else geoZoom = 2

      geoCenter = mid
    } else if (coordsReq || coordsRes) {
      const only = coordsReq || coordsRes
      geoCenter = only
      geoZoom = 5
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
          color: '#1e40af',
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
        itemStyle: { color: '#ef4444' },
        label: {
          show: true,
          formatter: `도착\n${dstIp || ''}`,
          position: 'top',
          fontSize: 10,
          color: '#991b1b',
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
        fromName: countryReq,
        toName: countryRes,
        coords: [coordsReq, coordsRes],
      })
    }

    const option = {
      title: {
        text: markers.length === 2 ? '네트워크 경로' : '위치 정보',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtext: markers.length === 2 ? `${countryReq || '출발'} → ${countryRes || '도착'}` : '',
        subtextStyle: { fontSize: 11 },
      },
      tooltip: { trigger: 'item' },
      geo: {
        map: 'world',
        roam: true,
        scaleLimit: { min: 1, max: 8 },
        itemStyle: {
          areaColor: '#f3f4f6',
          borderColor: '#d1d5db',
        },
        emphasis: {
          itemStyle: { areaColor: '#e5e7eb' },
        },
        layoutCenter: ['50%', '50%'],
        layoutSize: '120%',
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
                  color: '#8b5cf6',
                  width: 3,
                  curveness: 0.3,
                  opacity: 0.7,
                },
                effect: {
                  show: true,
                  period: 3,
                  trailLength: 0.2,
                  symbol: 'arrow',
                  symbolSize: 10,
                  color: '#8b5cf6',
                },
              },
            ]
          : []),
      ],
    }

    fetch('https://cdn.jsdelivr.net/gh/apache/echarts-www@master/asset/map/json/world.json')
      .then((res) => res.json())
      .then((worldJson) => {
        echarts.registerMap('world', worldJson)
        instance.setOption(option)
      })
      .catch(() => {
        instance.setOption({
          title: {
            text: '지도 로드 실패',
            subtext: '네트워크 연결을 확인해주세요',
            left: 'center',
            top: 'middle',
            textStyle: { color: '#ef4444', fontSize: 14 },
          },
        })
      })

    return () => {
      instance.dispose()
      chartInstance.current = null
    }
  }, [echarts, countryReq, countryRes, srcIp, dstIp, env])

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '450px' }} />
}

export default EnhancedGeoMap
