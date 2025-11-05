import ArrowDownIcon from '@/assets/icons/arrow-down.svg?react'
import ResetIcon from '@/assets/icons/reset.svg?react'
import { LAYER_OPTIONS, TIME_PRESETS } from '@/constants/pivot'

const PivotConfigPanel = ({ layer, timeRange, onChangeLayer, onSelectTimePreset }) => {
  return (
    <div className='w-full max-w-xs shrink-0 space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='text-base font-semibold text-gray-900'>피벗 테이블 구성</div>

        <div className='flex flex-wrap items-center gap-3 text-xs font-medium text-[#2263AC]'>
          <button className='hover:underline'>프리셋 저장</button>
          <button className='hover:underline'>프리셋 불러오기</button>
        </div>
      </div>

      {/* 조회 계층 */}
      <div>
        <div className='mb-3 text-sm font-medium text-gray-800'>조회 계층</div>
        <div className='flex flex-wrap justify-between w-full'>
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onChangeLayer(opt)}
              className={[
                'rounded border px-3 py-2 text-xs font-medium',
                layer === opt
                  ? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                  : 'bg-[#F5F5F7] text-gray-700 border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 조회 기간 */}
      <div>
        <div className='mb-3 flex justify-between items-center gap-2 text-sm font-medium text-gray-800'>
          <span>조회 기간</span>
          <button
            className='rounded border border-gray-300 bg-white p-1 hover:bg-gray-50'
            title='시간 새로고침'
            onClick={() => {
              if (timeRange?.type === 'preset' && timeRange?.value) {
                onSelectTimePreset(timeRange.value)
              }
            }}
          >
            <ResetIcon className='h-3.5 w-3.5 text-gray-500' />
          </button>
        </div>

        <div className='grid grid-cols-4 gap-2.5 w-full'>
          {TIME_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => onSelectTimePreset(p.value)}
              className={[
                'rounded border px-3 py-2 text-xs font-medium',
                timeRange?.value === p.value
                  ? 'bg-[#EAF1F9] text-gray-700 border-gray-300'
                  : 'bg-[#F5F5F7] text-gray-700 border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* TODO: 직접 설정 기능 추가 */}
        <div className='mt-2'>
          <button className='flex w-full items-center justify-between rounded border border-gray-300 bg-white px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50'>
            <span>직접 설정</span>
            <ArrowDownIcon className='h-3 w-3 text-gray-500' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default PivotConfigPanel
