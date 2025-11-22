import OrbitBackground from '@/components/landing/OrbitBackground'
import OrbitFeatures from '@/components/landing/OrbitFeature'

const LandingPage = () => {
  return (
    <div className='relative min-h-screen overflow-hidden'>
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='mt-30 relative w-full max-w-[min(90vw,90vh,1100px)] aspect-square'>
          <OrbitBackground />
          <OrbitFeatures />
        </div>
      </div>

      {/* 텍스트 영역 */}
      <div className='relative z-10 flex flex-col items-center justify-center px-6 text-center mt-100'>
        <h1 className='text-4xl md:text-6xl font-bold tracking-tight text-[#2a4787]'>
          EUM 데이터 분석 시스템
        </h1>
        <p className='mt-4 text-base md:text-xl text-blue-dark'>
          복잡한 데이터 분석, MOA와 함께 시작하세요
        </p>

        <div className='mt-8 flex flex-col items-center gap-4 md:flex-row md:gap-6'>
          <button className='rounded-full bg-linear-to-r from-[#4a74cd] to-[#2d50ae] px-8 py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-blue-400/50'>
            MOA 시작하기
          </button>
          <button className='text-sm md:text-base font-medium text-sky-900 hover:underline'>
            Discover Our Platform →
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
