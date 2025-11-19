import { useEffect } from 'react'
import { sseService } from '@/hooks/services/sseService'
import { useDashboardStore } from '@/stores/dashboardStore'

export function useDashboardSSE(options = {}) {
  const { enabled = true, moaDataUrl = 'http://localhost:9090' } = options

  const addRealtimeData = useDashboardStore((state) => state.addRealtimeData)
  const setWebSocketConnected = useDashboardStore((state) => state.setWebSocketConnected)

  useEffect(() => {
    if (!enabled) return

    console.log('🔌 SSE 연결 시도:', moaDataUrl)

    sseService.connect(moaDataUrl)

    sseService.onConnect((data) => {
      console.log('✅ 대시보드 SSE 연결 완료', data)
      setWebSocketConnected(true)
    })

    sseService.onDisconnect(() => {
      console.log('🔌 대시보드 SSE 연결 해제')
      setWebSocketConnected(false)
    })

    sseService.onError((err) => {
      console.error('❌ 대시보드 SSE 에러', err)
      setWebSocketConnected(false)
    })

    sseService.onBatchData((batchData) => {
      console.log('📦 대시보드: 배치 데이터 수신', batchData.length)
      addRealtimeData(batchData)
    })

    sseService.onSingleData((singleData) => {
      console.log('📄 대시보드: 단건 데이터 수신', singleData)
      addRealtimeData([singleData])
    })

    sseService.onStatus((status) => {
      console.log('📡 대시보드: 상태 수신', status)
    })

    // ✅ 수정된 클린업
    return () => {
      console.log('🧹 클린업: SSE 연결 해제')
      if (sseService && typeof sseService.disconnect === 'function') {
        sseService.disconnect()
        setWebSocketConnected(false)
      }
    }
  }, [enabled, moaDataUrl, addRealtimeData, setWebSocketConnected])

  return null
}
