// 작성자: 최이서
// ColorRing을 사용한 로딩 스피너 컴포넌트

import { ColorRing } from 'react-loader-spinner'

const LoadingSpinner = ({
  visible = true,
  size = 80,
  className = '',
  colors = ['#3877BE', '#C4D398', '#F9ECA8', '#C4D398', '#3877BE'],
}) => {
  if (!visible) return null

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <ColorRing
        visible={true}
        height={size}
        width={size}
        ariaLabel='color-ring-loading'
        wrapperStyle={{}}
        wrapperClass='color-ring-wrapper'
        colors={colors}
      />
    </div>
  )
}

export default LoadingSpinner
