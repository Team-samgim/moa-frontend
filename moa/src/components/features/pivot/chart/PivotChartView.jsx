import ReactECharts from 'echarts-for-react'
import { buildPivotEChartOption } from './buildPivotEChartOption'
import { usePivotChartQuery } from '@/hooks/queries/useCharts'
import { usePivotChartStore } from '@/stores/pivotChartStore'

const PivotChartView = () => {
  const chartType = usePivotChartStore((s) => s.chartType)
  const isChartMode = usePivotChartStore((s) => s.isChartMode)

  const { data, isLoading, isError } = usePivotChartQuery(isChartMode)

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
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default PivotChartView
