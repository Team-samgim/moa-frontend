// 작성자: 최이서
let savedScrollY = 0

/**
 * 스크롤 방지 + 현재 위치 반환
 * @returns {number} 현재 스크롤 위치
 */
export const preventScroll = () => {
  const currentScrollY = window.scrollY
  savedScrollY = currentScrollY

  // 스크롤바 너비 계산
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth

  if (scrollBarWidth > 0) {
    // 1) body 오른쪽 패딩 보정
    document.body.style.paddingRight = `${scrollBarWidth}px`
    // 2) CSS 변수 저장
    document.documentElement.style.setProperty('--scrollbar-comp', `${scrollBarWidth}px`)
  }

  document.body.style.overflow = 'hidden'

  return currentScrollY
}

/**
 * 스크롤 허용 + 필요하면 위치 복원
 */
export const allowScroll = (prevScrollY) => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.documentElement.style.removeProperty('--scrollbar-comp')

  const y = prevScrollY ?? savedScrollY
  window.scrollTo(0, y)
}
