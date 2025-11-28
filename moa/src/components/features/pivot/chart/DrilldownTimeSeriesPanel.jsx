// 작성자: 최이서
// 드릴다운 시계열 데이터를 라인 차트로 표시하는 패널 컴포넌트

import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  DRILLDOWN_BAND_COLOR,
  DRILLDOWN_MEDIAN_COLOR,
  PIVOT_SERIES_COLORS,
} from '@/constants/chartColors'
import { useDrilldownTimeSeries } from '@/hooks/queries/useCharts'

const colorForSeriesName = (name, colorMap) => {
  if (!name || !colorMap) return undefined
  return colorMap[name]
}

const normalizePointsWithZeroEdges = (points, globalMinTime, globalMaxTime) => {
  if (!Array.isArray(points) || points.length === 0) return []

  const sorted = [...points].sort((a, b) => a.ts - b.ts)
  const result = []

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // 전체 구간의 시작 지점에서 0
  if (globalMinTime !== null && first.ts > globalMinTime) {
    result.push([globalMinTime, 0])
  }

  // 실제 값들(값이 없거나 NaN이면 0으로)
  sorted.forEach((p) => {
    const v = typeof p.value === 'number' && !Number.isNaN(p.value) ? p.value : 0
    result.push([p.ts, v])
  })

  if (globalMaxTime !== null && last.ts < globalMaxTime) {
    result.push([globalMaxTime, 0])
  }

  return result
}

const buildDrilldownLineOption = (data, plusPercent, minusPercent, colorMap) => {
  if (!data || !data.series || !data.series.length) {
    return {
      title: { text: '드릴다운 데이터가 없습니다', left: 'center', top: 'middle' },
    }
  }

  const { series, globalMedian, globalMinTime, globalMaxTime } = data

  const median = typeof globalMedian === 'number' ? globalMedian : null
  const upper =
    median !== null
      ? median * (1 + (typeof plusPercent === 'number' ? plusPercent : 0) / 100)
      : null
  const lower =
    median !== null
      ? median * (1 - (typeof minusPercent === 'number' ? minusPercent : 0) / 100)
      : null

  const lineSeries = series.map((s) => {
    const color = colorForSeriesName(s.rowKey, colorMap)

    return {
      name: s.rowKey,
      type: 'line',
      showSymbol: true,
      smooth: true,
      data: normalizePointsWithZeroEdges(s.points || [], globalMinTime, globalMaxTime),
      itemStyle: color ? { color } : undefined,
      lineStyle: color ? { color } : undefined,
    }
  })

  if (
    lineSeries.length > 0 &&
    median !== null &&
    upper !== null &&
    lower !== null &&
    globalMinTime !== null &&
    globalMaxTime !== null
  ) {
    lineSeries[0] = {
      ...lineSeries[0],
      markLine: {
        symbol: 'none',
        silent: true,
        emphasis: {
          disabled: true,
        },
        label: {
          formatter: () => `중간값: ${median.toFixed(2)}`,
          fontFamily:
            'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: 12,
        },
        lineStyle: {
          type: 'dashed',
          color: DRILLDOWN_MEDIAN_COLOR || '#111827',
        },
        data: [{ yAxis: median }],
      },
      markArea: {
        itemStyle: {
          color: DRILLDOWN_BAND_COLOR || 'rgba(37, 99, 235, 0.15)',
          opacity: 0.12,
        },
        data: [
          [
            {
              xAxis: globalMinTime,
              yAxis: lower,
            },
            {
              xAxis: globalMaxTime,
              yAxis: upper,
            },
          ],
        ],
      },
    }
  }

  return {
    color: PIVOT_SERIES_COLORS,
    textStyle: {
      fontFamily:
        'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      padding: [8, 10],
      borderRadius: 6,
      textStyle: {
        fontSize: 14,
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        lineHeight: 16,
      },
      formatter: (params) => {
        if (!params || !params.length) return ''
        const ts = params[0].value[0]
        const date = new Date(ts)

        const timeStr = date.toLocaleString('ko-KR', {
          timeZone: 'Asia/Seoul',
        })

        const bodyLines = []

        params.forEach((p) => {
          const value = p.value[1]
          const line = `${p.marker} ${p.seriesName}: ${value.toFixed(2)}`
          bodyLines.push(line)
        })

        let globalHtml = ''
        if (median !== null) {
          globalHtml = `
            <div
              style="
                margin-top:12px;
                padding-top:7px;
                border-top:1px solid rgba(156,163,175,0.5);
              "
            >
              글로벌 중간값: ${median.toFixed(2)}
            </div>
          `
        }

        const headerHtml = `
          <div style="margin-bottom:7px; font-weight:600;">
            ${timeStr}
          </div>
        `

        const bodyHtml = `
          <div style="display:flex; flex-direction:column; row-gap:3.5px;">
            ${bodyLines.map((line) => `<div>${line}</div>`).join('')}
          </div>
        `

        return headerHtml + bodyHtml + globalHtml
      },
    },
    legend: {
      data: series.map((s) => s.rowKey),
      bottom: 10,
      left: 'center',
      orient: 'horizontal',
      type: 'scroll',
      pageIconSize: 12,
      pageButtonPosition: 'end',
      textStyle: {
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      formatter: (name) => {
        if (name.length > 20) {
          return name.substring(0, 20) + '...'
        }
        return name
      },
      tooltip: {
        show: true,
      },
    },
    grid: {
      left: 40,
      right: 100,
      top: 40,
      bottom: 60,
      containLabel: true,
    },
    // xAxis: {
    //   type: 'time',
    //   boundaryGap: false,
    //   axisLabel: {
    //     fontFamily:
    //       'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    //   },
    // },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      min: () => {
        const now = new Date()
        const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
        return koreaTime.getTime() - 24 * 60 * 60 * 1000 // 24시간 전
      },
      max: () => {
        const now = new Date()
        const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
        return koreaTime.getTime()
      },
      axisLabel: {
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        formatter: (value) => {
          const date = new Date(value)
          return date.toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        },
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: {
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        formatter: (value) => {
          // 숫자 포맷팅
          if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'
          if (value >= 1000) return (value / 1000).toFixed(1) + 'K'
          return value
        },
      },
    },
    series: lineSeries,
  }
}

