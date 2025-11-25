import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as echarts from 'echarts'
import SideKickIcon2 from '@/assets/icons/side-kick2.svg?react'
import { userNavigations } from '@/constants/navigations'

// ==================== 색상 상수 (chartColor.js에서 가져옴) ====================
const PIVOT_SERIES_COLORS = ['#3877BE', '#FDC973', '#C4D398', '#FFC5C5', '#A2DDEA', '#D0BEF0']
const DRILLDOWN_MEDIAN_COLOR = '#999999'
const DRILLDOWN_BAND_COLOR = 'rgba(37, 99, 235, 0.5)'

// ==================== 유틸리티 함수 ====================
const getKoreanTime = () => new Date()

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// ==================== 상수 ====================
// 🔥 국가 이름을 GeoJSON과 일치하도록 변경!
const COUNTRIES = [
  'South Korea',
  'Japan',
  'United States of America', // ← 변경!
  'China',
  'Germany',
  'Singapore',
]
const COUNTRY_COORDS = {
  'South Korea': [127.7669, 35.9078],
  Japan: [138.2529, 36.2048],
  'United States of America': [-95.7129, 37.0902], // ← 변경!
  China: [104.1954, 35.8617],
  Germany: [10.4515, 51.1657],
  Singapore: [103.8198, 1.3521],
}
const URIS = [
  'www.pharmpay.co.kr',
  '/barcode/truepix_count_detail.php',
  'm.education.or.kr',
  '/files/2024/04/12/mamuni.js',
  '/api/users',
  '/api/products',
]
const OS_LIST = ['Windows', 'macOS', 'Linux', 'iOS', 'Android']
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge']

// ==================== 데이터 생성기 ====================
let lastNormalValue = 1.2

const generateNormalData = (settings) => {
  const change = (Math.random() - 0.5) * 0.4
  lastNormalValue = Math.max(
    settings.normalMin,
    Math.min(settings.normalMax, lastNormalValue + change),
  )

  return {
    ts_page: lastNormalValue,
    country_name_res: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    http_uri: URIS[Math.floor(Math.random() * URIS.length)],
    user_agent_opperating_platform: OS_LIST[Math.floor(Math.random() * OS_LIST.length)],
    browser: BROWSERS[Math.floor(Math.random() * BROWSERS.length)],
    ts_page_resInit_gap: Math.random() * 0.3,
    timestamp: getKoreanTime(),
    isAnomaly: false,
    totalTraffic: Math.floor(Math.random() * 3 + 5),
    clientError: Math.floor(Math.random() * 2),
    serverError: 0,
  }
}

const generateAnomalyData = () => ({
  ts_page: 5.5 + Math.random() * 3.5, // ✅ 5.5 ~ 9.0초 고정
  country_name_res: COUNTRIES[Math.floor(Math.random() * 3)],
  http_uri: URIS[Math.floor(Math.random() * 2)],
  user_agent_opperating_platform: OS_LIST[Math.floor(Math.random() * OS_LIST.length)],
  browser: BROWSERS[Math.floor(Math.random() * BROWSERS.length)],
  ts_page_resInit_gap: 0.5 + Math.random() * 1,
  timestamp: getKoreanTime(),
  isAnomaly: true,
  totalTraffic: Math.floor(Math.random() * 4 + 8),
  clientError: Math.floor(Math.random() * 3 + 2),
  serverError: Math.floor(Math.random() * 2 + 1),
})

// ==================== 토스트 컴포넌트 ====================
const Toast = ({ data, onClose, onClick }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#fff5f5',
        border: '1px solid #fca5a5',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: '360px',
        maxWidth: '420px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        animation: 'slideIn 0.3s ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🚨</span>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontWeight: '600',
              color: '#dc2626',
              marginBottom: '8px',
              fontSize: '14px',
            }}
          >
            이상 트래픽 감지!
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>
            <div>
              ⏱️ 로드 시간: <strong style={{ color: '#ef4444' }}>{data.ts_page.toFixed(2)}s</strong>
            </div>
            <div>🌍 국가: {data.country_name_res}</div>
            <div>📱 OS: {data.user_agent_opperating_platform}</div>
          </div>
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: PIVOT_SERIES_COLORS[0],
              fontWeight: '500',
            }}
          >
            👆 클릭하여 상세 정보 확인
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            fontSize: '18px',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}

