import { useEffect, useState } from 'react'

const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'

// 스크립트를 한 번만 로드하기 위한 전역 Promise
let echartsPromise = null
const loadEchartsScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.echarts) return Promise.resolve(window.echarts)
  if (echartsPromise) return echartsPromise

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

export default function useEcharts() {
  const [echarts, setEcharts] = useState(null)

  useEffect(() => {
    let canceled = false

    loadEchartsScript()
      .then((e) => {
        if (!canceled) setEcharts(e)
      })
      .catch((err) => {
        console.error('ECharts 로딩 실패', err)
      })

    return () => {
      canceled = true
    }
  }, [])

  return echarts
}
