import OrbitBackground from '@/components/onboarding/OrbitBackground'
import OrbitFeatures from '@/components/onboarding/OrbitFeature'

const OnboardingPage = () => {
  return (
    <div className='relative min-h-screen overflow-hidden'>
      <div className='absolute inset-0 flex justify-center mt-10'>
        <OrbitBackground />
      </div>
      <OrbitFeatures />
      <div className='relative z-10 flex flex-col items-center justify-center px-6 text-center mt-100'>
        <h1 className='text-4xl md:text-6xl font-bold tracking-tight text-blue-dark'>
          lorem ipsum moa
        </h1>
        <p className='mt-4 text-base md:text-xl text-blue-dark'>lorem import second from 'first'</p>

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

export default OnboardingPage
