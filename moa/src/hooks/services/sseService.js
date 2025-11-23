// src/services/sseService.js

class SSEService {
  constructor() {
    this.eventSource = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000

    // 콜백 함수들
    this.onConnectCallback = null
    this.onDisconnectCallback = null
    this.onErrorCallback = null
    this.onBatchDataCallback = null
    this.onSingleDataCallback = null
    this.onStatusCallback = null
  }

  /**
   * SSE 연결
   */
  connect(moaDataUrl) {
    if (this.isConnected) {
      return
    }

    try {
      // EventSource 생성
      this.eventSource = new EventSource(`${moaDataUrl}/api/sse/connect`)

      // 연결 성공
      this.eventSource.addEventListener('connected', (event) => {
        this.isConnected = true
        this.reconnectAttempts = 0

        try {
          const data = JSON.parse(event.data)
          if (this.onConnectCallback) {
            this.onConnectCallback(data)
          }
        } catch (error) {
          console.error('연결 데이터 파싱 에러:', error)
        }
      })

      // 배치 데이터 수신
      this.eventSource.addEventListener('batch-data', (event) => {
        try {
          const data = JSON.parse(event.data)

          if (this.onBatchDataCallback) {
            this.onBatchDataCallback(data)
          }
        } catch (error) {
          console.error('❌ 배치 데이터 파싱 에러:', error)
        }
      })

      // 단건 데이터 수신
      this.eventSource.addEventListener('single-data', (event) => {
        try {
          const data = JSON.parse(event.data)

          if (this.onSingleDataCallback) {
            this.onSingleDataCallback(data)
          }
        } catch (error) {
          console.error('❌ 단건 데이터 파싱 에러:', error)
        }
      })

      // 상태 수신
      this.eventSource.addEventListener('status', (event) => {
        try {
          const data = JSON.parse(event.data)

          if (this.onStatusCallback) {
            this.onStatusCallback(data)
          }
        } catch (error) {
          console.error('❌ 상태 파싱 에러:', error)
        }
      })

      // 에러 처리
      this.eventSource.onerror = (error) => {
        console.error('❌ SSE 에러:', error)
        this.isConnected = false

        if (this.onErrorCallback) {
          this.onErrorCallback(error)
        }

        // 자동 재연결
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++

          setTimeout(() => {
            this.disconnect()
            this.connect(moaDataUrl)
          }, this.reconnectDelay)
        } else {
          console.error('❌ 재연결 실패: 최대 시도 횟수 초과')
          this.disconnect()
        }
      }
    } catch (error) {
      console.error('❌ SSE 연결 실패:', error)
      this.isConnected = false

      if (this.onErrorCallback) {
        this.onErrorCallback(error)
      }
    }
  }

  /**
   * SSE 연결 해제
   */
  disconnect() {
    if (!this.eventSource) {
      return
    }

    try {
      this.eventSource.close()
      this.eventSource = null
      this.isConnected = false
      this.reconnectAttempts = 0

      if (this.onDisconnectCallback) {
        this.onDisconnectCallback()
      }
    } catch (error) {
      console.error('❌ 연결 해제 실패:', error)
    }
  }

  /**
   * 연결 상태 확인
   */
  getIsConnected() {
    return this.isConnected
  }

  /**
   * 콜백 등록
   */
  onConnect(callback) {
    this.onConnectCallback = callback
  }

  onDisconnect(callback) {
    this.onDisconnectCallback = callback
  }

  onError(callback) {
    this.onErrorCallback = callback
  }

  onBatchData(callback) {
    this.onBatchDataCallback = callback
  }

  onSingleData(callback) {
    this.onSingleDataCallback = callback
  }

  onStatus(callback) {
    this.onStatusCallback = callback
  }
}

// 싱글톤 인스턴스
export const sseService = new SSEService()
