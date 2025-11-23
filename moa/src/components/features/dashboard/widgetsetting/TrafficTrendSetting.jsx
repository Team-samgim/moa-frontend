import { useState } from 'react'
import PropTypes from 'prop-types'

/**
 * 트래픽 추이 위젯 - 정상 범위 설정 팝업 바디
 */
const TrafficTrendSetting = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState({
    requestMin: 0,
    requestMax: 1.0,
    responseMin: 0,
    responseMax: 1.5,
    enabled: true,
    ...currentSettings,
  })

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value === '' ? '' : parseFloat(value),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // 유효성 검사
    if (settings.requestMin >= settings.requestMax) {
      alert('Request 최소값은 최대값보다 작아야 합니다.')
      return
    }
    if (settings.responseMin >= settings.responseMax) {
      alert('Response 최소값은 최대값보다 작아야 합니다.')
      return
    }

    onSave(settings)
    onClose()
  }

  const handleReset = () => {
    setSettings({
      requestMin: 0,
      requestMax: 1.0,
      responseMin: 0,
      responseMax: 1.5,
      enabled: true,
    })
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* 헤더: 제목 + 액션 버튼 */}
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold text-gray-900'>트래픽 추이 정상 범위</h3>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            취소
          </button>
          <button
            type='submit'
            className='px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            적용
          </button>
        </div>
      </div>

      {/* 활성화 토글 + 기본값 리셋 */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg'>
          <div>
            <h4 className='text-sm font-semibold text-gray-900'>이상 탐지 활성화</h4>
            <p className='text-xs text-gray-600 mt-0.5'>정상 범위를 벗어나면 알림을 받습니다</p>
          </div>
          <label className='relative inline-flex items-center cursor-pointer'>
            <input
              type='checkbox'
              checked={settings.enabled}
              onChange={(e) => setSettings((prev) => ({ ...prev, enabled: e.target.checked }))}
              className='sr-only peer'
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className='flex justify-end'>
          <button
            type='button'
            onClick={handleReset}
            className='px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-md'
          >
            기본값으로 리셋
          </button>
        </div>
      </div>

      {/* Request 범위 설정 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded-sm bg-blue-500'></div>
          <h4 className='text-sm font-semibold text-gray-900'>Request 정상 범위 (Mbps)</h4>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>최소값</label>
            <input
              type='number'
              step='0.1'
              min='0'
              value={settings.requestMin}
              onChange={(e) => handleChange('requestMin', e.target.value)}
              disabled={!settings.enabled}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500'
              placeholder='0.0'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>최대값</label>
            <input
              type='number'
              step='0.1'
              min='0'
              value={settings.requestMax}
              onChange={(e) => handleChange('requestMax', e.target.value)}
              disabled={!settings.enabled}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500'
              placeholder='1.0'
            />
          </div>
        </div>
      </div>

      {/* Response 범위 설정 */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded-sm bg-green-500'></div>
          <h4 className='text-sm font-semibold text-gray-900'>Response 정상 범위 (Mbps)</h4>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>최소값</label>
            <input
              type='number'
              step='0.1'
              min='0'
              value={settings.responseMin}
              onChange={(e) => handleChange('responseMin', e.target.value)}
              disabled={!settings.enabled}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500'
              placeholder='0.0'
            />
          </div>
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>최대값</label>
            <input
              type='number'
              step='0.1'
              min='0'
              value={settings.responseMax}
              onChange={(e) => handleChange('responseMax', e.target.value)}
              disabled={!settings.enabled}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500'
              placeholder='1.5'
            />
          </div>
        </div>
      </div>

      {/* 설명 */}
      <div className='p-3 bg-gray-50 rounded-lg'>
        <p className='text-xs text-gray-600'>
          💡 설정한 범위를 벗어나는 데이터는 그래프에 빨간색 점으로 표시되며, 실시간으로 알림을 받게
          됩니다.
        </p>
      </div>
    </form>
  )
}

TrafficTrendSetting.propTypes = {
  currentSettings: PropTypes.shape({
    requestMin: PropTypes.number,
    requestMax: PropTypes.number,
    responseMin: PropTypes.number,
    responseMax: PropTypes.number,
    enabled: PropTypes.bool,
  }),
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default TrafficTrendSetting
