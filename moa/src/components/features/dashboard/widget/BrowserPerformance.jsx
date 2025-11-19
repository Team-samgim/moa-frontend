// src/components/features/dashboard/widget/BrowserPerformance.jsx
import ReactECharts from 'echarts-for-react'
import PropTypes from 'prop-types'
import WidgetCard from '@/components/features/dashboard/WidgetCard'
import { useDashboardAggregated } from '@/hooks/queries/useDashboard'

const BrowserPerformance = ({ onClose }) => {
  const { data, isLoading, error } = useDashboardAggregated()
  const list = data?.browserPerformance ?? []

  let content

  if (isLoading && !list.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        브라우저 성능 데이터를 불러오는 중입니다...
      </div>
    )
  } else if (error) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-red-500'>
        브라우저 성능 데이터를 불러오지 못했습니다.
      </div>
    )
  } else if (!list.length) {
    content = (
      <div className='flex h-52 items-center justify-center text-sm text-gray-400'>
        표시할 브라우저 성능 데이터가 없습니다.
      </div>
    )
  } else {
    // 브라우저별 색상 매핑
    const browserColors = {
      Chrome: '#4285F4',
      Firefox: '#FF7139',
      Safari: '#006CFF',
      Edge: '#0078D7',
      Opera: '#FF1B2D',
      Brave: '#FB542B',
      Samsung: '#1428A0',
      'Http Client': '#95A5A6',
      Default: '#95A5A6',
    }

    const volumes = list.map((b) => b.requestCount ?? b.sessionCount ?? b.totalCount ?? 1)
    const totalVolume = volumes.reduce((sum, v) => sum + (v || 0), 0) || 1

    const nodes = list.map((b, idx) => {
      const load = b.avgPageLoadTime ?? 0
      const resp = b.avgResponseTime ?? 0
      const volume = volumes[idx] || 1
      const share = (volume / totalVolume) * 100

      const browserName = b.browser || 'Unknown'
      const color = browserColors[browserName] || browserColors.Default

      // 라벨은 길면 줄바꿈해서 버블 안에 들어가게 처리
      const displayName = browserName.length > 10 ? browserName.replace(/\s+/g, '\n') : browserName

      return {
        id: `browser-${idx}`,
        name: displayName,
        value: share,
        symbolSize: Math.max(40, Math.min(120, 40 + (share / 100) * 80)),
        itemStyle: {
          color: color,
          opacity: 0.85,
        },
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 12,
        },
        // tooltip에서 사용할 추가 데이터
        tooltipData: {
          name: browserName,
          load,
          resp,
          volume,
          share,
        },
      }
    })

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (param) => {
          if (!param || !param.data) return ''
          const { tooltipData } = param.data
          if (!tooltipData) return ''

          const { name: rawName, load, resp, volume, share } = tooltipData
          const name = rawName || param.data.name || 'Unknown'

          const safeShare = Number.isFinite(share) ? share : 0

          return [
            `<div style="font-size:12px;font-weight:600;margin-bottom:4px;">${name}</div>`,
            `<div style="font-size:12px;">사용 비중: <b>${safeShare.toFixed(1)}%</b></div>`,
            `<div style="font-size:12px;margin-top:4px;">페이지 로드: <b>${(load ?? 0).toFixed(2)} s</b></div>`,
            `<div style="font-size:12px;">응답 시간: <b>${(resp ?? 0).toFixed(2)} s</b></div>`,
            volume
              ? `<div style="font-size:11px;color:#666;margin-top:4px;">대략 트래픽 규모: ${volume.toLocaleString()} (상대적)</div>`
              : '',
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
            repulsion: 150,
            gravity: 0.1,
            edgeLength: 50,
            layoutAnimation: true,
          },
          emphasis: {
            focus: 'self',
            scale: 1.2,
            itemStyle: {
              opacity: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
            label: {
              show: true,
              fontSize: 12,
            },
          },
        },
      ],
    }

    content = <ReactECharts option={option} style={{ height: 280 }} />
  }

  return (
    <WidgetCard
      title='브라우저별 성능'
      description='브라우저별 평균 로드/응답 시간'
      icon='🌐'
      onClose={onClose}
      showSettings={false}
    >
      {content}
    </WidgetCard>
  )
}

BrowserPerformance.propTypes = {
  onClose: PropTypes.func,
}

export default BrowserPerformance