// ==================== 설정 모달 ====================
const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState(settings)
  useEffect(() => setLocalSettings(settings), [settings])
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
          ⚙️ 정상 범위 설정
        </h3>
        {[
          { label: '페이지 로드 시간 - 최소값 (초)', key: 'normalMin' },
          { label: '페이지 로드 시간 - 최대값 (초)', key: 'normalMax' },
          { label: '응답 초기 시간 임계값 (초)', key: 'resInitThreshold' },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#555' }}
            >
              {label}
            </label>
            <input
              type='number'
              step='0.1'
              value={localSettings[key]}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, [key]: parseFloat(e.target.value) })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              onSave(localSettings)
              onClose()
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: PIVOT_SERIES_COLORS[0],
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== 위젯 카드 ====================
const WidgetCard = ({
  title,
  subtitle,
  description,
  children,
  onSettingsClick,
  gridSpan = 3,
  draggable = false,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDragEnd,
  widgetId,
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      data-widget-id={widgetId}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      style={{
        gridColumn: `span ${gridSpan}`,
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
          position: 'relative',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
              }}
            >
              <span>
                <SideKickIcon2 />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                {title}
              </h3>
              {description && (
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '9999px',
                    border: '1px solid #d1d5db',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#6b7280',
                    cursor: 'default',
                    backgroundColor: '#f9fafb',
                    position: 'relative',
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  i
                  {showTooltip && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '22px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '200px',
                        maxWidth: '260px',
                        padding: '8px 10px',
                        backgroundColor: '#111827',
                        color: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '11px',
                        lineHeight: 1.4,
                        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                        zIndex: 20,
                        whiteSpace: 'normal',
                      }}
                    >
                      {description}
                    </div>
                  )}
                </span>
              )}
            </div>
          </div>
          {subtitle && (
            <p style={{ margin: '4px 0 0 20px', fontSize: '12px', color: '#6b7280' }}>{subtitle}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '16px',
              }}
            >
              ⚙️
            </button>
          )}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

// ==================== 페이지 로드 시간 추이 ====================
const PageLoadTimeChart = ({ data, settings, onAnomalyClick, showNormalRange }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (!chartInstance.current) chartInstance.current = echarts.init(chartRef.current)

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)
    const times = sortedData.map((d) => formatTime(d.timestamp))

    const avgData = sortedData.map((d) => ({
      value: d.ts_page.toFixed(2),
      itemStyle: d.isAnomaly
        ? {
            color: '#ef4444',
            borderColor: '#ef4444',
            borderWidth: 2,
            shadowBlur: 6,
            shadowColor: 'rgba(239, 68, 68, 0.5)',
          }
        : { color: PIVOT_SERIES_COLORS[0] },
      symbolSize: d.isAnomaly ? 12 : 6,
      symbol: 'circle',
      itemData: d,
    }))

    const p95Data = sortedData.map((d) => (d.ts_page * 1.2).toFixed(2))
    const p99Data = sortedData.map((d) => (d.ts_page * 1.4).toFixed(2))

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          if (!params?.length) return ''
          const idx = params[0].dataIndex
          const d = sortedData[idx]
          if (d.isAnomaly) {
            return `<div style="padding:8px;">
              <div style="font-weight:600;color:#ef4444;margin-bottom:8px;">🚨 이상 감지!</div>
              <div>시간: ${formatTime(d.timestamp)}</div>
              <div>로드 시간: <b style="color:#ef4444;">${d.ts_page.toFixed(2)}s</b></div>
              <div>URI: ${d.http_uri}</div>
              <div>국가: ${d.country_name_res}</div>
              <div>OS: ${d.user_agent_opperating_platform}</div>
              <div style="color:${PIVOT_SERIES_COLORS[0]};margin-top:8px;font-size:11px;">👆 클릭하여 상세 검색</div>
            </div>`
          }
          return `<div style="padding:4px;"><b>${params[0].axisValue}</b><br/>
            ${params.map((p) => `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value}s`).join('<br/>')}</div>`
        },
      },
      legend: {
        data: ['평균', 'P95', 'P99', '정상 범위'],
        selected: {
          평균: true,
          P95: true,
          P99: true,
          '정상 범위': showNormalRange, // ✅ 동적으로 설정
        },
        top: 5,
        right: 10,
        textStyle: { fontSize: 12 },
      },
      grid: { left: '50px', right: '20px', top: '50px', bottom: '30px' },
      xAxis: {
        type: 'category',
        data: times,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 10, rotate: 45 },
      },
      yAxis: {
        type: 'value',
        name: '로드 시간 (초)',
        nameTextStyle: { color: '#6b7280', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        min: 0,
      },
      // ✅ 데이터 series 먼저
      series: [
        {
          name: '평균',
          type: 'line',
          smooth: true,
          data: avgData,
          symbol: 'circle',
          lineStyle: { color: PIVOT_SERIES_COLORS[0], width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: PIVOT_SERIES_COLORS[0] + '33' },
              { offset: 1, color: PIVOT_SERIES_COLORS[0] + '05' },
            ]),
          },
        },
        {
          name: 'P95',
          type: 'line',
          smooth: true,
          data: p95Data,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: PIVOT_SERIES_COLORS[2], width: 2 },
          itemStyle: { color: PIVOT_SERIES_COLORS[2] },
        },
        {
          name: 'P99',
          type: 'line',
          smooth: true,
          data: p99Data,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: PIVOT_SERIES_COLORS[1], width: 2 },
          itemStyle: { color: PIVOT_SERIES_COLORS[1] },
        },
        // ✅ 정상 범위는 맨 뒤 (범례에서 제외됨)
        {
          name: '정상 범위',
          type: 'line',
          markArea: {
            silent: true,
            itemStyle: {
              color: 'rgba(132, 204, 22, 0.15)', // 녹색 반투명
            },
            data: [
              [
                {
                  name: '정상 범위',
                  yAxis: settings.normalMin,
                },
                {
                  yAxis: settings.normalMax,
                },
              ],
            ],
            label: {
              show: true,
              position: 'insideTop',
              formatter: `정상 범위 (${settings.normalMin}s ~ ${settings.normalMax}s)`,
              fontSize: 11,
              color: '#84cc16',
              fontWeight: 'bold',
            },
          },
        },
      ],
    }

    chartInstance.current.setOption(option, true)
    chartInstance.current.off('click')
    chartInstance.current.on('click', (params) => {
      if (params.seriesName === '평균') {
        const d = sortedData[params.dataIndex]
        if (d?.isAnomaly) onAnomalyClick(d)
      }
    })
  }, [data, settings, onAnomalyClick, showNormalRange])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
}

