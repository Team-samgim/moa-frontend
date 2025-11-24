import { useEffect } from 'react'
import { sseService } from '@/hooks/services/sseService'
import { useDashboardStore } from '@/stores/dashboardStore'

export function useDashboardSSE(options = {}) {
  // const { enabled = true, moaDataUrl = 'http://localhost:9090' } = options
  const { enabled = true, moaDataUrl = 'https://data.mo-a.site' } = options

  const addRealtimeData = useDashboardStore((state) => state.addRealtimeData)
  const setWebSocketConnected = useDashboardStore((state) => state.setWebSocketConnected)

  useEffect(() => {
    if (!enabled) return

    sseService.connect(moaDataUrl)

    sseService.onConnect(() => {
      setWebSocketConnected(true)
    })

    sseService.onDisconnect(() => {
      setWebSocketConnected(false)
    })

    sseService.onError((err) => {
      console.error('❌ 대시보드 SSE 에러', err)
      setWebSocketConnected(false)
    })

    sseService.onBatchData((batchData) => {
      addRealtimeData(batchData)
    })

    sseService.onSingleData((singleData) => {
      addRealtimeData([singleData])
    })

    sseService.onStatus(() => {})

    // ✅ 수정된 클린업
    return () => {
      if (sseService && typeof sseService.disconnect === 'function') {
        sseService.disconnect()
        setWebSocketConnected(false)
      }
    }
  }, [enabled, moaDataUrl, addRealtimeData, setWebSocketConnected])

  return null
}
