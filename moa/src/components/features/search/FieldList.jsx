const FieldList = ({ loading, error, fields, filter, onFilter, selectedKeys, onToggle }) => {
  const selectedCount = selectedKeys ? selectedKeys.size : 0

  return (
    <div className='card'>
      {/* Header */}
      <div className='flex items-center justify-between mb-2'>
        <div className='text-base font-medium'>조건 필드 선택</div>
        <div className='text-xs text-gray-400'>{selectedCount}개 선택</div>
      </div>

      {/* Search */}
      <div className='relative mb-3'>
        <input
          className='input pr-9'
          placeholder='필드 검색'
          value={filter}
          onChange={(e) => onFilter(e.target.value)}
        />
        <span className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='w-4 h-4'
          >
            <circle cx='11' cy='11' r='7' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
        </span>
      </div>

      {/* List */}
      <div className='list'>
        {loading && <div className='muted'>로딩중…</div>}
        {error && <div className='text-sm text-red-500'>{error}</div>}

        {!loading && !error && (
          <div className='rounded-xl border border-gray-200 overflow-hidden bg-white'>
            <ul className='max-h-64 overflow-auto divide-y divide-gray-100'>
              {fields.map((f) => {
                const checked = selectedKeys.has(f.key)
                return (
                  <li key={f.key}>
                    <label
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${checked ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-50`}
                    >
                      <input
                        type='checkbox'
                        className='w-4 h-4 accent-[#3877BE]'
                        checked={checked}
                        onChange={(e) => onToggle(f, e.target.checked)}
                      />
                      <span className='text-sm'>{f.key}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default FieldList
