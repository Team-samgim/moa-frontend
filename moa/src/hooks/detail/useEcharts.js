/**
 * useEcharts
 *
 * ECharts 스크립트를 CDN에서 동적으로 로드해 window.echarts를 반환하는 훅.
 * React 컴포넌트가 마운트될 때 자동으로 로드되며,
 * 이미 로드된 경우 또는 로딩 중인 경우 중복 요청을 방지한다.
 *
 * 특징:
 * - <script> 태그를 동적으로 추가하여 ECharts 로드
 * - 전역 Promise(echartsPromise)로 다중 호출 시 1회만 로드 보장
 * - SSR 환경 확인(window undefined) 처리
 * - 언마운트 후 setState 호출 방지
 *
 * 반환값:
 * - echarts 객체 (로딩 중이면 null)
 *
 * AUTHOR: 방대혁
 */

import { useEffect, useState } from 'react'

// ECharts CDN URL
// 필요 시 버전 번호만 변경하여 교체 가능
const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'

// 전역 Promise
// - 여러 컴포넌트에서 훅이 호출되어도 ECharts 스크립트는 딱 1번만 로드되도록 보장함
let echartsPromise = null

// ECharts 스크립트 동적 로드 함수
// - 이미 로드된 경우 즉시 resolve
// - 아직 로드되지 않은 경우 <script> 태그 생성
const loadEchartsScript = () => {
  // SSR 환경(Next.js 등) 대비
  if (typeof window === 'undefined') return Promise.resolve(null)

  // 이미 로드된 경우
  if (window.echarts) return Promise.resolve(window.echarts)

  // 이미 로딩 중이면 기존 Promise 반환
  if (echartsPromise) return echartsPromise

  // 최초 로딩
  echartsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = ECHARTS_CDN
    script.async = true
    script.onload = () => resolve(window.echarts)
    script.onerror = (err) => reject(err)
    document.head.appendChild(script)
  })

  return echartsPromise
}

// useEcharts 훅
// - ECharts를 동적 로딩하고 window.echarts를 반환함
// - 로딩 중이면 null
export default function useEcharts() {
  const [echarts, setEcharts] = useState(null)

  useEffect(() => {
    let canceled = false

    loadEchartsScript()
      .then((e) => {
        // 언마운트 후 setState 방지
        if (!canceled) setEcharts(e)
      })
      .catch((err) => {
        console.error('ECharts 로딩 실패:', err)
      })

    return () => {
      canceled = true
    }
  }, [])

  return echarts
}
