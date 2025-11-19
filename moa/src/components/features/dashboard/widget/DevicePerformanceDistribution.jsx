import React from 'react'
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const DevicePerformanceDistribution = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.devicePerformanceDistribution ?? []

  const mapped = list.map((d) => ({
    deviceType: d.deviceType || 'Unknown',
    requestCount: d.requestCount ?? 0,
    trafficPercentage: d.trafficPercentage ?? 0,
    avgPageLoadTime: d.avgPageLoadTime ?? 0,
    avgResponseTime: d.avgResponseTime ?? 0,
  }))

  const totalReq = mapped.reduce((sum, d) => sum + d.requestCount, 0)

  let content

  if (isLoading && !mapped.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        디바이스별 성능 데이터를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        디바이스별 성능 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!mapped.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 디바이스별 성능 데이터가 없습니다.
      </div>
    )
  } else {
    // 디바이스 타입별 색상
    const deviceColors = {
      Mobile: '#10B981', // 초록
      Desktop: '#3B82F6', // 파랑
      Tablet: '#F59E0B', // 주황
      PC: '#6366F1', // 인디고
      Smartphone: '#14B8A6', // 청록
      Unknown: '#94A3B8', // 회색
    }

    const nodes = mapped.map((d, idx) => {
      const color = deviceColors[d.deviceType] || deviceColors.Unknown
      const size = Math.max(50, Math.min(140, 50 + (d.trafficPercentage / 100) * 90))

      return {
        id: `device-${idx}`,
        name: d.deviceType,
        value: d.trafficPercentage,
        symbolSize: size,
        itemStyle: {
          color: color,
          opacity: 0.85,
        },
        label: {
          show: true,
          formatter: (param) => {
            const name = param.data.name
            const percentage = param.data.value.toFixed(1)
            return `{name|${name}}\n{percent|${percentage}%}`
          },
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 600,
          rich: {
            name: {
              fontSize: 12,
              fontWeight: 700,
            },
            percent: {
              fontSize: 10,
              fontWeight: 500,
            },
          },
        },
        tooltipData: {
          requestCount: d.requestCount,
          trafficPercentage: d.trafficPercentage,
          avgPageLoadTime: d.avgPageLoadTime,
          avgResponseTime: d.avgResponseTime,
        },
      }
    })

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (param) => {
          if (!param || !param.data || !param.data.tooltipData) return ''
          const { tooltipData } = param.data
          const name = param.data.name || 'Unknown'

          return [
            `<div style="font-size:13px;font-weight:700;margin-bottom:6px;">${name}</div>`,
            `<div style="font-size:12px;">트래픽 비중: <b>${tooltipData.trafficPercentage.toFixed(1)}%</b></div>`,
            `<div style="font-size:12px;">요청 수: <b>${tooltipData.requestCount.toLocaleString()}건</b></div>`,
            `<div style="font-size:11px;margin-top:4px;color:#666;">페이지 로드: ${tooltipData.avgPageLoadTime.toFixed(2)}s</div>`,
            `<div style="font-size:11px;color:#666;">응답 시간: ${tooltipData.avgResponseTime.toFixed(2)}s</div>`,
          ].join('')
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: nodes,
          roam: false,
          force: {
            repulsion: 180,
            gravity: 0.12,
            edgeLength: 60,
            layoutAnimation: true,
          },
          emphasis: {
            focus: 'self',
            scale: 1.15,
            itemStyle: {
              opacity: 1,
              shadowBlur: 15,
              shadowColor: 'rgba(0, 0, 0, 0.4)',
            },
            label: {
              show: true,
              fontSize: 13,
            },
          },
        },
      ],
    }

    content = (
      <div className='flex flex-col gap-3'>
        {/* 상단 요약 KPI */}
        <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
          <span className='text-xs text-gray-600'>총 요청 수</span>
          <span className='text-sm font-bold text-gray-800'>{totalReq.toLocaleString()}건</span>
        </div>

        {/* 버블 차트 */}
        <div className='h-64'>
          <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    )
  }

  return (
    <WidgetCard
      title='디바이스별 트래픽 성능'
      description='디바이스 유형별 트래픽 비중 및 성능'
      icon='💻'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

DevicePerformanceDistribution.propTypes = {
  onClose: PropTypes.func,
}

export default DevicePerformanceDistribution
