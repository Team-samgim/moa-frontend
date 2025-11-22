// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import OrbitBeam from './OrbitBeam'

const RADIUS = 260

const Dot = ({ angleDeg, radius = RADIUS, offsetX = 0, offsetY = 0, animationOrder }) => {
  const rad = (angleDeg * Math.PI) / 180
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
    <motion.div
      className='absolute'
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
  )
}

const FeatureLabel = ({ angleDeg, offsetX, variant, title, description, animationOrder }) => {
  const rad = (angleDeg * Math.PI) / 180
  const x = RADIUS * Math.cos(rad) + offsetX
  const y = RADIUS * -Math.sin(rad)

  const getLabelClasses = () => {
    const positions = {
      tl: 'left-[-360px] 4xl:left-[-500px] top-[-70px] text-left',
      tr: 'right-[-360px] 4xl:right-[-550px] top-[-80px] 4xl:top-[-135px] text-right',
      bl: 'left-[-360px] 4xl:left-[-550px] top-[20px] 4xl:top-[-5px] text-left',
      br: 'right-[-360px] 4xl:right-[-500px] top-[20px] 4xl:top-[-70px] text-right',
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
        <h3 className='text-sm 4xl:text-lg font-bold text-[#2a4787] mb-1 whitespace-nowrap'>
          {title}
        </h3>
        <p className='text-xs 4xl:text-base text-[#4a74cd] leading-relaxed'>{description}</p>
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
      title: '실시간 대시보드',
      description: 'lorem ipsum dolor sit amet',
      animationOrder: 0,
    },
    {
      angleDeg: 60,
      offsetX: 250,
      variant: 'tr',
      delay: 2,
      title: '검색 & 그리드',
      description: 'lorem ipsum dolor sit amet',
      animationOrder: 1,
    },
    {
      angleDeg: -120,
      offsetX: -250,
      variant: 'bl',
      delay: 6,
      title: '피벗 모드',
      description: 'lorem ipsum dolor sit amet',
      animationOrder: 2,
    },
    {
      angleDeg: -60,
      offsetX: 250,
      variant: 'br',
      delay: 4,
      title: '파일 관리',
      description: 'lorem ipsum dolor sit amet',
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