const DrilldownTimeSeriesPanel = ({ selectedColKey, rowKeys, colorMap, onClose }) => {
  const [plusPercent, setPlusPercent] = useState(50)
  const [minusPercent, setMinusPercent] = useState(50)

  const { mutate, data, isPending, isError, reset } = useDrilldownTimeSeries()

  useEffect(() => {
    if (selectedColKey && rowKeys && rowKeys.length) {
      mutate({ selectedColKey, rowKeys })
    }
  }, [selectedColKey, rowKeys, mutate])

  const option = useMemo(
    () => buildDrilldownLineOption(data, plusPercent, minusPercent, colorMap),
    [data, plusPercent, minusPercent, colorMap],
  )

  const handleClose = () => {
    reset()
    onClose && onClose()
  }

  return (
    <div className='mt-4 rounded-lg border border-gray-200 p-3 text-xs text-gray-700'>
      <div className='mb-2 flex items-center justify-between'>
        <div className='flex flex-col gap-1'>
          <div className='text-sm font-semibold text-gray-800'>
            드릴다운 시계열 ({selectedColKey || '-'})
          </div>
          <div className='flex flex-wrap items-center gap-3 text-[11px] text-gray-500'>
            <span>중간값 기준 ± 범위 (%)</span>
            <label className='flex items-center gap-1'>
              <span className='text-gray-500'>-</span>
              <input
                type='number'
                className='w-16 rounded border border-gray-300 px-1 py-0.5 text-right text-[11px]'
                value={minusPercent}
                min={0}
                max={100}
                onChange={(e) => setMinusPercent(Number(e.target.value) || 0)}
              />
            </label>
            <label className='flex items-center gap-1'>
              <span className='text-gray-500'>+</span>
              <input
                type='number'
                className='w-16 rounded border border-gray-300 px-1 py-0.5 text-right text-[11px]'
                value={plusPercent}
                min={0}
                max={100}
                onChange={(e) => setPlusPercent(Number(e.target.value) || 0)}
              />
            </label>
          </div>
        </div>

        <button
          type='button'
          onClick={handleClose}
          className='rounded-full border border-gray-300 px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100'
        >
          닫기 ✕
        </button>
      </div>

      {isPending && (
        <div className='flex h-40 items-center justify-center text-gray-400'>로딩 중…</div>
      )}

      {isError && (
        <div className='flex h-40 items-center justify-center text-red-400'>
          드릴다운 데이터를 불러오지 못했습니다.
        </div>
      )}

      {!isPending && !isError && (
        <div className='h-[260px] w-full'>
          <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}

export default DrilldownTimeSeriesPanel
