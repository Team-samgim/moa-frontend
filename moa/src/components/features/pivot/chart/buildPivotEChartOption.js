import { PIVOT_SERIES_COLORS } from '@/constants/chartColors'

function fillNullOrMissingWithZero(raw) {
  const data = raw.slice()
  const n = data.length

  const indices = []
  for (let i = 0; i < n; i++) {
    const v = data[i]
    if (typeof v === 'number' && !Number.isNaN(v)) {
      indices.push(i)
    }
  }

  // 유효한 값이 하나도 없는 경우: 전체 0
  if (!indices.length) {
    return new Array(n).fill(0)
  }

  const first = indices[0]
  const last = indices[indices.length - 1]

  // first~last 사이의 null/NaN: 0
  for (let i = first; i <= last; i++) {
    const v = data[i]
    if (v === null || Number.isNaN(v)) {
      data[i] = 0
    }
  }

  // 양 끝단도 0 처리
  for (let i = 0; i < first; i++) data[i] = 0
  for (let i = last + 1; i < n; i++) data[i] = 0

  return data
}

export function buildPivotEChartOption(chartType, data) {
  const xCategories = data?.xCategories || []
  const yCategories = data?.yCategories || []
  const series = data?.series || []

  if (!xCategories.length || !yCategories.length || !series.length) {
    return {
      title: { text: '데이터가 없습니다', left: 'center', top: 'middle' },
    }
  }

  const firstSeries = series[0]
  const matrix = firstSeries.values || [] // [yIdx][xIdx]

  // raw value 숫자 아닌 경우:  null
  const getRawValue = (yIdx, xIdx) => {
    const row = matrix[yIdx] || []
    const v = row[xIdx]
    return typeof v === 'number' && !Number.isNaN(v) ? v : null
  }

  // 바 차트 등에 사용하는 경우: null > 0 치환
  const getValueOrZero = (yIdx, xIdx) => {
    const v = getRawValue(yIdx, xIdx)
    return v === null ? 0 : v
  }

  const legendData = yCategories

  if (chartType === 'multiplePie') {
    const pies = xCategories.map((xName, xIdx) => {
      const dataItems = yCategories.map((yName, yIdx) => ({
        name: yName,
        value: getValueOrZero(yIdx, xIdx),
      }))

      const col = xIdx % 3
      const row = Math.floor(xIdx / 3)
      const centerX = 20 + col * 30 // 20%, 50%, 80%
      const centerY = 30 + row * 40 // 30%, 70%

      return {
        name: xName,
        type: 'pie',
        radius: '25%',
        center: [`${centerX}%`, `${centerY}%`],
        data: dataItems,
        label: {
          formatter: '{b}: {d}%',
          overflow: 'truncate',
        },
      }
    })

    return {
      color: PIVOT_SERIES_COLORS,
      tooltip: { trigger: 'item' },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: yCategories,
      },
      series: pies,
    }
  }

  const makeSeriesLinesOrBars = (type, extra = {}) =>
    yCategories.map((yName, yIdx) => ({
      name: yName,
      type,
      data: xCategories.map((_, xIdx) => getValueOrZero(yIdx, xIdx)),
      // TODO: 시리즈 별 색 고정
      // itemStyle: { color: PIVOT_SERIES_COLORS[yIdx % PIVOT_SERIES_COLORS.length] },
      ...extra,
    }))

  const makeLineLikeSeries = (extra = {}) =>
    yCategories.map((yName, yIdx) => {
      const raw = xCategories.map((_, xIdx) => getRawValue(yIdx, xIdx))
      const filled = fillNullOrMissingWithZero(raw)

      return {
        name: yName,
        type: 'line',
        data: filled,
        smooth: true,
        showSymbol: true,
        // itemStyle: { color: PIVOT_SERIES_COLORS[yIdx % PIVOT_SERIES_COLORS.length] },
        ...extra,
      }
    })

  const baseOption = {
    color: PIVOT_SERIES_COLORS,
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: legendData,
    },
    grid: {
      left: 40,
      right: 20,
      top: 40,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {},
    yAxis: {},
    series: [],
  }

  if (
    chartType === 'groupedColumn' ||
    chartType === 'stackedColumn' ||
    chartType === 'line' ||
    chartType === 'area'
  ) {
    baseOption.xAxis = {
      type: 'category',
      data: xCategories,
      boundaryGap: chartType === 'groupedColumn' || chartType === 'stackedColumn',
    }
    baseOption.yAxis = {
      type: 'value',
      min: 0,
    }

    if (chartType === 'groupedColumn') {
      baseOption.series = makeSeriesLinesOrBars('bar')
      return baseOption
    }

    if (chartType === 'stackedColumn') {
      baseOption.series = makeSeriesLinesOrBars('bar', { stack: 'total' })
      return baseOption
    }

    if (chartType === 'line') {
      baseOption.series = makeLineLikeSeries()
      return baseOption
    }

    if (chartType === 'area') {
      baseOption.series = makeLineLikeSeries({
        stack: 'total',
        areaStyle: {},
        emphasis: { focus: 'series' },
      })
      return baseOption
    }
  }

  if (chartType === 'groupedBar' || chartType === 'stackedBar' || chartType === 'dot') {
    baseOption.yAxis = {
      type: 'category',
      data: xCategories,
    }
    baseOption.xAxis = {
      type: 'value',
      min: 0,
    }

    if (chartType === 'groupedBar') {
      baseOption.series = makeSeriesLinesOrBars('bar')
      return baseOption
    }

    if (chartType === 'stackedBar') {
      baseOption.series = makeSeriesLinesOrBars('bar', { stack: 'total' })
      return baseOption
    }

    if (chartType === 'dot') {
      baseOption.series = yCategories.map((yName, yIdx) => ({
        name: yName,
        type: 'scatter',
        symbolSize: 8,
        data: xCategories.map((_, xIdx) => getValueOrZero(yIdx, xIdx)),
        // itemStyle: { color: PIVOT_SERIES_COLORS[yIdx % PIVOT_SERIES_COLORS.length] },
      }))
      return baseOption
    }
  }

  baseOption.xAxis = {
    type: 'category',
    data: xCategories,
    boundaryGap: true,
  }
  baseOption.yAxis = { type: 'value', min: 0 }
  baseOption.series = makeSeriesLinesOrBars('bar')
  return baseOption
}
