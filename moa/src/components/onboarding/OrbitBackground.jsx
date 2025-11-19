// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'

const ORBIT_COUNT = 52
const START_SPREAD = 0.2 // 초기 퍼짐 정도
const CENTER = 450
const RX = 110
const RY = 420
const FINAL_GROUP_OPACITY = 0.6 // 최종 밝기

export const OrbitBackground = () => {
  // 전체 각도 리스트
  const rawAngles = Array.from({ length: ORBIT_COUNT }, (_, i) => {
    const angle = (360 / ORBIT_COUNT) * i
    return { id: i, angle }
  })

  // 위쪽 아치(half) 사용
  const visibleAngles = rawAngles.filter(({ angle }) => {
    return angle >= 20 && angle <= 160
  })

  // 스타일 계산
  const orbits = visibleAngles.map((item, index) => {
    const progress = visibleAngles.length > 1 ? index / (visibleAngles.length - 1) : 0
    return {
      id: item.id,
      targetRotate: item.angle,
      strokeWidth: 1.7 + progress * 0.6,
      delay: 0.15 + index * 0.03,
    }
  })

  return (
    <div className='pointer-events-none absolute inset-0 flex justify-center overflow-hidden'>
      <motion.svg
        width='900'
        height='900'
        viewBox='0 0 900 900'
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        className='drop-shadow-[0_0_60px_rgba(59,130,246,0.40)]'
        shapeRendering='geometricPrecision'
      >
        <defs>
          <filter id='soft-orbit-stroke' x='-50%' y='-50%' width='200%' height='200%'>
            <feGaussianBlur in='SourceGraphic' stdDeviation='2.0' result='blur' />
            <feMerge>
              <feMergeNode in='blur' />
              <feMergeNode in='SourceGraphic' />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          animate={{ rotate: 360, opacity: FINAL_GROUP_OPACITY }}
          initial={{ rotate: 0, opacity: 0 }}
          transition={{
            rotate: {
              duration: 60,
              ease: 'linear',
              repeat: Infinity,
            },
            opacity: {
              duration: 2,
              ease: 'easeOut',
            },
          }}
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        >
          {orbits.map((orbit) => (
            <motion.g
              key={orbit.id}
              initial={{
                rotate: orbit.targetRotate * START_SPREAD,
              }}
              animate={{
                rotate: orbit.targetRotate,
              }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
                delay: orbit.delay,
              }}
              style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            >
              <ellipse
                cx={CENTER}
                cy={CENTER}
                rx={RX}
                ry={RY}
                fill='none'
                stroke='white'
                strokeWidth={orbit.strokeWidth}
                filter='url(#soft-orbit-stroke)'
                strokeOpacity={1}
              />
            </motion.g>
          ))}
        </motion.g>
      </motion.svg>
    </div>
  )
}

export default OrbitBackground