// ==================== 에러율 추이 ====================
const ErrorRateChart = ({ data }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (!chartInstance.current) chartInstance.current = echarts.init(chartRef.current)

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp).slice(-30)
    const times = sortedData.map((d) => formatTime(d.timestamp))

    const option = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['전체 트래픽', '클라이언트 에러', '서버 에러'],
        top: 5,
        right: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { left: '50px', right: '20px', top: '45px', bottom: '30px' },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 9, rotate: 45 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [
        {
          name: '전체 트래픽',
          type: 'line',
          smooth: true,
          data: sortedData.map((d) => d.totalTraffic),
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: PIVOT_SERIES_COLORS[0], width: 2 },
          itemStyle: { color: PIVOT_SERIES_COLORS[0] },
        },
        {
          name: '클라이언트 에러',
          type: 'line',
          smooth: true,
          data: sortedData.map((d) => d.clientError),
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: PIVOT_SERIES_COLORS[1], width: 2 },
          itemStyle: { color: PIVOT_SERIES_COLORS[1] },
        },
        {
          name: '서버 에러',
          type: 'line',
          smooth: true,
          data: sortedData.map((d) => d.serverError),
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#ef4444', width: 2 },
          itemStyle: { color: '#ef4444' },
        },
      ],
    }

    chartInstance.current.setOption(option, true)
  }, [data])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '200px' }} />
}

// ==================== HTTP 상태코드 분포 ====================
const HttpStatusChart = ({ data }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (!chartInstance.current) chartInstance.current = echarts.init(chartRef.current)

    const hasAnomaly = data.some((d) => d.isAnomaly)
    const total = data.length
    const baseTotal = total || 100

    let value2xx, value3xx, value4xx, value5xx

    if (hasAnomaly) {
      value2xx = Math.round(baseTotal * 0.94)
      value3xx = Math.round(baseTotal * 0.02)
      value4xx = Math.round(baseTotal * 0.02)
      value5xx = baseTotal - value2xx - value3xx - value4xx
    } else {
      value2xx = Math.round(baseTotal * 0.975)
      value3xx = Math.round(baseTotal * 0.015)
      value4xx = baseTotal - value2xx - value3xx
      value5xx = 0
    }

    const successCount = value2xx + value3xx
    const errorCount = value4xx + value5xx
    const successRate = (successCount / (successCount + errorCount || 1)) * 100

    const option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: ['2xx', '3xx', '4xx', '5xx'],
        textStyle: { fontSize: 11 },
      },
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          label: {
            show: true,
            position: 'center',
            formatter: () => `${successRate.toFixed(1)}%\n성공률`,
            fontSize: 16,
            fontWeight: 'bold',
            color: hasAnomaly ? PIVOT_SERIES_COLORS[1] : PIVOT_SERIES_COLORS[0],
          },
          data: [
            {
              value: value2xx,
              name: '2xx',
              itemStyle: { color: PIVOT_SERIES_COLORS[0] },
            },
            {
              value: value3xx,
              name: '3xx',
              itemStyle: { color: PIVOT_SERIES_COLORS[2] },
            },
            {
              value: value4xx,
              name: '4xx',
              itemStyle: { color: PIVOT_SERIES_COLORS[1] },
            },
            {
              value: value5xx,
              name: '5xx',
              itemStyle: { color: '#ef4444' },
            },
          ],
        },
      ],
    }

    chartInstance.current.setOption(option, true)
  }, [data])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '200px' }} />
}

