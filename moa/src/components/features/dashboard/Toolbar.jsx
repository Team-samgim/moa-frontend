import { useDashboardStore } from '@/stores/dashboardStore'

const PRESETS = [
  { key: '1H', label: '최근 1시간' },
  { key: '24H', label: '최근 24시간' },
  { key: '7D', label: '최근 7일' },
]

/**
 * 대시보드 상단 툴바
 * - 좌측: + 위젯 추가 / 필터 설정 / 저장 / 기간 프리셋
 * - 우측: 실시간 토글(상태 뱃지)
 */
const Toolbar = ({
  onAddWidget = () => {},
  onFilterSettings = () => {},
  onSaveLayout = () => {},
}) => {
  const { timePreset, live, setTimePreset, setLive } = useDashboardStore()

  return (
    <div className='flex items-center justify-between gap-2'>
      {/* 좌측 컨트롤 */}
      <div className='flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto'>
        {/* 위젯 추가 */}
        <button
          className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
          onClick={onAddWidget}
        >
          <span className='text-lg leading-none'>＋</span>
          위젯 추가
        </button>

        {/* 필터 설정 */}
        <button
          className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          onClick={onFilterSettings}
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
          필터 설정
        </button>

        {/* 저장 */}
        <button
          className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          onClick={onSaveLayout}
        >
          <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
            />
          </svg>
          저장
        </button>

        {/* 기간 프리셋 */}
        <div className='relative'>
          <select
            className='appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
            value={timePreset ?? '1H'}
            onChange={(e) => setTimePreset(e.target.value)}
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <svg
            className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </div>
      </div>

      {/* 우측: 실시간 토글 */}
      <button
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          live
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'border border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => setLive(!live)}
        aria-pressed={live}
      >
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            live ? 'bg-white animate-pulse' : 'bg-gray-400'
          }`}
        />
        {live ? '실시간 업데이트' : '실시간 업데이트'}
      </button>
    </div>
  )
}

export default Toolbar
