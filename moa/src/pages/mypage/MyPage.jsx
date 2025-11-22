import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import calculator from '@/assets/images/calculator.webp'
import files from '@/assets/images/files.webp'
import settings from '@/assets/images/settings.webp'

import { userNavigations } from '@/constants/navigations'
import { useMyProfile } from '@/hooks/queries/useMyPage'

const QuickCard = ({ title, desc, icon, onClick, iconBgColor, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <button
      type='button'
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className='group relative block h-full w-full text-left rounded-3xl p-0 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-white/90 backdrop-blur-sm border border-blue-100/50'
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay}s both`,
      }}
    >
      {/* 부드러운 배경 그라데이션 - 블루-화이트 톤 */}
      <div className='absolute inset-0 bg-linear-to-br from-blue-50/40 via-sky-50/20 to-white/95' />

      {/* 호버 시 빛나는 효과 - 더 은은하게 */}
      <div className='absolute inset-0 bg-linear-to-br from-blue-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

      {/* 컨텐츠 */}
      <div className='relative z-10 p-10 h-full flex flex-col justify-between'>
        <div>
          <div className='text-[23px] font-bold leading-9 tracking-tight text-[#2c5282] mb-4'>
            {title}
          </div>
          <div className='space-y-1'>
            {desc.split('\n').map((line, idx) => (
              <div key={idx} className='text-[17px] tracking-[-0.01em] text-[#4678b3]'>
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* 아이콘 영역 - 그라데이션 원형 배경과 함께 */}
        <div className='flex justify-end'>
          <div
            className='relative transform transition-all duration-500 ease-out'
            style={{
              transform: isHovered ? 'scale(1.05) rotate(-3deg)' : 'scale(1) rotate(0deg)',
            }}
          >
            {/* 그라데이션 원형 배경 - 더 부드럽게 */}
            <div
              className='absolute inset-0 rounded-full blur-md scale-110 transition-all duration-500'
              style={{
                background: iconBgColor,
                opacity: isHovered ? 0.6 : 0.9,
              }}
            />

            {/* 추가 글로우 효과 - 더 은은하게 */}
            <div
              className='absolute inset-0 rounded-full blur-2xl scale-125 transition-opacity duration-500'
              style={{
                background: iconBgColor,
                opacity: isHovered ? 0.3 : 0.15,
              }}
            />

            {/* 아이콘 - 크기 축소 */}
            <div className='relative'>
              <div className='[&_img]:h-27 [&_img]:w-27 [&_img]:drop-shadow-[0_2px_8px_rgba(34, 46, 86, 0.8)]'>
                {icon}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카드 테두리 하이라이트 */}
      <div className='absolute inset-0 rounded-3xl ring-1 ring-inset ring-blue-100/50 pointer-events-none' />
    </button>
  )
}

const StatBadge = ({ label, value, delay = 0 }) => (
  <div
    className='flex flex-col items-center px-6 py-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105'
    style={{
      animation: `fadeInUp 0.6s ease-out ${delay}s both`,
    }}
  >
    <div className='text-[28px] font-bold text-[#4A7EBB] leading-none'>{value}</div>
    <div className='text-[13px] text-[#6B8CAE] mt-1.5 font-medium'>{label}</div>
  </div>
)

const MyPage = () => {
  const { data: me } = useMyProfile()
  const nickname = me?.nickname ?? 'Username'
  const email = me?.email ?? 'abc@abc.com'
  const navigate = useNavigate()

  const scrollTo = (id) => {
    const el = document.querySelector(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className='w-full flex justify-center mt-5 pb-50'>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className='w-8xl px-5 pt-8'>
        {/* 헤더 섹션 - hero-gradient-bg 스타일 적용 */}
        <section
          className='mx-auto w-7xl rounded-3xl px-10 py-10 shadow-xl relative overflow-hidden'
          style={{
            animation: 'fadeInUp 0.6s ease-out',
            backgroundImage: `
              radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.85), transparent 60%),
              radial-gradient(circle at 80% 18%, rgba(191, 219, 254, 0.9), transparent 60%),
              radial-gradient(circle at 15% 85%, rgba(191, 219, 254, 0.9), transparent 60%),
              radial-gradient(circle at 85% 82%, rgba(129, 199, 255, 0.8), transparent 60%),
              linear-gradient(135deg, #e7f2ff, #9fc3ff)
            `,
            backgroundSize: `
              120% 120%,
              120% 120%,
              120% 120%,
              120% 120%,
              100% 100%
            `,
            backgroundPosition: `
              0% 0%,
              100% 0%,
              0% 100%,
              100% 100%,
              50% 50%
            `,
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* SVG 패턴만 유지 (움직이는 점들 제거) */}
          <div className='absolute inset-0 opacity-[0.08]'>
            <div className='absolute top-[-10%] right-[-5%] w-[600px]'>
              <svg viewBox='0 0 200 200' className='w-full h-full'>
                <defs>
                  <pattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'>
                    <path d='M 20 0 L 0 0 0 20' fill='none' stroke='white' strokeWidth='0.5' />
                  </pattern>
                </defs>
                <circle cx='100' cy='100' r='90' fill='url(#grid)' opacity='0.3' />
                <circle
                  cx='100'
                  cy='100'
                  r='70'
                  fill='none'
                  stroke='white'
                  strokeWidth='0.5'
                  opacity='0.5'
                />
                <circle
                  cx='100'
                  cy='100'
                  r='50'
                  fill='none'
                  stroke='white'
                  strokeWidth='0.5'
                  opacity='0.5'
                />
              </svg>
            </div>
          </div>

          <div className='relative z-10 flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-5 mb-4'>
                <div className='w-18 h-18 rounded-full bg-linear-to-br from-white to-[#D0E4F7] flex items-center justify-center text-3xl font-bold text-[#4A7EBB] shadow-lg'>
                  {nickname.charAt(0).toUpperCase()}
                </div>
                <div className='flex flex-col justify-center'>
                  <h1 className='text-[26px] font-bold tracking-tight text-[#1e3a5f]'>
                    안녕하세요, <span className='text-blue'>{nickname}</span>님
                  </h1>
                  <p className='text-[16px] text-[#4A7EBB]'>{email}</p>
                </div>
              </div>
              <p className='text-[18px] ml-2 mt-6 text-[#2c5282]'>
                마이페이지에서 정보를 관리하고, 프리셋과 문서를 손쉽게 확인하세요.
              </p>
            </div>

            {/* 통계 배지들 */}
            <div className='flex gap-6'>
              <StatBadge label='저장된 프리셋' value='12' delay={0.2} />
              <StatBadge label='생성한 문서' value='34' delay={0.3} />
              <StatBadge label='즐겨찾는 프리셋' value='5' delay={0.4} />
            </div>
          </div>
        </section>

        {/* 퀵 액션 카드들 */}
        <section className='mt-13 w-full'>
          <div className='mx-auto w-7xl grid grid-cols-3 gap-6 items-stretch'>
            <QuickCard
              title='프로필 수정'
              desc={'이메일 변경\n비밀번호 변경'}
              icon={<img src={settings} alt='프로필' />}
              onClick={() => scrollTo('#profile')}
              iconBgColor='linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)'
              delay={0.5}
            />
            <QuickCard
              title='프리셋'
              desc={'검색 프리셋\n피벗 프리셋'}
              icon={<img src={calculator} alt='프리셋' />}
              onClick={() => navigate(userNavigations.PRESET)}
              iconBgColor='linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
              delay={0.6}
            />
            <QuickCard
              title='문서'
              desc={'그리드 CSV\n피벗 CSV\n차트 이미지'}
              icon={<img src={files} alt='문서' />}
              onClick={() => navigate(userNavigations.FILE_MANAGEMENT)}
              iconBgColor='linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)'
              delay={0.7}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default MyPage
