// 작성자: 최이서
// 피벗 테이블 헤더와 검색 화면으로 돌아가기 버튼을 포함하는 컴포넌트

import { Link } from 'react-router-dom'
import GoBackIcon from '@/assets/icons/go-back.svg?react'
import { userNavigations } from '@/constants/navigations'

const BackButton = () => {
  return (
    <Link
      to={userNavigations.SEARCH}
      className='
        flex items-center gap-3 rounded-full px-3 py-1.5 justify-between
        font-medium text-gray-700 text-[13px]
        relative overflow-hidden
        transition-all
        hover:scale-[1.02]
        active:scale-[0.98]
        shadow-[0_0_4px_3px_rgba(255,242,175,0.7)]
        bg-[#fcf0ad]
      '
    >
      <div
        className='
          flex items-center justify-center w-5.5 h-5.5 rounded-full
          bg-[#fff8e6] shadow-[0_0_10px_0_#ECD767]
        '
      >
        <GoBackIcon className='w-3.5 h-3.5 text-gray-700' />
      </div>
      <span>검색으로 돌아가기</span>
    </Link>
  )
}

const PivotHeaderTabs = ({ pivotMode }) => {
  return (
    <div className='flex items-center justify-between gap-5 px-3'>
      <h2 className='text-[20px] font-semibold text-gray-900'>피벗 테이블</h2>
      {pivotMode === 'fromGrid' && <BackButton />}
    </div>
  )
}

export default PivotHeaderTabs
