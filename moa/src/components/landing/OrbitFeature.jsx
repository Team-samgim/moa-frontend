// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import OrbitBeam from './OrbitBeam'

const RADIUS = 260

const Dot = ({ angleDeg, radius = RADIUS, offsetX = 0, offsetY = 0, animationOrder }) => {
  const rad = (angleDeg * Math.PI) / 180

  // 반응형 radius: 기본 220, 4xl 260
  const responsiveRadius = radius * 0.75 // 기본값은 85% (약 221)
  const responsiveOffsetX = offsetX * 0.7 // 기본값은 80%

  // 기본 화면용 좌표
  const xBase = responsiveRadius * Math.cos(rad)
  const yBase = responsiveRadius * -Math.sin(rad)

  // 4xl 화면용 좌표
  const x = radius * Math.cos(rad)
  const y = radius * -Math.sin(rad)

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 1.8 + animationOrder * 0.2,
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  return (
    <>
      {/* 기본 화면 (4xl 미만) */}
      <motion.div
        className='absolute 4xl:hidden'
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${xBase + responsiveOffsetX}px, ${yBase + offsetY}px)`,
        }}
        variants={fadeInVariants}
        initial='hidden'
        animate='visible'
      >
        <div className='relative flex items-center justify-center w-10 h-10 orbit-dot-glow'>
          <div
            className='absolute inset-0 rounded-full opacity-70
            bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.35)_40%,rgba(15,23,42,0)_70%)]'
          />
          <div className='relative w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' />
        </div>
      </motion.div>

      {/* 4xl 화면 */}
      <motion.div
        className='absolute hidden 4xl:block'
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${x + offsetX}px, ${y + offsetY}px)`,
        }}
        variants={fadeInVariants}
        initial='hidden'
        animate='visible'
      >
        <div className='relative flex items-center justify-center w-10 h-10 orbit-dot-glow'>
          <div
            className='absolute inset-0 rounded-full opacity-70
            bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.35)_40%,rgba(15,23,42,0)_70%)]'
          />
          <div className='relative w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]' />
        </div>
      </motion.div>
    </>
  )
}

const FeatureLabel = ({ angleDeg, offsetX, variant, title, description, animationOrder }) => {
  const rad = (angleDeg * Math.PI) / 180
  const x = RADIUS * Math.cos(rad) + offsetX
  const y = RADIUS * -Math.sin(rad)

  const getLabelClasses = () => {
    const positions = {
      tl: 'left-[-240px] 4xl:left-[-500px] top-[0px] 4xl:top-[-85px] text-left',
      tr: 'right-[-240px] 4xl:right-[-550px] top-[-50px] 4xl:top-[-150px] text-right',
      bl: 'left-[-240px] 4xl:left-[-550px] top-[-65px] 4xl:top-[-20px] text-left',
      br: 'right-[-240px] 4xl:right-[-500px] top-[-115px] 4xl:top-[-85px] text-right',
    }
    return positions[variant] || ''
  }

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 1.9 + animationOrder * 0.2,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      className='absolute pointer-events-none'
      style={{
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      }}
      variants={fadeInVariants}
      initial='hidden'
      animate='visible'
    >
      <div className={`absolute min-w-[200px] 4xl:min-w-[260px] ${getLabelClasses()}`}>
        <h3 className='text-m 4xl:text-2xl font-bold text-[#2a4787] 4xl:mb-1 whitespace-nowrap'>
          {title}
        </h3>
        <p className='text-sm 4xl:text-lg text-[#4a74cd] leading-relaxed'>{description}</p>
      </div>
    </motion.div>
  )
}

const AnimatedOrbitBeam = ({ angleDeg, offsetX, variant, delay, animationOrder }) => {
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 1.8 + animationOrder * 0.2,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div variants={fadeInVariants} initial='hidden' animate='visible'>
      <OrbitBeam angleDeg={angleDeg} offsetX={offsetX} variant={variant} delay={delay} />
    </motion.div>
  )
}

const OrbitFeatures = () => {
  const features = [
    {
      angleDeg: 120,
      offsetX: -250,
      variant: 'tl',
      delay: 0,
      title: '대시보드',
      description: '실시간 모니터링과 스마트 이상 징후 알림',
      animationOrder: 0,
    },
    {
      angleDeg: 60,
      offsetX: 250,
      variant: 'tr',
      delay: 2,
      title: '검색 & 그리드',
      description: '조건 선택만으로 필요한 데이터 즉시 조회',
      animationOrder: 1,
    },
    {
      angleDeg: -120,
      offsetX: -250,
      variant: 'bl',
      delay: 6,
      title: '피벗 모드',
      description: '테이블과 차트를 통한 다차원 분석',
      animationOrder: 2,
    },
    {
      angleDeg: -60,
      offsetX: 250,
      variant: 'br',
      delay: 4,
      title: '프리셋/파일 관리',
      description: '프리셋과 파일 저장으로 작업 시간 단축',
      animationOrder: 3,
    },
  ]

  return (
    <>
      {features.map((feature, index) => (
        <div key={index}>
          <AnimatedOrbitBeam
            angleDeg={feature.angleDeg}
            offsetX={feature.offsetX}
            variant={feature.variant}
            delay={feature.delay}
            animationOrder={feature.animationOrder}
          />
          <Dot
            angleDeg={feature.angleDeg}
            offsetX={feature.offsetX}
            animationOrder={feature.animationOrder}
          />
          <FeatureLabel
            angleDeg={feature.angleDeg}
            offsetX={feature.offsetX}
            variant={feature.variant}
            title={feature.title}
            description={feature.description}
            animationOrder={feature.animationOrder}
          />
        </div>
      ))}
    </>
  )
}

export default OrbitFeatures
