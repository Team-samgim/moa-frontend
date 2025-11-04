const ValueList = ({ values, selected, toggle, onScroll, loading, hasMore, loadMore, error }) => {
  return (
    <div
      onScroll={onScroll}
      className='mt-1 max-h-[200px] overflow-y-auto border-y border-gray-100 py-1'
    >
      {error && <div className='py-2 text-center text-[12px] text-red-500'>{error}</div>}
      {!error &&
        values.map((val, i) => (
          <label
            key={`${val ?? 'null'}__${i}`}
            className='block cursor-pointer px-1.5 py-0.5 text-[12px]'
          >
            <input
              type='checkbox'
              checked={selected.includes(val)}
              onChange={() => toggle(val)}
              className='mr-1.5'
            />
            {val ?? '(NULL)'}
          </label>
        ))}
      {loading && <div className='py-2 text-center text-[12px] text-gray-400'>불러오는 중…</div>}
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