// ==================== 느린 URI Top 10 ====================
const SlowUriList = ({ data }) => {
  const uriStats = URIS.map((uri) => {
    const uriData = data.filter((d) => d.http_uri === uri)
    const avgTime =
      uriData.length > 0
        ? uriData.reduce((sum, d) => sum + d.ts_page, 0) / uriData.length
        : Math.random() * 0.5 + 0.1
    return { uri, avgTime, count: uriData.length || Math.floor(Math.random() * 10 + 1) }
  })
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 5)

  return (
    <div style={{ fontSize: '12px' }}>
      {uriStats.map((item, idx) => (
        <div
          key={idx}
          style={{
            padding: '10px 0',
            borderBottom: idx < uriStats.length - 1 ? '1px solid #f3f4f6' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <span
              style={{
                backgroundColor: idx === 0 ? PIVOT_SERIES_COLORS[1] + '33' : '#f3f4f6',
                color: idx === 0 ? PIVOT_SERIES_COLORS[1] : '#6b7280',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              {idx + 1}
            </span>
            <span style={{ color: '#1f2937', fontWeight: '500', fontSize: '11px' }}>
              {item.uri}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                color: item.avgTime > 1 ? '#ef4444' : '#6b7280',
                fontWeight: item.avgTime > 1 ? '600' : '400',
                fontSize: '12px',
              }}
            >
              {item.avgTime.toFixed(2)}s
            </div>
            <div style={{ color: '#9ca3af', fontSize: '10px' }}>{item.count}건</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== 실시간 트래픽 추이 ====================
const TrafficChart = ({ data }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (!chartInstance.current) chartInstance.current = echarts.init(chartRef.current)

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp).slice(-30)
    const times = sortedData.map((d) => formatTime(d.timestamp))

    const option = {
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['Request', 'Response', 'Request 이상', 'Response 이상'],
        top: 5,
        right: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { left: '50px', right: '20px', top: '50px', bottom: '40px' },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 9, rotate: 45 },
      },
      yAxis: {
        type: 'value',
        name: 'Mbps',
        nameTextStyle: { color: '#6b7280', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [
        {
          name: 'Request',
          type: 'bar',
          stack: 'traffic',
          data: sortedData.map(() => (Math.random() * 0.03 + 0.02).toFixed(3)),
          itemStyle: { color: PIVOT_SERIES_COLORS[0] },
          barMaxWidth: 15,
        },
        {
          name: 'Response',
          type: 'bar',
          stack: 'traffic',
          data: sortedData.map(() => (Math.random() * 0.02 + 0.01).toFixed(3)),
          itemStyle: { color: PIVOT_SERIES_COLORS[2] },
          barMaxWidth: 15,
        },
        {
          name: 'Request 이상',
          type: 'bar',
          stack: 'anomaly',
          data: sortedData.map((d) =>
            d.isAnomaly ? (Math.random() * 0.01 + 0.005).toFixed(3) : 0,
          ),
          itemStyle: { color: PIVOT_SERIES_COLORS[3] },
          barMaxWidth: 15,
        },
        {
          name: 'Response 이상',
          type: 'bar',
          stack: 'anomaly',
          data: sortedData.map((d) => (d.isAnomaly ? (Math.random() * 0.005).toFixed(3) : 0)),
          itemStyle: { color: '#ef4444' },
          barMaxWidth: 15,
        },
      ],
    }

    chartInstance.current.setOption(option, true)
  }, [data])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <div ref={chartRef} style={{ width: '100%', height: '220px' }} />
}

// ==================== 브라우저별 성능 (버블) ====================
const BrowserBubbleChart = ({ data, settings }) => {
  const browserStats = BROWSERS.map((browser) => {
    const browserData = data.filter((d) => d.browser === browser)
    const avgTime =
      browserData.length > 0
        ? browserData.reduce((sum, d) => sum + d.ts_page, 0) / browserData.length
        : Math.random() * 1.5 + 0.5
    const count = browserData.length || Math.floor(Math.random() * 20 + 5)
    return { name: browser, avgTime, count }
  })

  const totalBrowserCount = browserStats.reduce((sum, b) => sum + b.count, 0)
  const maxBrowserCount = browserStats.reduce((max, b) => (b.count > max ? b.count : max), 0) || 1

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        padding: '16px 0',
      }}
    >
      {browserStats.map((item, idx) => {
        const isWarning = item.avgTime > settings.normalMax
        const ratio = totalBrowserCount ? (item.count / totalBrowserCount) * 100 : 0
        const size = 30 + (item.count / maxBrowserCount) * 80
        return (
          <div
            key={idx}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: isWarning
                ? PIVOT_SERIES_COLORS[3]
                : PIVOT_SERIES_COLORS[idx % PIVOT_SERIES_COLORS.length] + '33',
              border: isWarning ? '2px solid #ef4444' : '1px solid rgba(148,163,184,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1f2937',
              fontSize: '10px',
              fontWeight: '600',
              boxShadow: isWarning
                ? '0 0 18px rgba(248,113,113,0.6)'
                : '0 2px 8px rgba(148,163,184,0.35)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={`${item.name}\n평균: ${item.avgTime.toFixed(2)}s\n요청 비율: ${ratio.toFixed(1)}% (${item.count}건)`}
          >
            <span>{item.name}</span>
            <span style={{ fontSize: '9px', opacity: 0.9 }}>{ratio.toFixed(1)}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ==================== 디바이스별 성능 (버블) ====================
const DeviceBubbleChart = ({ data, settings }) => {
  const deviceStats = OS_LIST.map((os) => {
    const osData = data.filter((d) => d.user_agent_opperating_platform === os)
    const avgTime =
      osData.length > 0
        ? osData.reduce((sum, d) => sum + d.ts_page, 0) / osData.length
        : Math.random() * 1.5 + 0.5
    const count = osData.length || Math.floor(Math.random() * 15 + 3)
    return { name: os, avgTime, count }
  })

  const totalDeviceCount = deviceStats.reduce((sum, d) => sum + d.count, 0)
  const maxDeviceCount = deviceStats.reduce((max, d) => (d.count > max ? d.count : max), 0) || 1

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center',
        padding: '16px 0',
      }}
    >
      {deviceStats.map((item, idx) => {
        const isWarning = item.avgTime > settings.normalMax
        const ratio = totalDeviceCount ? (item.count / totalDeviceCount) * 100 : 0
        const size = 20 + (item.count / maxDeviceCount) * 70
        return (
          <div
            key={idx}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              backgroundColor: isWarning
                ? PIVOT_SERIES_COLORS[3]
                : PIVOT_SERIES_COLORS[idx % PIVOT_SERIES_COLORS.length] + '33',
              border: isWarning ? '2px solid #ef4444' : '1px solid rgba(148,163,184,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1f2937',
              fontSize: '9px',
              fontWeight: '600',
              boxShadow: isWarning
                ? '0 0 18px rgba(248,113,113,0.6)'
                : '0 2px 8px rgba(148,163,184,0.35)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={`${item.name}\n평균: ${item.avgTime.toFixed(2)}s\n요청 비율: ${ratio.toFixed(1)}% (${item.count}건)`}
          >
            <span>{item.name}</span>
            <span style={{ fontSize: '8px', opacity: 0.9 }}>{ratio.toFixed(1)}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ==================== 국가별 지도 히트맵 ====================
const CountryMapChart = ({ data }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    fetch('https://code.highcharts.com/mapdata/custom/world.geo.json')
      .then((response) => response.json())
      .then((geoJson) => {
        echarts.registerMap('world', geoJson)
        setMapLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load world map:', error)
      })
  }, [])

  useEffect(() => {
    if (!chartRef.current || !mapLoaded) return
    if (!chartInstance.current) chartInstance.current = echarts.init(chartRef.current)

    // 🔥 국가 이름이 이미 GeoJSON과 일치하므로 매핑 불필요!
    const countryData = COUNTRIES.map((country) => {
      const count =
        data.filter((d) => d.country_name_res === country).length ||
        Math.floor(Math.random() * 20 + 5)
      return {
        name: country,
        value: count,
      }
    })

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `<b>${params.name}</b><br/>요청 수: ${params.value}건`
        },
      },
      visualMap: {
        min: 0,
        max: 30,
        text: ['높음', '낮음'],
        realtime: false,
        calculable: true,
        inRange: {
          color: [
            PIVOT_SERIES_COLORS[0] + '30',
            PIVOT_SERIES_COLORS[0] + '70',
            PIVOT_SERIES_COLORS[0],
            PIVOT_SERIES_COLORS[1],
            '#ef4444',
          ],
        },
        textStyle: {
          color: '#6b7280',
          fontSize: 10,
        },
        left: 'left',
        bottom: '15px',
      },
      series: [
        {
          name: '요청 수',
          type: 'map',
          map: 'world',
          roam: true,
          zoom: 1.2,
          center: [20, 20],
          itemStyle: {
            areaColor: '#e5e7eb',
            borderColor: '#ffffff',
            borderWidth: 0.5,
          },
          emphasis: {
            itemStyle: {
              areaColor: PIVOT_SERIES_COLORS[1],
            },
            label: {
              show: true,
              color: '#1f2937',
              fontSize: 11,
            },
          },
          data: countryData,
        },
      ],
    }

    chartInstance.current.setOption(option, true)
  }, [data, mapLoaded])

  useEffect(() => {
    const handleResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!mapLoaded) {
    return (
      <div
        style={{
          height: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        지도를 로드하는 중...
      </div>
    )
  }

  return <div ref={chartRef} style={{ width: '100%', height: '300px' }} />
}

// ==================== 응답시간 통계 ====================
const ResponseTimeStats = ({ data, settings }) => {
  const times = data.map((d) => d.ts_page)
  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  const sorted = [...times].sort((a, b) => a - b)
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0
  const maxValue = Math.max(avg, p95, p99, settings.normalMax) * 1.2

  return (
    <div style={{ padding: '8px 0' }}>
      {[
        { label: 'P99 응답시간', value: p99, color: PIVOT_SERIES_COLORS[1] },
        { label: 'P95 응답시간', value: p95, color: PIVOT_SERIES_COLORS[0] },
        { label: '평균 응답시간', value: avg, color: PIVOT_SERIES_COLORS[2] },
      ].map((item, idx) => (
        <div key={idx} style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span style={{ color: '#6b7280' }}>{item.label}</span>
            <span
              style={{
                fontWeight: '600',
                color: item.value > settings.normalMax ? '#ef4444' : '#1f2937',
              }}
            >
              {item.value.toFixed(2)}s
            </span>
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (item.value / maxValue) * 100)}%`,
                backgroundColor: item.value > settings.normalMax ? '#ef4444' : item.color,
                borderRadius: '4px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ==================== 메인 대시보드 ====================
const DashboardPage1 = () => {
  const [data, setData] = useState([])
  const [anomalyMode, setAnomalyMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState({
    normalMin: 0.5,
    normalMax: 2.0,
    resInitThreshold: 0.5,
  })
  const [showNormalRange, setShowNormalRange] = useState(false) // ✅ 정상 범위 표시 여부
  const [widgets, setWidgets] = useState([
    { id: 'pageLoad', type: 'pageLoad', gridSpan: 6 },
    { id: 'errorRate', type: 'errorRate', gridSpan: 6 },
    { id: 'httpStatus', type: 'httpStatus', gridSpan: 3 },
    { id: 'slowUri', type: 'slowUri', gridSpan: 3 },
    { id: 'traffic', type: 'traffic', gridSpan: 6 },
    { id: 'browser', type: 'browser', gridSpan: 3 },
    { id: 'device', type: 'device', gridSpan: 3 },
  ])
  const [toasts, setToasts] = useState([])
  const dragItemId = useRef(null)
  const dragOverItemId = useRef(null)
  const [setLogoClickCount] = useState(0)
  const logoClickTimer = useRef(null)

  // ✅ 토스트 추가 함수
  const addToast = useCallback((anomalyData) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, data: anomalyData }])
  }, [])

  // ✅ 토스트 제거 함수
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  useEffect(() => {
    const initialData = []
    const now = getKoreanTime()
    for (let i = 30; i >= 0; i--) {
      const d = generateNormalData(settings)
      d.timestamp = new Date(now.getTime() - i * 5000)
      initialData.push(d)
    }
    setData(initialData)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const newData = anomalyMode
        ? Math.random() > 0.3
          ? generateAnomalyData()
          : generateNormalData(settings)
        : generateNormalData(settings)

      // ✅ 이상 감지 시 토스트 알림
      if (newData.isAnomaly) {
        addToast(newData)
      }

      setData((prev) => {
        const updated = [...prev, newData]
        return updated.length > 60 ? updated.slice(-60) : updated
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [anomalyMode, settings, addToast])

  useEffect(() => {
    const handleKeyDown = (e) => {
      console.log('Key pressed:', e.key, 'Code:', e.code, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey) // 🔥 디버깅
      // e.code === 'KeyA' 또는 e.key가 'A' 또는 'a'
      if (e.ctrlKey && e.shiftKey && (e.code === 'KeyA' || e.key === 'A' || e.key === 'a')) {
        e.preventDefault()
        console.log('🚨 Ctrl+Shift+A detected! Toggling anomaly mode...') // 🔥 디버깅
        setAnomalyMode((prev) => {
          console.log('Anomaly mode changing from', prev, 'to', !prev) // 🔥 디버깅
          return !prev
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogoClick = useCallback(() => {
    setLogoClickCount((prev) => {
      const newCount = prev + 1
      if (newCount >= 5) {
        setAnomalyMode((prev) => !prev)
        return 0
      }
      return newCount
    })
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
    logoClickTimer.current = setTimeout(() => setLogoClickCount(0), 2000)
  }, [])

  const navigate = useNavigate()

  // 차트에서 이상치 클릭 시 (기존 alert 동작)
  const handleAnomalyClick = useCallback((item) => {
    alert(
      `🔍 검색 조건으로 이동\n\n시간: ${formatTime(item.timestamp)}\nURI: ${item.http_uri}\n국가: ${item.country_name_res}\nOS: ${item.user_agent_opperating_platform}\n로드시간: ${item.ts_page.toFixed(2)}s`,
    )
  }, [])

  // 토스트 클릭 시 검색 페이지로 이동
  const handleToastClick = useCallback(
    (item) => {
      // 오늘 00:00:00 ~ 23:00:00 시간 범위 계산
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 0, 0)

      // 검색 페이지로 이동 with autoFill 데이터
      navigate(userNavigations.SEARCH, {
        state: {
          autoFill: true,
          layer: 'HTTP_PAGE',
          timeRange: {
            fromEpoch: Math.floor(startOfDay.getTime() / 1000),
            toEpoch: Math.floor(endOfDay.getTime() / 1000),
          },
          viewKeys: ['ts_page'], // ts_page 필드 추가
          anomalyContext: {
            timestamp: item.timestamp,
            ts_page: item.ts_page,
            http_uri: item.http_uri,
            country_name_res: item.country_name_res,
            user_agent_opperating_platform: item.user_agent_opperating_platform,
            isAnomaly: true,
          },
        },
      })
    },
    [navigate],
  )

  const handleWidgetDragStart = useCallback((id, event) => {
    dragItemId.current = id
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }, [])

  const handleWidgetDragEnter = useCallback((id) => {
    if (id !== dragItemId.current) {
      dragOverItemId.current = id
    }
  }, [])

  const handleWidgetDragOver = useCallback((event) => {
    event.preventDefault()
  }, [])

  const handleWidgetDragEnd = useCallback(() => {
    const fromId = dragItemId.current
    const toId = dragOverItemId.current

    if (!fromId || !toId || fromId === toId) {
      dragItemId.current = null
      dragOverItemId.current = null
      return
    }

    setWidgets((prev) => {
      const next = [...prev]
      const fromIndex = next.findIndex((w) => w.id === fromId)
      const toIndex = next.findIndex((w) => w.id === toId)
      if (fromIndex === -1 || toIndex === -1) return prev
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })

    dragItemId.current = null
    dragOverItemId.current = null
  }, [])

  const getWidgetMeta = useCallback(
    (type) => {
      switch (type) {
        case 'pageLoad':
          return {
            title: '페이지 로드 시간 트렌드',
            subtitle: `시간대별 페이지 로드 성능 추이 (실시간 - ${data.length}개)`,
            description: '시간대별 페이지 로드 시간(평균·P95·P99)을 한눈에 보여주는 차트입니다.',
          }
        case 'errorRate':
          return {
            title: '에러율 추이',
            subtitle: `시간대별 전체 / 클라이언트 / 서버 에러율 (실시간 - ${data.length}개)`,
            description:
              '시간대별로 전체 요청 중 에러(4xx·5xx)가 차지하는 비율을 보여주는 차트입니다.',
          }
        case 'httpStatus':
          return {
            title: 'HTTP 상태코드 분포',
            subtitle: '2xx/3xx/4xx/5xx 응답 비율',
            description: '현재 트래픽에서 2xx·3xx·4xx·5xx 응답 비율을 도넛 차트로 표현합니다.',
          }
        case 'slowUri':
          return {
            title: '느린 URI Top 10',
            subtitle: '평균 응답시간이 긴 URI',
            description:
              '평균 응답시간이 긴 URI를 상위 순위로 정렬해 병목 구간을 보여주는 리스트입니다.',
          }
        case 'traffic':
          return {
            title: '실시간 트래픽 추이',
            subtitle: `Mbps 기준, Request/Response 구분 (${data.length}개)`,
            description:
              '시간대별 Request/Response 트래픽 양을 Mbps 기준으로 비교해 보여주는 막대 차트입니다.',
          }
        case 'browser':
          return {
            title: '브라우저별 성능',
            subtitle: '브라우저별 평균 응답 시간',
            description: '브라우저별 평균 응답시간과 사용 비중을 버블 크기로 표현한 차트입니다.',
          }
        case 'device':
          return {
            title: '디바이스별 성능',
            subtitle: '디바이스별 평균 응답 시간',
            description:
              '운영체제·디바이스별 평균 응답시간과 사용 비중을 버블 크기로 표현한 차트입니다.',
          }
        case 'country':
          return {
            title: '국가별 트래픽 분포',
            subtitle: '요청 수 기준 지역별 분포 (실제 지도)',
            description: '요청이 많이 발생하는 국가를 세계 지도 위 색상으로 시각화한 뷰입니다.',
          }
        case 'responseStats':
          return {
            title: '응답시간 통계',
            subtitle: `평균/P95/P99 요약 (${data.length}건)`,
            description: '전체 응답시간에서 평균·P95·P99 값을 막대로 요약해 보여주는 뷰입니다.',
          }
        default:
          return { title: '', subtitle: '', description: '' }
      }
    },
    [data.length],
  )

  const renderWidgetContent = (type) => {
    switch (type) {
      case 'pageLoad':
        return (
          <PageLoadTimeChart
            data={data}
            settings={settings}
            onAnomalyClick={handleAnomalyClick}
            showNormalRange={showNormalRange}
          />
        )
      case 'errorRate':
        return <ErrorRateChart data={data} />
      case 'httpStatus':
        return <HttpStatusChart data={data} />
      case 'slowUri':
        return <SlowUriList data={data} />
      case 'traffic':
        return <TrafficChart data={data} />
      case 'browser':
        return <BrowserBubbleChart data={data} settings={settings} />
      case 'device':
        return <DeviceBubbleChart data={data} settings={settings} />
      case 'country':
        return <CountryMapChart data={data} />
      case 'responseStats':
        return <ResponseTimeStats data={data} settings={settings} />
      default:
        return null
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '24px',
      }}
    >
      {/* ✅ 토스트 렌더링 */}
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${24 + index * 160}px`,
            right: '24px',
            zIndex: 9999,
          }}
        >
          <Toast
            data={toast.data}
            onClose={() => removeToast(toast.id)}
            onClick={() => {
              handleToastClick(toast.data)
              removeToast(toast.id)
            }}
          />
        </div>
      ))}

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1
              onClick={handleLogoClick}
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              네트워크 모니터링 대시보드
            </h1>
            {anomalyMode && (
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                🚨 이상 모드
              </span>
            )}
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            실시간 트래픽 및 성능 분석
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: PIVOT_SERIES_COLORS[0],
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              + 위젯 추가
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ⚙️ 필터 설정
            </button>
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ↓ 저장
            </button>
            <select
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            >
              <option>최근 1시간</option>
              <option>최근 6시간</option>
              <option>최근 24시간</option>
            </select>
          </div>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: PIVOT_SERIES_COLORS[2] + '33',
              color: PIVOT_SERIES_COLORS[2],
              border: `1px solid ${PIVOT_SERIES_COLORS[2]}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: PIVOT_SERIES_COLORS[2],
                borderRadius: '50%',
              }}
            />
            실시간 업데이트
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
          {widgets.map((widget) => {
            const { title, subtitle, description } = getWidgetMeta(widget.type)
            const isSettingsTarget = widget.type === 'pageLoad'
            return (
              <WidgetCard
                key={widget.id}
                widgetId={widget.id}
                gridSpan={widget.gridSpan}
                title={title}
                subtitle={subtitle}
                description={description}
                onSettingsClick={isSettingsTarget ? () => setSettingsOpen(true) : undefined}
                draggable={true}
                onDragStart={(event) => handleWidgetDragStart(widget.id, event)}
                onDragEnter={() => handleWidgetDragEnter(widget.id)}
                onDragOver={handleWidgetDragOver}
                onDragEnd={handleWidgetDragEnd}
              >
                {renderWidgetContent(widget.type)}
              </WidgetCard>
            )
          })}
        </div>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings)
          setShowNormalRange(true) // ✅ 설정 저장 시 정상 범위 표시
        }}
      />
    </div>
  )
}

export default DashboardPage1
