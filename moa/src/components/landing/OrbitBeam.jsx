const ORBIT_RADIUS = 260

const getPathByVariant = (variant) => {
  switch (variant) {
    // 왼쪽 상단: 점 기준으로 왼쪽으로 쭉
    case 'tl':
      return 'M 0 0 L -350 0'

    // 오른쪽 상단: 점 → 대각선 위 오른쪽 → 오른쪽 수평
    case 'tr':
      return 'M 0 0 L 80 -50 L 350 -50'

    // 왼쪽 하단: 점 → 대각선 아래 왼쪽 → 왼쪽 수평
    case 'bl':
      return 'M 0 0 L -80 50 L -350 50'

    // 오른쪽 하단: 점 기준으로 오른쪽으로 쭉
    case 'br':
    default:
      return 'M 0 0 L 350 0'
  }
}

const OrbitBeam = ({ angleDeg, offsetX = 0, radius = ORBIT_RADIUS, variant = 'tl', delay = 0 }) => {
  const rad = (angleDeg * Math.PI) / 180
  const x = radius * Math.cos(rad) + offsetX
  const y = radius * -Math.sin(rad)

  const d = getPathByVariant(variant)

  // 각 OrbitBeam마다 고유한 gradient ID 생성
  const gradientId = `orbitBeamGradient-${variant}-${angleDeg}`

  return (
    <div
      className='absolute'
      style={{
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      }}
    >
      <svg width='240' height='80' viewBox='-120 -40 240 80' className='overflow-visible'>
        <defs>
          <linearGradient
            id={gradientId}
            x1='-350'
            y1='0'
            x2='350'
            y2='0'
            gradientUnits='userSpaceOnUse'
          >
            <stop offset='0%' stopColor='#649CDB'>
              <animate
                attributeName='stop-color'
                values='#649CDB; #FFFFFF; #FFFFFF; #649CDB; #649CDB'
                dur='8s'
                begin={`${delay}s`}
                repeatCount='indefinite'
              />
            </stop>

            <stop offset='100%' stopColor='#FFFFFF' stopOpacity='1'>
              <animate
                attributeName='stop-color'
                values='#FFFFFF; #649CDB; #649CDB; #FFFFFF'
                dur='8s'
                begin={`${delay}s`}
                repeatCount='indefinite'
              />
            </stop>
          </linearGradient>
        </defs>

        <path
          d={d}
          fill='none'
          stroke={`url(#${gradientId})`}
          strokeWidth='2'
          strokeLinecap='round'
        />
      </svg>
    </div>
  )
}

export default OrbitBeam
