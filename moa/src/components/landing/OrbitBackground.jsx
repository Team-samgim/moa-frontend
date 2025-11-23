// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'

const ORBIT_COUNT = 52
const START_SPREAD = 0.2 // 초기 퍼짐 정도
const CENTER = 450
const RX = 110
const RY = 420
const FINAL_GROUP_OPACITY = 0.6 // 최종 밝기

export const OrbitBackground = () => {
  const rawAngles = Array.from({ length: ORBIT_COUNT }, (_, i) => {
    const angle = (360 / ORBIT_COUNT) * i
    return { id: i, angle }
  })

  const visibleAngles = rawAngles.filter(({ angle }) => {
    return angle >= 20 && angle <= 160
  })

  const orbits = visibleAngles.map((item, index) => {
    const progress = visibleAngles.length > 1 ? index / (visibleAngles.length - 1) : 0
    return {
      id: item.id,
      targetRotate: item.angle,
      strokeWidth: 1.5 + progress * 0.6,
      delay: 0.15 + index * 0.03,
    }
  })

  return (
    <motion.svg
      viewBox='0 0 900 900'
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.7 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
      className='w-full h-full drop-shadow-[0_0_60px_rgba(59,130,246,0.40)]'
      preserveAspectRatio='xMidYMid meet'
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

      <g className='orbit-spin' filter='url(#soft-orbit-stroke)'>
        {orbits.map((orbit) => (
          <motion.ellipse
            key={orbit.id}
            cx={CENTER}
            cy={CENTER}
            rx={RX}
            ry={RY}
            fill='none'
            stroke='white'
            strokeWidth={orbit.strokeWidth}
            strokeOpacity={1}
            strokeLinecap='round'
            initial={{ rotate: orbit.targetRotate * START_SPREAD }}
            animate={{ rotate: orbit.targetRotate }}
            transition={{
              duration: 1.3,
              ease: 'easeOut',
              delay: orbit.delay,
            }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />
        ))}
      </g>
    </motion.svg>
  )
}

export default OrbitBackground
