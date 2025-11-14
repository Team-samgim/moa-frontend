import React, { useMemo, useRef, useEffect } from 'react'
import { GaugeChart } from 'echarts/charts'
import { TooltipComponent, TitleComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import RefreshIcon from '@/assets/icons/refresh.svg?react'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useTcpErrorRate } from '@/hooks/queries/useDashboard'

// ECharts (tree-shakable imports)

echarts.use([GaugeChart, TooltipComponent, TitleComponent, CanvasRenderer])

const Row = ({ label, value }) => {
  const pct = Number(value ?? 0)
  const num = Number.isFinite(pct) ? (pct <= 1 ? pct * 100 : pct) : 0
  const display = Number.isFinite(num) ? `${num.toFixed(1)}%` : '-'
  return (
    <div className='flex items-center justify-between'>
      <span className='text-slate-700'>{label}</span>
      <span className='font-semibold'>{display}</span>
    </div>
  )
}

const TcpErrorGauge = ({ onClose }) => {
  const { data, isError } = useTcpErrorRate()
  const chartRef = useRef(null)

  const percent = useMemo(() => {
    const v = Number(data?.totalErrorRate ?? 0)
    const p = v <= 1 ? v * 100 : v // 0~1 또는 0~100 둘 다 대응
    if (!Number.isFinite(p)) return 0
    return Math.max(0, Math.min(100, p))
  }, [data])

  const levelText = useMemo(() => {
    if (percent < 2) return '정상 범위'
    if (percent < 5) return '주의 필요'
    return '높음'
  }, [percent])

  const levelColor = percent < 2 ? '#16a34a' : percent < 5 ? '#f59e0b' : '#ef4444'

  const option = useMemo(() => {
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 0,
          radius: '100%',
          center: ['50%', '70%'],
          pointer: { show: false },
          progress: {
            show: true,
            roundCap: true,
            width: 18,
            itemStyle: { color: levelColor },
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, '#E5E7EB']], // 배경 링 색 (slate-200 근사)
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          detail: {
            offsetCenter: [0, '-10%'],
            valueAnimation: true,
            formatter: (val) => `{v|${val.toFixed(1)}%}\n{s|${levelText}}`,
            rich: {
              v: { fontSize: 36, fontWeight: 800, color: levelColor },
              s: { fontSize: 14, color: '#475569', padding: [4, 0, 0, 0] },
            },
          },
          data: [{ value: percent }],
        },
      ],
    }
  }, [percent, levelColor, levelText])

  // 컨테이너 리사이즈 대응
  useEffect(() => {
    const inst = chartRef.current?.getEchartsInstance?.()
    if (!inst) return

    const el = inst.getDom()
    const ro = new ResizeObserver(() => {
      // dispose 체크 추가
      if (!inst.isDisposed()) {
        inst.resize()
      }
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
    }
  }, []) // option 의존성 제거

  return (
    <WidgetCard
      icon={<RefreshIcon />}
      title='TCP 에러율'
      description='실시간 모니터링'
      showSettings={true}
      showClose={true}
      onSettings={() => console.log('TCP 에러율 설정')}
      onClose={onClose}
    >
      <div className='flex flex-col gap-4'>
        <div className='h-56'>
          {isError ? (
            <div className='p-3 text-sm text-red-500'>데이터를 불러오지 못했어요.</div>
          ) : (
            <ReactECharts
              ref={chartRef}
              echarts={echarts}
              option={option}
              notMerge={true}
              lazyUpdate={true}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
        <div className='grid grid-cols-1 gap-1 text-sm'>
          <Row label='Retransmission' value={data?.retransmissionRate} />
          <Row label='Out of Order' value={data?.outOfOrderRate} />
          <Row label='Lost Segment' value={data?.lostSegmentRate} />
        </div>
      </div>
    </WidgetCard>
  )
}
// PropTypes 추가
TcpErrorGauge.propTypes = {
  onClose: PropTypes.func,
}

export default TcpErrorGauge
