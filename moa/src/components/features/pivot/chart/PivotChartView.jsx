import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { buildPivotEChartOption } from './buildPivotEChartOption'
import { PIVOT_SERIES_COLORS } from '@/constants/chartColors'
import { usePivotChartQuery } from '@/hooks/queries/useCharts'
import { usePivotChartStore } from '@/stores/pivotChartStore'

const PivotChartViewInner = ({ onChartClick }, ref) => {
  const chartType = usePivotChartStore((s) => s.chartType)
  const isChartMode = usePivotChartStore((s) => s.isChartMode)

  const { data, isLoading, isError } = usePivotChartQuery(isChartMode)

  const echartsRef = useRef(null)

  const seriesColorMap = useMemo(() => {
    const map = {}
    const yCategories = data?.yCategories || []
    const paletteLen = PIVOT_SERIES_COLORS.length || 1

    yCategories.forEach((name, idx) => {
      map[name] = PIVOT_SERIES_COLORS[idx % paletteLen]
    })

    return map
  }, [data])

  useImperativeHandle(ref, () => ({
    downloadImage: () => {
      const instance =
        echartsRef.current &&
        echartsRef.current.getEchartsInstance &&
        echartsRef.current.getEchartsInstance()

      if (!instance) {
        console.warn('ECharts 인스턴스를 찾을 수 없습니다.')
        return
      }

      const dataURL = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })

      const link = document.createElement('a')
      link.href = dataURL
      link.download = 'pivot-chart.png'
      link.click()
    },

    // 서버 업로드용 dataURL
    getImageDataUrl: () => {
      const instance =
        echartsRef.current &&
        echartsRef.current.getEchartsInstance &&
        echartsRef.current.getEchartsInstance()

      if (!instance) {
        console.warn('ECharts 인스턴스를 찾을 수 없습니다.')
        return null
      }

      return instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })
    },
  }))

  const handleChartClick = useCallback(
    (params) => {
      if (!data || !onChartClick) return
      if (chartType === 'multiplePie') return // 멀티 파이에서는 드릴다운 비활성화

      // groupedColumn / line / area / bar > params.name === 축 카테고리 이름
      const selectedColKey = params.name
      const rowKeys = data.yCategories || []

      if (!selectedColKey || !rowKeys.length) return

      onChartClick({
        selectedColKey,
        rowKeys,
        rawEvent: params,
        chartData: data,
        seriesColorMap,
      })
    },
    [data, onChartClick, chartType, seriesColorMap],
  )

  if (!isChartMode) {
    return (
      <div className='flex h-32 items-center justify-center text-xs text-gray-400'>
        차트 모드가 비활성화되어 있습니다.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center text-xs text-gray-400'>
        차트 데이터를 불러오는 중…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='flex h-64 items-center justify-center text-xs text-red-400'>
        차트 데이터를 불러오지 못했습니다.
      </div>
    )
  }

  const option = buildPivotEChartOption(chartType || 'groupedColumn', data)

  return (
    <div className='h-[360px] w-full'>
      <ReactECharts
        ref={echartsRef}
        option={option}
        style={{ width: '100%', height: '100%' }}
        onEvents={{ click: handleChartClick }}
      />
    </div>
  )
}

const PivotChartView = forwardRef(PivotChartViewInner)

export default PivotChartView
