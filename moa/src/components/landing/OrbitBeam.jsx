// 작성자: 최이서

const ORBIT_RADIUS = 260

const getPathByVariant = (variant, size = 'base') => {
  const config = {
    base: { line: 350, diagonal: 350, offset: 80, vertical: 50 },
    '4xl': { line: 500, diagonal: 550, offset: 100, vertical: 65 },
  }

  const { line, diagonal, offset, vertical } = config[size]

  switch (variant) {
    case 'tl':
      return `M 0 0 L -${line} 0`
    case 'tr':
      return `M 0 0 L ${offset} -${vertical} L ${diagonal} -${vertical}`
    case 'bl':
      return `M 0 0 L -${offset} ${vertical} L -${diagonal} ${vertical}`
    case 'br':
    default:
      return `M 0 0 L ${line} 0`
  }
}

const OrbitBeam = ({ angleDeg, offsetX = 0, radius = ORBIT_RADIUS, variant = 'tl', delay = 0 }) => {
  const rad = (angleDeg * Math.PI) / 180

  // 반응형 설정 (Dot 컴포넌트와 동일)
  const responsiveRadius = radius * 0.75
  const responsiveOffsetX = offsetX * 0.7

  // 기본 화면용 좌표
  const xBase = responsiveRadius * Math.cos(rad) + responsiveOffsetX
  const yBase = responsiveRadius * -Math.sin(rad)

  // 4xl 화면용 좌표
  const x = radius * Math.cos(rad) + offsetX
  const y = radius * -Math.sin(rad)

  const gradientId = `orbitBeamGradient-${variant}-${angleDeg}`

  return (
    <>
      {/* 기본 (base) 버전 - 4xl 미만 */}
      <div
        className='absolute 4xl:hidden'
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${xBase}px, ${yBase}px)`,
        }}
      >
        <svg width='240' height='80' viewBox='-120 -40 240 80' className='overflow-visible'>
          <defs>
            <linearGradient
              id={`${gradientId}-base`}
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
            d={getPathByVariant(variant, 'base')}
            fill='none'
            stroke={`url(#${gradientId}-base)`}
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>
      </div>

      {/* 4xl 버전 - 4xl 이상 */}
      <div
        className='absolute hidden 4xl:block'
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        }}
      >
        <svg width='320' height='100' viewBox='-160 -50 320 100' className='overflow-visible'>
          <defs>
            <linearGradient
              id={`${gradientId}-4xl`}
              x1='-450'
              y1='0'
              x2='450'
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
            d={getPathByVariant(variant, '4xl')}
            fill='none'
            stroke={`url(#${gradientId}-4xl)`}
            strokeWidth='2'
            strokeLinecap='round'
          />
        </svg>
      </div>
    </>
  )
}

export default OrbitBeam
