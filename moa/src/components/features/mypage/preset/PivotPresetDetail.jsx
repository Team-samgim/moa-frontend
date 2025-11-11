import { memo } from 'react'

const PivotPresetDetail = ({ payload }) => {
  const p = payload || {}
  const col = p.columns || p.col || []
  const rows = p.rows || []
  const values = p.values || []

  return (
    <div className='grid grid-cols-3 gap-4'>
      <div className='rounded-xl'>
        <div className='border border-[#D1D1D6] px-4 py-2 text-[12px] text-gray-600'>
          열 (Column)
        </div>
        <div className='max-h-48 p-3'>
          {col.length ? (
            col.map((v, i) => (
              <div
                key={i}
                className='rounded border border-[#D1D1D6] bg-white px-2 py-1 text-[12px]'
              >
                {v}
              </div>
            ))
          ) : (
            <div className='text-[12px] text-gray-500'>-</div>
          )}
        </div>
      </div>

      <div className='rounded-xl border border-[#D1D1D6] bg-white/50'>
        <div className='border border-[#D1D1D6] px-4 py-2 text-[12px] text-gray-600'>행 (Rows)</div>
        <div className='max-h-48 overflow-auto p-3'>
          {rows.length ? (
            rows.map((v, i) => (
              <div
                key={i}
                className='rounded border border-[#D1D1D6] bg-white px-2 py-1 text-[12px]'
              >
                {v}
              </div>
            ))
          ) : (
            <div className='text-[12px] text-gray-500'>-</div>
          )}
        </div>
      </div>

      <div className='rounded-xl border border-[#D1D1D6] bg-white/50'>
        <div className='border border-[#D1D1D6] px-4 py-2 text-[12px] text-gray-600'>
          값 (Values)
        </div>
        <div className='max-h-48 overflow-auto p-3'>
          {values.length ? (
            values.map((v, i) => (
              <div
                key={i}
                className='rounded border border-[#D1D1D6] bg-white px-2 py-1 text-[12px]'
              >
                {typeof v === 'string' ? v : v?.label || JSON.stringify(v)}
              </div>
            ))
          ) : (
            <div className='text-[12px] text-gray-500'>-</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(PivotPresetDetail)
