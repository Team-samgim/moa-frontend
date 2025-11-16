import { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { useDrilldownTimeSeries } from '@/hooks/queries/useCharts'

const buildDrilldownLineOption = (data, plusPercent, minusPercent) => {
  if (!data || !data.series || !data.series.length) {
    return {
      title: { text: '드릴다운 데이터가 없습니다', left: 'center', top: 'middle' },
    }
  }

  const { series, globalMedian, globalMinTime, globalMaxTime, seriesMedianMap } = data

  const median = typeof globalMedian === 'number' ? globalMedian : null
  const upper =
    median !== null
      ? median * (1 + (typeof plusPercent === 'number' ? plusPercent : 0) / 100)
      : null
  const lower =
    median !== null
      ? median * (1 - (typeof minusPercent === 'number' ? minusPercent : 0) / 100)
      : null

  const lineSeries = series.map((s) => ({
    name: s.rowKey,
    type: 'line',
    showSymbol: false,
    smooth: true,
    data: (s.points || []).map((p) => [p.ts, p.value]),
  }))

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
        label: {
          formatter: () => `Median: ${median.toFixed(2)}`,
        },
        lineStyle: {
          type: 'dashed',
        },
        data: [{ yAxis: median }],
      },
      markArea: {
        itemStyle: {
          opacity: 0.08,
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
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params) => {
        if (!params || !params.length) return ''
        const ts = params[0].value[0]
        const date = new Date(ts)
        const lines = []

        lines.push(
          date.toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
          }),
        )

        if (median !== null) {
          lines.push(`글로벌 중간값: ${median.toFixed(2)}`)
        }

        params.forEach((p) => {
          const value = p.value[1]
          const seriesMedian =
            seriesMedianMap && typeof seriesMedianMap[p.seriesName] === 'number'
              ? seriesMedianMap[p.seriesName]
              : null

          let line = `${p.marker} ${p.seriesName}: ${value.toFixed(2)}`
          if (seriesMedian !== null) {
            line += ` (median: ${seriesMedian.toFixed(2)})`
          }
          lines.push(line)
        })

        return lines.join('<br/>')
      },
    },
    legend: {
      data: series.map((s) => s.rowKey),
    },
    grid: {
      left: 40,
      right: 20,
      top: 40,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
    },
    series: lineSeries,
  }
}

const DrilldownTimeSeriesPanel = ({ selectedColKey, rowKeys, onClose }) => {
  const [plusPercent, setPlusPercent] = useState(50) // + 범위 (%)
  const [minusPercent, setMinusPercent] = useState(50) // - 범위 (%)

  const { mutate, data, isPending, isError, reset } = useDrilldownTimeSeries()

  useEffect(() => {
    if (selectedColKey && rowKeys && rowKeys.length) {
      mutate({ selectedColKey, rowKeys })
    }
  }, [selectedColKey, rowKeys, mutate])

  const option = useMemo(
    () => buildDrilldownLineOption(data, plusPercent, minusPercent),
    [data, plusPercent, minusPercent],
  )

  const handleClose = () => {
    reset()
    onClose && onClose()
  }

  return (
    <div className='mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700'>
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
