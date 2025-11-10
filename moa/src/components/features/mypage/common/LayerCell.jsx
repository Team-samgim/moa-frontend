import { memo } from 'react'
import { getLayerHex } from '@/constants/tokens'

const LayerCell = ({ layer }) => {
  if (!layer) return <span className='text-gray-400'>-</span>
  const hex = getLayerHex(layer)
  return (
    <div className='flex items-center gap-2'>
      <span className='inline-block h-2 w-2 rounded-full' style={{ backgroundColor: hex }} />
      <span className='text-sm'>{layer}</span>
    </div>
  )
}

export default memo(LayerCell)
