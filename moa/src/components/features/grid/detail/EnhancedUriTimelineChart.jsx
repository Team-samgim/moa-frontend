import { memo, useEffect, useRef } from 'react'
import useEcharts from '@/hooks/detail/useEcharts'

const formatMs = (ms) => {
  if (!ms || ms < 0) return '0ms'
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * EnhancedUriTimelineChart
 * HTTP URI용 워터폴 타임라인 차트 (지연 시각화 포함)
 *
 * 시간 흐름:
 * 1. 요청 전송 (reqPktFirst → reqPktLast) + 요청 지연
 * 2. 서버 처리 (responseTime = resPktFirst - reqPktLast)
 * 3. 응답 전송 (resPktFirst → resPktLast) + 응답 지연
 */
const EnhancedUriTimelineChart = memo(function EnhancedUriTimelineChart({ timing }) {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const echarts = useEcharts()

  useEffect(() => {
    if (!echarts || !chartRef.current || !timing) return

    const instance = echarts.init(chartRef.current)
    chartInstance.current = instance

    // 시간 단계 계산 (ms 단위)
    const steps = []
    let currentTime = 0

    // 타임스탬프를 ms로 변환
    const reqPktFirst = timing.reqPktFirst ? timing.reqPktFirst * 1000 : 0
    const reqPktLast = timing.reqPktLast ? timing.reqPktLast * 1000 : 0
    const resPktFirst = timing.resPktFirst ? timing.resPktFirst * 1000 : 0
    const resPktLast = timing.resPktLast ? timing.resPktLast * 1000 : 0

    // 지연 시간 (초 단위를 ms로 변환)
    const reqDelayTransfer = (timing.reqDelayTransfer || 0) * 1000
    const resDelayTransfer = (timing.resDelayTransfer || 0) * 1000

    // 1. 요청 전송 시간
    if (reqPktFirst > 0 && reqPktLast > 0 && reqPktLast > reqPktFirst) {
      const reqDuration = reqPktLast - reqPktFirst
      steps.push({
        name: '요청 전송',
        start: currentTime,
        duration: reqDuration,
        color: '#10b981',
        description: 'HTTP 요청 패킷 전송',
        type: 'normal',
      })
      currentTime += reqDuration

      // 1-1. 요청 전송 지연
      if (reqDelayTransfer > 0) {
        steps.push({
          name: '⚠️ 요청 지연',
          start: currentTime,
          duration: reqDelayTransfer,
          color: '#ef4444',
          description: '예상보다 지연된 요청 전송 시간',
          type: 'delay',
          pattern: 'diagonal-stripe',
        })
        currentTime += reqDelayTransfer
      }
    }

    // 2. 서버 처리 (TTFB - Time To First Byte)
    const responseTime = timing.responseTime || 0
    if (responseTime > 0) {
      steps.push({
        name: '서버 처리 (TTFB)',
        start: currentTime,
        duration: responseTime,
        color: '#f59e0b',
        description: 'Time To First Byte - 서버 응답 대기',
        type: 'normal',
      })
      currentTime += responseTime
    }

    // 3. 응답 전송 시간
    if (resPktFirst > 0 && resPktLast > 0 && resPktLast > resPktFirst) {
      const resDuration = resPktLast - resPktFirst
      steps.push({
        name: '응답 전송',
        start: currentTime,
        duration: resDuration,
        color: '#3b82f6',
        description: 'HTTP 응답 패킷 수신',
        type: 'normal',
      })
      currentTime += resDuration

      // 3-1. 응답 전송 지연
      if (resDelayTransfer > 0) {
        steps.push({
          name: '⚠️ 응답 지연',
          start: currentTime,
          duration: resDelayTransfer,
          color: '#f97316',
          description: '예상보다 지연된 응답 전송 시간',
          type: 'delay',
          pattern: 'diagonal-stripe',
        })
        currentTime += resDelayTransfer
      }
    }

    const totalTime = timing.totalTime || 0
    const hasDelay = reqDelayTransfer > 0 || resDelayTransfer > 0

    // 데이터 없음
    if (steps.length === 0) {
      instance.setOption({
        title: {
          text: '시간 데이터 없음',
          left: 'center',
          top: 'middle',
          textStyle: { color: '#9ca3af', fontSize: 14 },
        },
      })
      return
    }

    const option = {
      title: {
        text: `HTTP 통신 타임라인 (총 ${formatMs(totalTime)})${hasDelay ? ' ⚠️ 지연 발생' : ''}`,
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
          color: hasDelay ? '#dc2626' : '#374151',
        },
        subtext: hasDelay ? '빨간색 영역은 네트워크 지연을 나타냅니다' : '',
        subtextStyle: {
          fontSize: 11,
          color: '#ef4444',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          if (!params || !params[0]) return ''
          const dataIndex = params[0].dataIndex
          const step = steps[dataIndex]
          if (!step) return ''

          const start = formatMs(step.start)
          const end = formatMs(step.start + step.duration)
          const percentage = totalTime > 0 ? ((step.duration / totalTime) * 100).toFixed(1) : '0.0'

          const isDelay = step.type === 'delay'
          const icon = isDelay ? '⚠️' : '📊'

          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">
                ${icon} ${step.name}
              </div>
              <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${step.description}</div>
              <div style="font-size: 12px;">
                <div>시작: ${start}</div>
                <div>종료: ${end}</div>
                <div style="margin-top: 4px;">
                  <span style="font-weight: bold; color: ${step.color}">
                    소요: ${formatMs(step.duration)}
                  </span>
                  <span style="color: #999; margin-left: 8px;">(${percentage}%)</span>
                </div>
                ${isDelay ? '<div style="margin-top: 4px; color: #ef4444; font-weight: 500;">⚠️ 성능 개선 필요</div>' : ''}
              </div>
            </div>
          `
        },
      },
      grid: {
        left: '15%',
        right: '10%',
        top: hasDelay ? '20%' : '15%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: Math.max(totalTime, currentTime),
        axisLabel: {
          formatter: (val) => formatMs(val),
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
      },
      yAxis: {
        type: 'category',
        data: steps.map((s) => s.name),
        axisLabel: {
          fontSize: 11,
          color: '#374151',
          formatter: (value) => {
            // 지연 항목은 굵게 표시
            return value.includes('⚠️') ? `{warning|${value}}` : value
          },
          rich: {
            warning: {
              fontWeight: 'bold',
              color: '#dc2626',
            },
          },
        },
      },
      series: [
        {
          type: 'custom',
          renderItem: (params, api) => {
            const categoryIndex = api.value(0)
            const step = steps[categoryIndex]
            if (!step) return null

            const start = api.coord([step.start, categoryIndex])
            const end = api.coord([step.start + step.duration, categoryIndex])
            const height = api.size([0, 1])[1] * 0.6

            const isDelay = step.type === 'delay'

            // 지연인 경우 반투명 + 점선 테두리로 표시
            const rectShape = {
              x: start[0],
              y: start[1] - height / 2,
              width: Math.max(end[0] - start[0], 2),
              height: height,
            }

            const baseStyle = {
              fill: step.color,
              stroke: isDelay ? '#dc2626' : step.color,
              lineWidth: isDelay ? 2 : 1,
              shadowBlur: isDelay ? 6 : 4,
              shadowColor: isDelay ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0,0,0,0.1)',
              shadowOffsetY: 2,
            }

            // 지연인 경우 opacity 낮춤
            if (isDelay) {
              baseStyle.opacity = 0.7
            }

            return {
              type: 'group',
              children: [
                // 메인 바
                {
                  type: 'rect',
                  shape: rectShape,
                  style: baseStyle,
                  emphasis: {
                    style: {
                      fill: step.color,
                      opacity: 0.8,
                      shadowBlur: isDelay ? 10 : 8,
                      shadowColor: isDelay ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0,0,0,0.2)',
                    },
                  },
                },
                // 지연인 경우 사선 패턴 (여러 개의 선으로 표현)
                ...(isDelay && end[0] - start[0] > 10
                  ? Array.from({ length: Math.floor((end[0] - start[0]) / 5) }).map((_, i) => ({
                      type: 'line',
                      shape: {
                        x1: start[0] + i * 5,
                        y1: start[1] + height / 2,
                        x2: start[0] + i * 5 + 5,
                        y2: start[1] - height / 2,
                      },
                      style: {
                        stroke: 'rgba(255, 255, 255, 0.4)',
                        lineWidth: 1.5,
                      },
                    }))
                  : []),
                // 지연 경고 아이콘
                ...(isDelay && end[0] - start[0] > 30
                  ? [
                      {
                        type: 'text',
                        style: {
                          text: '⚠️',
                          x: start[0] + 5,
                          y: start[1],
                          fontSize: 12,
                          textVerticalAlign: 'middle',
                        },
                      },
                    ]
                  : []),
              ],
            }
          },
          data: steps.map((_, idx) => [idx]),
          z: 2,
        },
      ],
    }

    instance.setOption(option)

    return () => {
      instance.dispose()
      chartInstance.current = null
    }
  }, [echarts, timing])

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '90%', height: '300px' }} />
})

export default EnhancedUriTimelineChart
