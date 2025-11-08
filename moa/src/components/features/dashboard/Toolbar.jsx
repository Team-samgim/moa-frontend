import { useDashboardStore } from '@/stores/dashboardStore'
const PRESETS = [
  { key: '1H', label: '최근 1시간' },
  { key: '24H', label: '최근 24시간' },
  { key: '7D', label: '최근 7일' },
]

/**
 * 대시보드 상단 툴바
 * - 좌측: + 위젯 추가 / 레이아웃 저장 / 기간 프리셋
 * - 우측: 실시간 토글(상태 뱃지)
 * - 제목/설명은 페이지(Dashboard.jsx)에서 렌더링
 */
const Toolbar = ({ onAddWidget = () => {}, onSaveLayout = () => {} }) => {
  const { timePreset, live, setTimePreset, setLive } = useDashboardStore()

  return (
    <div className='flex items-center justify-between gap-2'>
      {/* 좌측 컨트롤 */}
      <div className='flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-x-auto'>
        {/* 위젯 추가 */}
        <button className='btn btn-primary' onClick={onAddWidget}>
          <span className='mr-2 text-lg leading-none'>＋</span>
          위젯 추가
        </button>

        {/* 레이아웃 저장 */}
        <button className='btn' onClick={onSaveLayout}>
          <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
            <path d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.828a2 2 0 00-.586-1.414l-2.828-2.828A2 2 0 0013.172 3H4zm8 0v4a1 1 0 001 1h4' />
          </svg>
          <span className='ml-2'>레이아웃 저장</span>
        </button>

        {/* 기간 프리셋 */}
        <select
          className='select w-auto'
          value={timePreset ?? '1H'}
          onChange={(e) => setTimePreset(e.target.value)}
        >
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* 우측: 실시간 토글 */}
      <button
        className={`btn ${live ? 'btn-success' : 'btn-outline'}`}
        onClick={() => setLive(!live)}
        aria-pressed={live}
      >
        <span
          className={`mr-2 inline-block h-2 w-2 rounded-full ${
            live ? 'bg-green-600 animate-pulse' : 'bg-gray-400'
          }`}
        />
        {live ? '실시간 연결 중' : '실시간 OFF'}
      </button>
    </div>
  )
}

export default Toolbar
