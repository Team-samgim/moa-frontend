/**
 * ValueList
 *
 * 체크박스 모드에서 값 목록을 렌더링하는 컴포넌트.
 * 서버에서 받아온 values 배열을 기반으로 스크롤 + "더 보기" 버튼을 통해 무한 로딩을 지원한다.
 *
 * 기능:
 * - 스크롤 시 onScroll 호출 → 하단 근접 시 loadMore 트리거
 * - selected.includes(val)을 기반으로 체크박스 상태 관리
 * - error 발생 시 메시지 표시
 * - loading 상태 표시
 *
 * Props:
 * - values: 값 목록 배열
 * - selected: 선택된 값 배열
 * - toggle: 값 선택/해제 함수
 * - onScroll: 스크롤 이벤트 핸들러
 * - loading: 데이터 로딩 여부
 * - hasMore: 추가 데이터 로딩 가능 여부
 * - loadMore: 값 목록 추가 요청 함수
 * - error: 오류 메시지
 *
 * AUTHOR: 방대혁
 */
const ValueList = ({ values, selected, toggle, onScroll, loading, hasMore, loadMore, error }) => {
  return (
    <div
      onScroll={onScroll}
      className='mt-1 max-h-[200px] overflow-y-auto border-y border-gray-100 py-1'
    >
      {/* 오류 메시지 */}
      {error && <div className='py-2 text-center text-[12px] text-red-500'>{error}</div>}

      {/* 값 목록 렌더링 */}
      {!error &&
        values.map((val, i) => (
          <label
            key={`${val ?? 'null'}__${i}`} // 값이 null일 수도 있어 키 생성 시 대비
            className='block cursor-pointer px-1.5 py-0.5 text-[12px]'
          >
            {/* 선택 체크박스 */}
            <input
              type='checkbox'
              checked={selected.includes(val)}
              onChange={() => toggle(val)}
              className='mr-1.5'
            />
            {/* null 값 표시 보정 */}
            {val ?? '(NULL)'}
          </label>
        ))}

      {/* 로딩 중 표시 */}
      {loading && <div className='py-2 text-center text-[12px] text-gray-400'>불러오는 중…</div>}

      {/* 더 보기 버튼 */}
      {!loading && hasMore && (
        <button
          onClick={loadMore}
          className='my-1 w-full cursor-pointer rounded border border-gray-200 bg-gray-50 py-1 text-[12px]'
        >
          더 보기
        </button>
      )}
    </div>
  )
}

export default ValueList
