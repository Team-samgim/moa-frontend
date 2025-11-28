// 작성자: 최이서

import { Link } from 'react-router-dom'
import logo from '@/assets/images/moa.webp'
import { userNavigations } from '@/constants/navigations'

const Footer = () => {
  return (
    <footer className='bg-white border-t border-gray-200 mt-10'>
      <div className='mx-30 4xl:mx-60 px-6 lg:px-8 py-12 4xl:py-16'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12'>
          {/* 로고 및 회사 정보 */}
          <div className='lg:col-span-1'>
            <Link to='/' className='inline-block mb-4'>
              <img src={logo} alt='MOA logo' className='h-10 4xl:h-20 object-contain' />
            </Link>
            <p className='text-sm 4xl:text-base text-gray-600 mb-3'>Monitoring & Analysis</p>
            <p className='text-xs 4xl:text-sm text-gray-500 leading-relaxed'>
              복잡한 데이터 분석을 쉽게,
              <br />
              EUM 데이터 분석 시스템 모아
            </p>
          </div>

          {/* 서비스 메뉴 */}
          <div>
            <h3 className='text-sm 4xl:text-base font-semibold text-gray-800 mb-4'>서비스</h3>
            <ul className='space-y-2.5'>
              <li>
                <Link
                  to={userNavigations.DASHBOARD}
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  대시보드
                </Link>
              </li>
              <li>
                <Link
                  to={userNavigations.SEARCH}
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  검색
                </Link>
              </li>
              <li>
                <Link
                  to={userNavigations.PIVOT}
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  피벗 테이블
                </Link>
              </li>
            </ul>
          </div>

          {/* 지원센터 */}
          <div>
            <h3 className='text-sm 4xl:text-base font-semibold text-gray-800 mb-4'>지원센터</h3>
            <ul className='space-y-2.5'>
              <li>
                <a
                  href='#'
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  사용자 가이드
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  APIs
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href='#'
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  공지/뉴스
                </a>
              </li>
            </ul>
          </div>

          {/* 고객센터 */}
          <div>
            <h3 className='text-sm 4xl:text-base font-semibold text-gray-800 mb-4'>고객센터</h3>
            <ul className='space-y-2.5'>
              <li>
                <a
                  href='#'
                  className='text-sm 4xl:text-base text-gray-600 hover:text-[#3f72af] transition-colors'
                >
                  문의
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 저작권 정보 */}
        <div className='mt-12 pt-8 border-t border-gray-200'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <p className='text-xs 4xl:text-sm text-gray-500'>© MOA INC. All Rights Reserved.</p>
            <div className='flex gap-6'>
              <a
                href='#'
                className='text-xs 4xl:text-sm text-gray-600 hover:text-[#3f72af] transition-colors'
              >
                소개
              </a>
              <a
                href='#'
                className='text-xs 4xl:text-sm text-gray-600 hover:text-[#3f72af] transition-colors'
              >
                이용약관
              </a>
              <a
                href='#'
                className='text-xs 4xl:text-sm text-gray-600 hover:text-[#3f72af] transition-colors'
              >
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
