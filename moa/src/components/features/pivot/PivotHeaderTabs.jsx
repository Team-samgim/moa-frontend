import { Link, useLocation } from 'react-router-dom'
import { userNavigations } from '@/constants/navigations'

const TabButton = ({ to, active, children }) => {
  return (
    <Link
      to={to}
      className={[
        'rounded-full px-4 py-2 text-sm font-medium border',
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
      ].join(' ')}
    >
      {children}
    </Link>
  )
}

const PivotHeaderTabs = () => {
  const { pathname } = useLocation()

  return (
    <div className='flex items-center gap-2'>
      <TabButton to={userNavigations.SEARCH} active={pathname.startsWith('/search')}>
        검색
      </TabButton>
      <TabButton to={userNavigations.PivotHeaderTabs} active={pathname.startsWith('/pivot')}>
        피벗 테이블
      </TabButton>
    </div>
  )
}

export default PivotHeaderTabs
