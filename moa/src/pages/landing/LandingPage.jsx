// 작성자: 최이서
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import OrbitBackground from '@/components/landing/OrbitBackground'
import OrbitFeatures from '@/components/landing/OrbitFeature'
import { loggedOutNavigations } from '@/constants/navigations'

const LandingPage = () => {
  const navigate = useNavigate()
  const title = 'EUM 데이터 분석 시스템'

  const gradualSpacingVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      filter: 'blur(10px)',
    },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        delay: 0.3 + i * 0.04,
        duration: 0.7,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  }

  // 컨테이너 애니메이션: 전체 글자 간격
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const fadeInUpVariants = {
    hidden: {
      opacity: 0,
      y: 30, // from bottom
    },
    visible: {
      opacity: 1,
      y: 0, // to original position
      transition: {
        delay: 1,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  }

  return (
    <div className='relative min-h-screen overflow-hidden flex items-center justify-center mt-15'>
      {/* OrbitBackground 컨테이너 */}
      <div className='relative w-full max-w-[min(90vw,90vh,1100px)] aspect-square'>
        <OrbitBackground />
        <OrbitFeatures />

        {/* 텍스트 영역 - OrbitBackground 정중앙 */}
        <div className='absolute inset-0 flex flex-col items-center justify-center px-6 text-center'>
          <motion.h1
            className='text-4xl md:text-6xl font-bold tracking-tight text-[#2a4787]'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {title.split('').map((char, index) => (
              <motion.span
                key={index}
                custom={index}
                variants={gradualSpacingVariants}
                className='inline-block'
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            variants={fadeInUpVariants}
            initial='hidden'
            animate='visible'
            className='mt-4 text-base md:text-xl text-blue-dark'
          >
            복잡한 데이터 분석, MOA와 함께 시작하세요
          </motion.p>

          <motion.div
            variants={fadeInUpVariants}
            initial='hidden'
            animate='visible'
            className='mt-8 flex flex-col items-center gap-4 md:flex-row md:gap-6'
          >
            <button
              onClick={() => navigate(loggedOutNavigations.LOGIN)}
              className='rounded-full bg-linear-to-r from-[#4a74cd] to-[#2d50ae] px-8 py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-blue-400/50 hover:shadow-xl hover:shadow-blue-400/60 transition-shadow'
            >
              MOA 시작하기
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
