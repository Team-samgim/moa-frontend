/**
 * 작성자: 정소영
 */
import { useState } from 'react'
import Select from 'react-select'

/**
 * EUM 대시보드 필터 컴포넌트
 * 백엔드에서 받은 availableFilters를 기반으로 멀티셀렉트 필터 제공
 */
const DashboardFilters = ({
  availableFilters,
  currentFilters,
  onFilterChange,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(currentFilters || {})

  // 멀티셀렉트 옵션 변환
  const getOptions = (items) => {
    if (!items) return []
    return items.map((item) => ({
      value: item,
      label: item,
    }))
  }

  // 선택된 값 변환
  const getSelectedValues = (filterKey) => {
    const values = localFilters[filterKey] || []
    return values.map((value) => ({
      value,
      label: value,
    }))
  }

  // 필터 변경 핸들러
  const handleMultiSelectChange = (filterKey, selected) => {
    setLocalFilters({
      ...localFilters,
      [filterKey]: selected ? selected.map((s) => s.value) : [],
    })
  }

  // 텍스트 입력 필터 변경
  const handleTextChange = (filterKey, value) => {
    setLocalFilters({
      ...localFilters,
      [filterKey]: value,
    })
  }

  // 적용 버튼
  const handleApply = () => {
    // 빈 값 제거
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = value
      } else if (typeof value === 'string' && value.trim() !== '') {
        acc[key] = value
      }
      return acc
    }, {})

    onFilterChange(cleanedFilters)
    if (onApply) onApply()
  }

  // 초기화
  const handleReset = () => {
    setLocalFilters({})
    onFilterChange({})
  }

  // 선택된 필터 개수
  const selectedCount = Object.values(localFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim() !== ''
    return false
  }).length

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='w-full max-w-5xl max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden'>
        {/* Header */}
        <div className='flex items-start justify-between px-8 pt-6 pb-4 border-b'>
          <div>
            <h2 className='text-2xl font-semibold text-gray-900'>필터 라이브러리</h2>
            <p className='mt-1 text-sm text-gray-500'>
              선택한 항목으로 대시보드 위젯에 적용할 필터를 구성합니다.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className='p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors'
              aria-label='필터 닫기'
            >
              <svg
                className='w-5 h-5 text-gray-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto px-8 py-6 bg-[#F5F7FB]'>
          {/* 그룹 1: 클라이언트 환경 */}
          <div className='mb-3 text-[11px] font-semibold tracking-wide text-gray-500'>
            클라이언트 환경
          </div>
          <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
            {/* 국가 필터 카드 */}
            {availableFilters?.countries && availableFilters.countries.length > 0 && (
              <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition'>
                <div className='mb-1 text-[11px] font-semibold text-gray-500'>국가</div>
                <div className='mb-2 text-xs text-gray-400'>
                  여러 국가를 선택해 트래픽을 비교합니다.
                </div>
                <Select
                  isMulti={true}
                  options={getOptions(availableFilters.countries)}
                  value={getSelectedValues('countries')}
                  onChange={(selected) => handleMultiSelectChange('countries', selected)}
                  placeholder='국가를 선택하세요...'
                  className='text-sm'
                  classNamePrefix='react-select'
                  noOptionsMessage={() => '데이터 없음'}
                />
              </div>
            )}

            {/* 브라우저 필터 카드 */}
            {availableFilters?.browsers && availableFilters.browsers.length > 0 && (
              <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition'>
                <div className='mb-1 text-[11px] font-semibold text-gray-500'>브라우저</div>
                <div className='mb-2 text-xs text-gray-400'>브라우저별 성능 차이를 확인합니다.</div>
                <Select
                  isMulti={true}
                  options={getOptions(availableFilters.browsers)}
                  value={getSelectedValues('browsers')}
                  onChange={(selected) => handleMultiSelectChange('browsers', selected)}
                  placeholder='브라우저를 선택하세요...'
                  className='text-sm'
                  classNamePrefix='react-select'
                />
              </div>
            )}

            {/* 디바이스 필터 카드 */}
            {availableFilters?.devices && availableFilters.devices.length > 0 && (
              <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition'>
                <div className='mb-1 text-[11px] font-semibold text-gray-500'>디바이스</div>
                <div className='mb-2 text-xs text-gray-400'>
                  PC / 모바일 등 디바이스 타입을 선택합니다.
                </div>
                <Select
                  isMulti={true}
                  options={getOptions(availableFilters.devices)}
                  value={getSelectedValues('devices')}
                  onChange={(selected) => handleMultiSelectChange('devices', selected)}
                  placeholder='디바이스를 선택하세요...'
                  className='text-sm'
                  classNamePrefix='react-select'
                />
              </div>
            )}
          </div>

          {/* 그룹 2: HTTP 요청 정보 */}
          <div className='mb-3 text-[11px] font-semibold tracking-wide text-gray-500'>
            HTTP 요청 정보
          </div>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {/* HTTP Method 카드 */}
            {availableFilters?.httpMethods && availableFilters.httpMethods.length > 0 && (
              <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition'>
                <div className='mb-1 text-[11px] font-semibold text-gray-500'>HTTP Method</div>
                <div className='mb-2 text-xs text-gray-400'>
                  GET / POST 등 요청 방식을 선택합니다.
                </div>
                <Select
                  isMulti={true}
                  options={getOptions(availableFilters.httpMethods)}
                  value={getSelectedValues('httpMethods')}
                  onChange={(selected) => handleMultiSelectChange('httpMethods', selected)}
                  placeholder='HTTP Method를 선택하세요...'
                  className='text-sm'
                  classNamePrefix='react-select'
                />
              </div>
            )}

            {/* HTTP Host 카드 */}
            <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition md:col-span-2'>
              <div className='mb-1 text-[11px] font-semibold text-gray-500'>HTTP Host</div>
              <div className='mb-2 text-xs text-gray-400'>도메인명으로 트래픽을 필터링합니다.</div>
              <input
                type='text'
                value={localFilters.httpHost || ''}
                onChange={(e) => handleTextChange('httpHost', e.target.value)}
                placeholder='예: example.com'
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* HTTP URI 카드 */}
            <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition md:col-span-2'>
              <div className='mb-1 text-[11px] font-semibold text-gray-500'>HTTP URI</div>
              <div className='mb-2 text-xs text-gray-400'>엔드포인트 경로로 세부 필터링합니다.</div>
              <input
                type='text'
                value={localFilters.httpUri || ''}
                onChange={(e) => handleTextChange('httpUri', e.target.value)}
                placeholder='예: /api/users'
                className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* 응답 코드 카드 */}
            <div className='rounded-2xl bg-white px-4 py-3 shadow-sm border border-transparent hover:border-[#3877BE]/40 hover:shadow-md transition md:col-span-3'>
              <div className='mb-1 text-[11px] font-semibold text-gray-500'>HTTP 응답 코드</div>
              <div className='mb-2 text-xs text-gray-400'>
                상태 코드 범위로 오류 구간을 찾습니다.
              </div>
              <div className='flex gap-2'>
                <select
                  value={localFilters.httpResCodeOperator || '>='}
                  onChange={(e) => handleTextChange('httpResCodeOperator', e.target.value)}
                  className='px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                >
                  <option value='='>=</option>
                  <option value='>'>&gt;</option>
                  <option value='>='>&gt;=</option>
                  <option value='<'>&lt;</option>
                  <option value='<='>&lt;=</option>
                </select>
                <input
                  type='number'
                  value={localFilters.httpResCode || ''}
                  onChange={(e) => handleTextChange('httpResCode', e.target.value)}
                  placeholder='예: 400'
                  className='flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between gap-3 px-8 py-4 border-t bg-white'>
          <span className='text-xs text-gray-500'>
            {selectedCount > 0 ? `선택된 필터 ${selectedCount}개` : '선택된 필터 없음'}
          </span>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={handleReset}
              className='px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              필터 초기화
            </button>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors'
            >
              취소
            </button>
            <button
              type='button'
              onClick={handleApply}
              className='px-4 py-2 text-xs font-semibold text-white bg-[#3877BE] rounded-lg hover:bg-[#2d619f] transition-colors shadow-sm'
            >
              적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardFilters
