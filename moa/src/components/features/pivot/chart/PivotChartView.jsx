import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import html2canvas from 'html2canvas-pro'
import { buildPivotEChartOption } from './buildPivotEChartOption'
import LoadingSpinner from '@/components/_common/LoadingSpinner'
import { PIVOT_SERIES_COLORS } from '@/constants/chartColors'
import { usePivotChartQuery } from '@/hooks/queries/useCharts'
import { usePivotChartStore } from '@/stores/pivotChartStore'

const PivotChartViewInner = ({ onChartClick }, ref) => {
  const chartType = usePivotChartStore((s) => s.chartType)
  const isChartMode = usePivotChartStore((s) => s.isChartMode)
  const getLayout = usePivotChartStore((s) => s.getLayout)

  const { data, isLoading, isError } = usePivotChartQuery(isChartMode)

  const echartsRefs = useRef([])
  const containerRef = useRef(null)
  const layout = getLayout()

  const isMultipleChartsMode = data?.charts && data.charts.length > 0

  const seriesColorMap = useMemo(() => {
    const map = {}

    if (isMultipleChartsMode) {
      const allYCategories = []
      const seen = new Set()

      data.charts.forEach((chart) => {
        const yCategories = chart.yCategories || chart.ycategories || []
        yCategories.forEach((name) => {
          if (!seen.has(name)) {
            seen.add(name)
            allYCategories.push(name)
          }
        })
      })

      const paletteLen = PIVOT_SERIES_COLORS.length || 1

      allYCategories.forEach((name, idx) => {
        map[name] = PIVOT_SERIES_COLORS[idx % paletteLen]
      })
    } else {
      const yCategories = data?.yCategories || []
      const paletteLen = PIVOT_SERIES_COLORS.length || 1

      yCategories.forEach((name, idx) => {
        map[name] = PIVOT_SERIES_COLORS[idx % paletteLen]
      })
    }

    return map
  }, [data, isMultipleChartsMode])

  useImperativeHandle(ref, () => ({
    downloadImage: async () => {
      if (isMultipleChartsMode) {
        if (!containerRef.current) {
          console.warn('컨테이너 요소를 찾을 수 없습니다.')
          return
        }

        try {
          const canvas = await html2canvas(containerRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
          })

          const dataURL = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = dataURL
          link.download = 'pivot-charts.png'
          link.click()
        } catch (error) {
          console.error('차트 캡처 실패:', error)
          throw error
        }
      } else {
        const instance =
          echartsRefs.current[0] &&
          echartsRefs.current[0].getEchartsInstance &&
          echartsRefs.current[0].getEchartsInstance()

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
      }
    },

    getImageDataUrl: async () => {
      if (isMultipleChartsMode) {
        if (!containerRef.current) {
          console.warn('컨테이너 요소를 찾을 수 없습니다.')
          return null
        }

        try {
          const canvas = await html2canvas(containerRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
          })

          return canvas.toDataURL('image/png')
        } catch (error) {
          console.error('차트 캡처 실패:', error)
          throw error
        }
      } else {
        const instance =
          echartsRefs.current[0] &&
          echartsRefs.current[0].getEchartsInstance &&
          echartsRefs.current[0].getEchartsInstance()

        if (!instance) {
          console.warn('ECharts 인스턴스를 찾을 수 없습니다.')
          return null
        }

        return instance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        })
      }
    },
  }))

  const handleChartClick = useCallback(
    (params, columnKey = null) => {
      if (!data || !onChartClick) return
      if (chartType === 'multiplePie') return

      if (isMultipleChartsMode) {
        const chart = data.charts.find((c) => c.columnKey === columnKey)
        if (!chart) return

        const rowKeys = chart.yCategories || chart.ycategories || []
        if (!columnKey || !rowKeys.length) return

        onChartClick({
          selectedColKey: columnKey,
          rowKeys,
          seriesColorMap,
        })
      } else {
        const selectedColKey = params.name
        const rowKeys = data.yCategories || []

        if (!selectedColKey || !rowKeys.length) return

        onChartClick({
          selectedColKey,
          rowKeys,
          seriesColorMap,
        })
      }
    },
    [data, onChartClick, chartType, seriesColorMap, isMultipleChartsMode],
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
      <div className='h-[360px] w-full'>
        <LoadingSpinner className='h-full' size={64} />
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

  // ===== 다중 차트 모드 렌더링 =====
  if (isMultipleChartsMode) {
    const charts = data.charts || []
    const chartsPerRow = layout.chartsPerRow || 2

    return (
      <div ref={containerRef} className='w-full bg-white p-4'>
        <div
          className='grid gap-4'
          style={{
            gridTemplateColumns: `repeat(${chartsPerRow}, 1fr)`,
          }}
        >
          {charts.map((chart, idx) => {
            const yCategories = chart.yCategories || chart.ycategories || []

            const option = buildPivotEChartOption(chartType || 'groupedColumn', {
              xCategories: [chart.columnKey],
              yCategories: yCategories,
              series: chart.series,
              seriesColorMap: seriesColorMap,
            })

            return (
              <div key={chart.columnKey} className='rounded border border-gray-200 bg-white p-3'>
                <h3 className='mb-2 text-center text-sm font-medium text-gray-800'>
                  {chart.columnKey}
                </h3>
                <div className='h-[300px]'>
                  <ReactECharts
                    key={`${chart.columnKey}-${chartType}`}
                    ref={(el) => (echartsRefs.current[idx] = el)}
                    option={option}
                    style={{ width: '100%', height: '100%' }}
                    onEvents={{
                      click: (params) => handleChartClick(params, chart.columnKey),
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ===== 단일 차트 모드 렌더링 =====
  const option = buildPivotEChartOption(chartType || 'groupedColumn', {
    ...data,
    seriesColorMap,
  })

  return (
    <div className='h-[360px] w-full'>
      <ReactECharts
        key={chartType}
        ref={(el) => (echartsRefs.current[0] = el)}
        option={option}
        style={{ width: '100%', height: '100%' }}
        onEvents={{ click: handleChartClick }}
      />
    </div>
  )
}

const PivotChartView = forwardRef(PivotChartViewInner)

export default PivotChartView
