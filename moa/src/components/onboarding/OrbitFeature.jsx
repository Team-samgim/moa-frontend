// src/components/onboarding/OrbitFeatures.jsx

const OrbitFeatures = () => {
  return (
    <>
      {/* 위-왼쪽: 직선 + 점(오른쪽 끝, orbit 쪽) */}
      <div className='absolute top-[14%] left-[29%] text-left text-[#0f1c3f]'>
        <p className='text-[15px] leading-tight font-semibold max-w-[210px]'>
          Expert subjective
          <br />
          history taking
        </p>

        <div className='relative mt-4 w-[230px]'>
          {/* 라인 */}
          <div className='h-px w-full bg-[#9ec5ff] opacity-80' />
          {/* 점: 라인 오른쪽 끝, orbit 쪽 */}
          <div className='absolute right-0 top-1/2 -translate-y-1/2'>
            <div className='w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.7)]' />
          </div>
        </div>
      </div>

      {/* 위-오른쪽: 꺾이는 라인 + 점(orbit 쪽) */}
      <div className='absolute top-[24%] right-[7%] text-right text-[#0f1c3f]'>
        {/* TODO: 미구현 */}
      </div>

      {/* 아래-왼쪽: 꺾이는 라인 + 점(orbit 쪽) */}
      <div className='absolute bottom-[37%] left-[28%] text-left text-[#0f1c3f]'>
        <p className='text-[15px] leading-tight font-semibold max-w-[220px]'>
          Preconstructed
          <br />
          clinical note
        </p>

        <div className='mt-4 flex items-center'>
          {/* 수평 라인 (텍스트 바로 아래에서 시작) */}
          <div className='h-px w-[190px] bg-[#9ec5ff] opacity-80' />

          {/* 꺾여서 올라가는 대각선 + 점 */}
          <div className='relative h-px w-[100px] bg-[#9ec5ff] opacity-80 origin-left -rotate-[28deg]'>
            {/* 점: 대각선 끝, orbit 쪽 */}
            <div className='absolute right-0 top-1/2 -translate-y-1/2'>
              <div className='w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.7)]' />
            </div>
          </div>
        </div>
      </div>

      {/* 아래-오른쪽: 직선 + 점(orbit 쪽) */}
      <div className='absolute bottom-[17%] right-[7%] text-right text-[#0f1c3f]'>
        <p className='text-[15px] leading-tight font-semibold max-w-[250px] ml-auto'>
          Ambient AI scribing to
          <br />
          complete documentation
        </p>

        <div className='relative mt-4 w-[230px] ml-auto'>
          {/* 라인 (오른쪽 → 왼쪽) */}
          <div className='ml-auto h-px w-full bg-[#9ec5ff] opacity-80' />
          {/* 점: 왼쪽 끝, orbit 쪽 */}
          <div className='absolute left-0 top-1/2 -translate-y-1/2'>
            <div className='w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.7)]' />
          </div>
        </div>
      </div>
    </>
  )
}

export default OrbitFeatures
