import { useEffect, useRef } from 'react'
import useEcharts from '@/hooks/detail/useEcharts'
import { formatMs } from '@/utils/httpPageFormat'

const EnhancedTimelineChart = ({ timing, delaySummary }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const echarts = useEcharts()

  useEffect(() => {
    if (!echarts || !chartRef.current || !timing) return

    const instance = echarts.init(chartRef.current)
    chartInstance.current = instance

    const steps = []
    const gaps = []

    // --- 단계 구성 ---
    if (timing.tsPageTcpConnectAvg > 0) {
      steps.push({
        key: 'tcp',
        name: 'TCP 핸드셰이크',
        start: 0,
        duration: timing.tsPageTcpConnectAvg * 1000,
        color: '#DEEBFA',
        description: `3-way handshake`,
        detail: {
          avg: timing.tsPageTcpConnectAvg,
          min: timing.tsPageTcpConnectMin,
          max: timing.tsPageTcpConnectMax,
          sum: timing.tsPageTcpConnectSum,
        },
      })
    }

    if (timing.tsPageReqMakingAvg > 0) {
      const prevEnd =
        steps.length > 0 ? steps[steps.length - 1].start + steps[steps.length - 1].duration : 0
      steps.push({
        key: 'client',
        name: '요청 생성',
        start: prevEnd,
        duration: timing.tsPageReqMakingAvg * 1000,
        color: '#E6F0C7',
        description: `HTTP 요청 준비`,
        detail: {
          avg: timing.tsPageReqMakingAvg,
          sum: timing.tsPageReqMakingSum,
        },
      })
    }

    if (timing.tsPageTransferReq > 0) {
      const prevEnd =
        steps.length > 0 ? steps[steps.length - 1].start + steps[steps.length - 1].duration : 0
      steps.push({
        key: 'transferReq',
        name: '요청 전송',
        start: prevEnd,
        duration: timing.tsPageTransferReq * 1000,
        color: '#E6F0C7',
        description: `HTTP 요청 데이터 전송`,
        gap: timing.tsPageTransferReqGap,
      })
    }

    if (timing.tsPageResInit > 0) {
      const prevEnd =
        steps.length > 0 ? steps[steps.length - 1].start + steps[steps.length - 1].duration : 0
      const serverTime = timing.tsPageResInit * 1000 - prevEnd
      if (serverTime > 0) {
        steps.push({
          key: 'server',
          name: '서버 처리 (TTFB)',
          start: prevEnd,
          duration: serverTime,
          color: '#F8F1D0',
          description: 'Time To First Byte',
          gap: timing.tsPageResInitGap,
        })
      }
    }

    if (timing.tsPageResApp > 0 && timing.tsPageResInit > 0) {
      const prevEnd = timing.tsPageResInit * 1000
      const appTime = (timing.tsPageResApp - timing.tsPageResInit) * 1000
      if (appTime > 0) {
        steps.push({
          key: 'app',
          name: '애플리케이션 처리',
          start: prevEnd,
          duration: appTime,
          color: '#E6F0C7',
          description: '애플리케이션 레벨 응답',
          gap: timing.tsPageResAppGap,
        })
      }
    }

    if (timing.tsPageTransferRes > 0) {
      const prevEnd =
        steps.length > 0 ? steps[steps.length - 1].start + steps[steps.length - 1].duration : 0
      steps.push({
        key: 'transfer',
        name: '응답 수신',
        start: prevEnd,
        duration: timing.tsPageTransferRes * 1000,
        color: '#DEEBFA',
        description: 'HTTP 응답 데이터 수신',
        gap: timing.tsPageTransferResGap,
      })
    }

    if (timing.tsPageRes > 0) {
      const prevEnd =
        steps.length > 0 ? steps[steps.length - 1].start + steps[steps.length - 1].duration : 0
      const finalTime = timing.tsPageRes * 1000 - prevEnd
      if (finalTime > 0) {
        steps.push({
          key: 'final',
          name: '응답 완료',
          start: prevEnd,
          duration: finalTime,
          color: '#F8F1D0',
          description: '전체 응답 완료',
          gap: timing.tsPageResGap,
        })
      }
    }

    // Gap 목록
    if (timing.tsPageGap > 0) gaps.push({ name: '페이지', value: timing.tsPageGap })
    if (timing.tsPageResInitGap > 0)
      gaps.push({ name: '응답초기화', value: timing.tsPageResInitGap })
    if (timing.tsPageResAppGap > 0) gaps.push({ name: '앱응답', value: timing.tsPageResAppGap })
    if (timing.tsPageResGap > 0) gaps.push({ name: '응답', value: timing.tsPageResGap })
    if (timing.tsPageTransferReqGap > 0)
      gaps.push({ name: '요청전송', value: timing.tsPageTransferReqGap })
    if (timing.tsPageTransferResGap > 0)
      gaps.push({ name: '응답전송', value: timing.tsPageTransferResGap })

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

    // --- totalDuration 계산 (delaySummary 우선 사용) ---
    let totalDuration = (delaySummary?.total ?? timing.tsPage ?? 0) * 1000
    const lastStepEnd =
      steps.length > 0 ? steps[steps.length - 1].start + steps[steps.length - 1].duration : 0

    if (!totalDuration || totalDuration < lastStepEnd) {
      totalDuration = lastStepEnd || 1
    }

    const xMax = totalDuration * 1.05

    // --- 타이틀 subtext 구성 ---
    const subtexts = []

    if (delaySummary && delaySummary.dominantLabel && delaySummary.dominantValue !== null) {
      const ratioPct =
        delaySummary.dominantRatio !== null ? (delaySummary.dominantRatio * 100).toFixed(1) : null
      subtexts.push(
        `주요 지연: ${delaySummary.dominantLabel} ${formatMs(
          (delaySummary.dominantValue || 0) * 1000,
        )}${ratioPct ? ` (${ratioPct}%)` : ''}`,
      )
    }

    if (gaps.length > 0) {
      subtexts.push(
        `⚠️ Gap: ${gaps.map((g) => `${g.name} ${formatMs((g.value || 0) * 1000)}`).join(', ')}`,
      )
    }

    const option = {
      title: {
        text: `페이지 로딩 타임라인 (총 ${formatMs(totalDuration)})`,
        left: 'center',
        textStyle: { fontSize: 14, fontWeight: 600 },
        subtext: subtexts.join('  |  '),
        subtextStyle: { fontSize: 10, color: '#8d8d91ff' },
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
          const percentage = ((step.duration / totalDuration) * 100).toFixed(1)

          let html = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${step.name}</div>
              <div style="color: #666; font-size: 12px; margin-bottom: 8px;">${step.description}</div>
              <div style="font-size: 12px;">
                <div>시작: ${start}</div>
                <div>종료: ${end}</div>
                <div style="margin-top: 4px;">
                  <span style="font-weight: bold; color: ${step.color}">
                    소요: ${formatMs(step.duration)}
                  </span>
                  <span style="color: #999; margin-left: 8px;">(${percentage}%)</span>
                </div>`

          if (step.gap && step.gap > 0) {
            html += `<div style="color: #ef4444; margin-top: 4px;">⚠️ 갭: ${formatMs(
              step.gap * 1000,
            )}</div>`
          }

          if (step.detail) {
            html += `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e5e5e5; font-size: 11px;">`
            if (step.detail.avg) html += `<div>평균: ${formatMs(step.detail.avg * 1000)}</div>`
            if (step.detail.min !== undefined)
              html += `<div>최소: ${formatMs(step.detail.min * 1000)}</div>`
            if (step.detail.max !== undefined)
              html += `<div>최대: ${formatMs(step.detail.max * 1000)}</div>`
            if (step.detail.sum) html += `<div>합계: ${formatMs(step.detail.sum * 1000)}</div>`
            html += `</div>`
          }

          html += `</div></div>`
          return html
        },
      },
      grid: {
        left: '15%',
        right: '10%',
        top: subtexts.length > 0 ? '22%' : '18%',
        bottom: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: xMax,
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
          formatter: (value, index) => {
            const step = steps[index]
            return step?.gap && step.gap > 0 ? `${value} ⚠` : value
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

            return {
              type: 'group',
              children: [
                {
                  type: 'rect',
                  shape: {
                    x: start[0],
                    y: start[1] - height / 2,
                    width: end[0] - start[0],
                    height,
                  },
                  style: {
                    fill: step.color,
                    stroke: step.color,
                    lineWidth: 1,
                    shadowBlur: 4,
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowOffsetY: 2,
                  },
                  emphasis: {
                    style: {
                      fill: step.color,
                      opacity: 0.8,
                      shadowBlur: 8,
                      shadowColor: 'rgba(0,0,0,0.2)',
                    },
                  },
                },
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
  }, [echarts, timing, delaySummary])

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
}

export default EnhancedTimelineChart
