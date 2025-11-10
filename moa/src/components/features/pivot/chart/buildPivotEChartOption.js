export function buildPivotEChartOption(chartType, data) {
  const categories = data?.categories || []
  const series = data?.series || []

  if (!categories.length || !series.length) {
    return {
      title: { text: '데이터가 없습니다', left: 'center', top: 'middle' },
    }
  }

  if (chartType === 'pie') {
    const s = series[0]
    return {
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: s.label,
          type: 'pie',
          radius: '60%',
          data: categories.map((name, idx) => ({
            name,
            value: s.data[idx] ?? 0,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.4)',
            },
          },
        },
      ],
    }
  }

  const baseOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: series.map((s) => s.label),
    },
    grid: {
      left: 40,
      right: 20,
      top: 40,
      bottom: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: chartType === 'bar',
    },
    yAxis: {
      type: 'value',
    },
    series: [],
  }

  if (chartType === 'bar') {
    baseOption.series = series.map((s) => ({
      name: s.label,
      type: 'bar',
      data: s.data,
    }))
    return baseOption
  }

  if (chartType === 'line') {
    baseOption.series = series.map((s) => ({
      name: s.label,
      type: 'line',
      smooth: true,
      stack: 'total',
      data: s.data,
    }))
    return baseOption
  }

  if (chartType === 'area') {
    baseOption.series = series.map((s) => ({
      name: s.label,
      type: 'line',
      smooth: true,
      stack: 'total',
      areaStyle: {},
      emphasis: { focus: 'series' },
      data: s.data,
    }))
    return baseOption
  }

  return baseOption
}
