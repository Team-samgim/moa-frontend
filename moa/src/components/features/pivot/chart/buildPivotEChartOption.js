import { PIVOT_SERIES_COLORS } from '@/constants/chartColors'

// 숫자를 사람이 읽기 쉬운 형식으로 변환
function formatNumber(value) {
  if (value === 0) return '0'

  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1000000000) {
    return sign + (abs / 1000000000).toFixed(1) + 'B'
  }
  if (abs >= 1000000) {
    return sign + (abs / 1000000).toFixed(1) + 'M'
  }
  if (abs >= 1000) {
    return sign + (abs / 1000).toFixed(1) + 'K'
  }
  return sign + abs.toString()
}

export function buildPivotEChartOption(chartType, data) {
  // 대소문자 모두 지원
  const xCategories = data?.xCategories || data?.xcategories || []
  const yCategories = data?.yCategories || data?.ycategories || []
  const series = data?.series || []
  const seriesColorMap = data?.seriesColorMap || {}

  if (!xCategories.length || !yCategories.length || !series.length) {
    return {
      title: { text: '데이터가 없습니다', left: 'center', top: 'middle' },
    }
  }

  const firstSeries = series[0]
  const matrix = firstSeries.values || [] // [yIdx][xIdx]

  // X축이 단일 값인 경우 (다중 차트 모드)
  const isSingleColumn = xCategories.length === 1

  // raw value 숫자 아닌 경우: null
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
      textStyle: {
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      tooltip: {
        trigger: 'item',
        textStyle: {
          fontFamily:
            'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      },
      legend: {
        bottom: 10,
        left: 'center',
        orient: 'horizontal',
        type: 'scroll',
        data: yCategories,
        formatter: (name) => {
          if (name.length > 20) {
            return name.substring(0, 20) + '...'
          }
          return name
        },
        tooltip: {
          show: true,
        },
        textStyle: {
          fontFamily:
            'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      },
      series: pies,
    }
  }

  const makeSeriesLinesOrBars = (type, extra = {}) =>
    yCategories.map((yName, yIdx) => {
      const color = seriesColorMap[yName]
      return {
        name: yName,
        type,
        data: xCategories.map((_, xIdx) => getValueOrZero(yIdx, xIdx)),
        // 막대 차트일 때 최대 너비 설정
        ...(type === 'bar' ? { barMaxWidth: 40 } : {}),
        // 색상 매핑이 있으면 적용
        ...(color ? { itemStyle: { color }, lineStyle: { color } } : {}),
        ...extra,
      }
    })

  const baseOption = {
    color: PIVOT_SERIES_COLORS,
    // 전역 폰트 설정
    textStyle: {
      fontFamily:
        'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => {
        // 툴팁에는 원래 값도 함께 표시
        return `${formatNumber(value)} (${value.toLocaleString()})`
      },
      textStyle: {
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    },
    legend: {
      data: legendData,
      bottom: 10, // 차트 아래로 이동
      left: 'center',
      orient: 'horizontal',
      type: 'scroll', // 많은 항목이 있을 때 스크롤 가능하게
      pageIconSize: 12,
      formatter: (name) => {
        // 긴 이름은 ... 으로 축약 (최대 20자)
        if (name.length > 20) {
          return name.substring(0, 20) + '...'
        }
        return name
      },
      tooltip: {
        show: true, // 범례 항목에 호버 시 전체 이름 표시
      },
      textStyle: {
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    },
    grid: {
      left: 40,
      right: 20,
      top: 30,
      bottom: 60, // 범례 공간 확보를 위해 증가
      containLabel: true,
    },
    xAxis: {},
    yAxis: {},
    series: [],
  }

  // 세로 막대 차트들
  if (chartType === 'groupedColumn' || chartType === 'stackedColumn') {
    baseOption.xAxis = {
      type: 'category',
      data: xCategories,
      boundaryGap: true,
      // 단일 컬럼일 때 축 레이블 숨김
      axisLabel: isSingleColumn
        ? { show: false }
        : {
            fontFamily:
              'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
    }
    baseOption.yAxis = {
      type: 'value',
      min: 0,
      axisLabel: {
        formatter: formatNumber,
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    }

    if (chartType === 'groupedColumn') {
      baseOption.series = makeSeriesLinesOrBars('bar')
      return baseOption
    }

    if (chartType === 'stackedColumn') {
      baseOption.series = makeSeriesLinesOrBars('bar', { stack: 'total' })
      return baseOption
    }
  }

  // 가로 막대 차트들
  if (chartType === 'groupedBar' || chartType === 'stackedBar') {
    baseOption.yAxis = {
      type: 'category',
      data: xCategories,
      // 단일 컬럼일 때 축 레이블 숨김
      axisLabel: isSingleColumn
        ? { show: false }
        : {
            fontFamily:
              'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
    }
    baseOption.xAxis = {
      type: 'value',
      min: 0,
      axisLabel: {
        formatter: formatNumber,
        rotate: 0, // 가로로 표시
        fontFamily:
          'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    }

    if (chartType === 'groupedBar') {
      baseOption.series = makeSeriesLinesOrBars('bar')
      return baseOption
    }

    if (chartType === 'stackedBar') {
      baseOption.series = makeSeriesLinesOrBars('bar', { stack: 'total' })
      return baseOption
    }
  }

  // 기본값: 그룹 세로 막대
  baseOption.xAxis = {
    type: 'category',
    data: xCategories,
    boundaryGap: true,
    axisLabel: isSingleColumn
      ? { show: false }
      : {
          fontFamily:
            'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
  }
  baseOption.yAxis = {
    type: 'value',
    min: 0,
    axisLabel: {
      formatter: formatNumber,
      fontFamily:
        'Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  }
  baseOption.series = makeSeriesLinesOrBars('bar')
  return baseOption
}
