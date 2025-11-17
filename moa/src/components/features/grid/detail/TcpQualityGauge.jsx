import { useEffect, useRef } from 'react'
import useEcharts from '@/hooks/detail/useEcharts'

const TcpQualityGauge = ({ tcpQuality }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const echarts = useEcharts()

  useEffect(() => {
    if (!echarts || !chartRef.current || !tcpQuality) return

    const instance = echarts.init(chartRef.current)
    chartInstance.current = instance

    const rawError = tcpQuality.tcpErrorPercentage ?? 0
    const errorPct = rawError <= 1 ? rawError * 100 : rawError
    const clampedError = Math.max(0, Math.min(100, errorPct))
    const qualityScore = Math.max(0, Math.min(100, 100 - clampedError))

    let grade, gradeColor
    if (qualityScore >= 99) {
      grade = '우수'
      gradeColor = '#10b981'
    } else if (qualityScore >= 95) {
      grade = '양호'
      gradeColor = '#3b82f6'
    } else if (qualityScore >= 90) {
      grade = '보통'
      gradeColor = '#f59e0b'
    } else if (qualityScore >= 80) {
      grade = '주의'
      gradeColor = '#fb923c'
    } else {
      grade = '불량'
      gradeColor = '#ef4444'
    }

    const option = {
      title: {
        text: 'TCP 품질 지표',
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtext: `에러율: ${clampedError.toFixed(2)}%`,
        subtextStyle: { fontSize: 11, color: '#6b7280' },
      },
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          itemStyle: {
            color: gradeColor,
          },
          progress: {
            show: true,
            width: 30,
          },
          pointer: {
            show: true,
            length: '60%',
            width: 8,
          },
          axisLine: {
            lineStyle: {
              width: 30,
              color: [
                [0.6, '#ef4444'],
                [0.8, '#fb923c'],
                [0.9, '#f59e0b'],
                [0.97, '#3b82f6'],
                [1, '#10b981'],
              ],
            },
          },
          axisTick: {
            distance: -45,
            splitNumber: 5,
            lineStyle: {
              width: 2,
              color: '#999',
            },
          },
          splitLine: {
            distance: -52,
            length: 14,
            lineStyle: {
              width: 3,
              color: '#999',
            },
          },
          axisLabel: {
            distance: -20,
            color: '#999',
            fontSize: 10,
            formatter: (val) => `${val}%`,
          },
          anchor: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            width: '70%',
            lineHeight: 40,
            borderRadius: 8,
            offsetCenter: [0, '25%'],
            fontSize: 20,
            fontWeight: 'bolder',
            formatter: (val) => `${val.toFixed(0)}%\n{grade|${grade}}`,
            color: gradeColor,
            rich: {
              grade: {
                fontSize: 14,
                fontWeight: 'normal',
                padding: [5, 0, 0, 0],
                color: '#666',
              },
            },
          },
          data: [
            {
              value: Number(qualityScore.toFixed(0)),
            },
          ],
        },
      ],
    }

    instance.setOption(option)

    return () => {
      instance.dispose()
      chartInstance.current = null
    }
  }, [echarts, tcpQuality])

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
}

export default TcpQualityGauge
