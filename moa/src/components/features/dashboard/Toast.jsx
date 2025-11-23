import toast from 'react-hot-toast'

export const showTrafficAnomalyToast = ({ time, anomalies }) => {
  toast.error(
    (
      t, // t 파라미터로 toast 객체 받기1
    ) => (
      <div className='relative'>
        <button
          onClick={() => toast.dismiss(t.id)} // ⭐ 클릭 시 해당 토스트 닫기
          className='absolute top-0 right-0 p-1 hover:bg-gray-100 rounded-full transition-colors'
          aria-label='닫기'
        >
          <svg
            className='w-5 h-5 text-gray-400 hover:text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        {/* 기존 내용 */}
        <div className='pr-6'>
          <div className='font-bold text-base mb-2'>⚠️ 트래픽 이상 감지</div>
          <div className='text-sm text-gray-700 mb-3 font-medium'>{time}</div>
          {anomalies.map((anomaly, idx) => (
            <div key={idx} className='text-sm leading-relaxed mt-1'>
              {anomaly}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      duration: 10000,
      position: 'top-right',
      style: {
        maxWidth: '420px',
      },
    },
  )
}

// ⭐ 다른 토스트 함수들도 동일하게 수정
export const showErrorRateAnomalyToast = ({ time, errorRate, threshold }) => {
  toast.error(
    (t) => (
      <div className='relative'>
        <button
          onClick={() => toast.dismiss(t.id)}
          className='absolute top-0 right-0 p-1 hover:bg-gray-100 rounded-full transition-colors'
          aria-label='닫기'
        >
          <svg
            className='w-5 h-5 text-gray-400 hover:text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        <div className='pr-6'>
          <div className='font-bold text-base mb-2'>⚠️ 에러율 이상 증가</div>
          <div className='text-sm text-gray-700 mb-3 font-medium'>{time}</div>
          <div className='text-sm'>
            현재 에러율: <span className='font-semibold text-red-600'>{errorRate}%</span>
          </div>
          <div className='text-sm text-gray-500'>임계값: {threshold}%</div>
        </div>
      </div>
    ),
    {
      duration: 10000,
      position: 'top-right',
      style: {
        maxWidth: '420px',
      },
    },
  )
}

export const showResponseTimeAnomalyToast = ({ time, responseTime, threshold }) => {
  toast.warning(
    (t) => (
      <div className='relative'>
        <button
          onClick={() => toast.dismiss(t.id)}
          className='absolute top-0 right-0 p-1 hover:bg-gray-100 rounded-full transition-colors'
          aria-label='닫기'
        >
          <svg
            className='w-5 h-5 text-gray-400 hover:text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>

        <div className='pr-6'>
          <div className='font-bold text-base mb-2'>⏱️ 응답 시간 지연</div>
          <div className='text-sm text-gray-700 mb-3 font-medium'>{time}</div>
          <div className='text-sm'>
            현재 응답 시간: <span className='font-semibold text-orange-600'>{responseTime}ms</span>
          </div>
          <div className='text-sm text-gray-500'>임계값: {threshold}ms</div>
        </div>
      </div>
    ),
    {
      duration: 8000,
      position: 'top-right',
      style: {
        maxWidth: '420px',
      },
    },
  )
}

// 간단한 토스트들
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  })
}

export const showErrorToast = (message) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
  })
}

export const showInfoToast = (message) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
  })
}
