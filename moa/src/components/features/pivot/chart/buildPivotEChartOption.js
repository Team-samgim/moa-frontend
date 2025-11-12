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

  const getValue = (yIdx, xIdx) => {
    const row = matrix[yIdx] || []
    const v = row[xIdx]
    return typeof v === 'number' ? v : 0
  }

  const legendData = yCategories

  if (chartType === 'multiplePie') {
    const pies = xCategories.map((xName, xIdx) => {
      const dataItems = yCategories.map((yName, yIdx) => ({
        name: yName,
        value: getValue(yIdx, xIdx),
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
      data: xCategories.map((_, xIdx) => getValue(yIdx, xIdx)),
      ...extra,
    }))

  const baseOption = {
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
      baseOption.series = makeSeriesLinesOrBars('line', { smooth: true })
      return baseOption
    }

    if (chartType === 'area') {
      baseOption.series = makeSeriesLinesOrBars('line', {
        smooth: true,
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
        data: xCategories.map((_, xIdx) => getValue(yIdx, xIdx)),
      }))
      return baseOption
    }
  }

  baseOption.xAxis = {
    type: 'category',
    data: xCategories,
    boundaryGap: true,
  }
  baseOption.yAxis = { type: 'value' }
  baseOption.series = makeSeriesLinesOrBars('bar')
  return baseOption
}
