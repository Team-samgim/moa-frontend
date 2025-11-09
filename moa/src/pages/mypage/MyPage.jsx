import { useNavigate } from 'react-router-dom'
import calculatorIcon from '@/assets/icons/calculator.svg'
import file from '@/assets/icons/file.svg'
import profile from '@/assets/icons/profile-edit.svg'
import { userNavigations } from '@/constants/navigations'
import { useMyProfile } from '@/hooks/queries/useMyPage'

const QuickCard = ({ title, desc, icon, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className={[
      'group relative block h-full w-full text-left',
      'rounded-[16px] border border-[#E3EDFF] bg-[#F3F7FD]',
      'p-0 shadow-[0_6px_8px_rgba(0,103,255,0.06),0_10px_16px_rgba(0,103,255,0.08)]',
      'transition-transform hover:-translate-y-0.5 overflow-hidden',
      'cursor-pointer',
    ].join(' ')}
  >
    <div className='absolute top-4 left-4 right-[96px] m-3'>
      <div className='text-[24px] font-semibold leading-[30px] tracking-wide'>{title}</div>
      <div className='mt-2 text-[14px] leading-[22px] tracking-[0.02em] text-gray-600 whitespace-pre-line'>
        {desc}
      </div>
    </div>

    <div
      className='pointer-events-none absolute bottom-4 right-4
                 [&_img]:h-[100px] [&_img]:w-[100px] [&_img]:opacity-95
                 [&_img]:drop-shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
    >
      {icon}
    </div>

    <div
      aria-hidden={true}
      className='pointer-events-none absolute -bottom-2 right-1 h-16 w-28 rounded-full bg-white/40 blur-2xl'
    />
  </button>
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
    <div className='w-full flex justify-center'>
      <div className='w-[1280px] min-h-[834px] px-0 py-6'>
        <section className='mx-auto w-[1080px] h-[240px] rounded-[20px] border border-gray-200 bg-white p-8 shadow-sm flex flex-col justify-center'>
          <div className='flex flex-col gap-2.5'>
            <h1 className='text-[30px] font-bold leading-[38px] tracking-[-0.3px]'>
              안녕하세요, <span className='text-blue-600'>{nickname}</span>님
            </h1>
            <p className='text-[20px] leading-[30px] tracking-[-0.2px] text-gray-500'>{email}</p>
            <p className='text-[20px] leading-[30px] tracking-[-0.15px] text-gray-600 mt-5'>
              마이페이지에서 {nickname}님만의 공간을 확인해보아요.
            </p>
          </div>
        </section>

        <section className='mt-6 w-full'>
          <div className='mx-auto w-[1080px] h-[191px] grid grid-cols-3 gap-[24px] items-stretch'>
            {/* 프로필은 스크롤 이동 유지 */}
            <QuickCard
              title='프로필 수정'
              desc={'이메일 변경\n비밀번호 변경'}
              icon={<img src={profile} alt='프로필' />}
              onClick={() => scrollTo('#profile')}
            />

            {/* ✅ 프리셋 → 프리셋 페이지로 이동 */}
            <QuickCard
              title='프리셋'
              desc={'검색 프리셋\n피벗 프리셋'}
              icon={<img src={calculatorIcon} alt='프리셋' />}
              onClick={() => navigate(userNavigations.PRESET)}
            />

            {/* ✅ 문서 → 파일 관리 페이지로 이동 */}
            <QuickCard
              title='문서'
              desc={'그리드 CSV\n피벗 CSV\n차트 이미지'}
              icon={<img src={file} alt='문서' />}
              onClick={() => navigate(userNavigations.FILE_MANAGEMENT)}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

export default MyPage
