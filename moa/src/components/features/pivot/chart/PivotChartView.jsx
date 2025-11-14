import { forwardRef, useImperativeHandle, useRef } from 'react'
import ReactECharts from 'echarts-for-react'
import { buildPivotEChartOption } from './buildPivotEChartOption'
import { usePivotChartQuery } from '@/hooks/queries/useCharts'
import { usePivotChartStore } from '@/stores/pivotChartStore'

const PivotChartViewInner = (_, ref) => {
  const chartType = usePivotChartStore((s) => s.chartType)
  const isChartMode = usePivotChartStore((s) => s.isChartMode)

  const { data, isLoading, isError } = usePivotChartQuery(isChartMode)

  const echartsRef = useRef(null)

  useImperativeHandle(ref, () => ({
    // 기존 로컬 다운로드 (원하면 계속 사용 가능)
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

    // 서버 업로드용 dataURL 반환
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
  // 이하 기존 내용 동일
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
      <ReactECharts ref={echartsRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

const PivotChartView = forwardRef(PivotChartViewInner)

export default PivotChartView
