/**
 * LayerCell
 *
 * 레이어(layer) 값을 표시하는 테이블/그리드용 셀 컴포넌트.
 * layer 문자열과 해당 layer의 색상 팔레트(hex)를 함께 보여준다.
 *
 * 동작:
 * - layer 값이 없으면 '-' 표시
 * - layer 값이 있으면 getPalette(layer)로 컬러 hex 값을 가져와 색 점과 텍스트 표시
 *
 * Props:
 * - layer: 레이어명(string)
 *
 * 특징:
 * - 색상 점(원형) + 레이어명 조합
 * - memo 적용으로 렌더 성능 최적화
 *
 * AUTHOR: 방대혁
 */
import { memo } from 'react'
import { getPalette } from '@/constants/tokens'

const LayerCell = ({ layer }) => {
  // 값이 없을 때 표시
  if (!layer) return <span className='text-gray-400'>-</span>

  // 레이어 색상 hex 코드
  const hex = getPalette(layer)

  return (
    <div className='flex items-center gap-2'>
      {/* 색상 점 표시 */}
      <span className='inline-block h-2 w-2 rounded-full' style={{ backgroundColor: hex }} />
      {/* 레이어 텍스트 */}
      <span className='text-sm'>{layer}</span>
    </div>
  )
}

export default memo(LayerCell)
