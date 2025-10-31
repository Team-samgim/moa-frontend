import { useMemo, useState, useEffect } from 'react'

/** 내부 모달 (조회 필드 전용) */
const FieldPickerModal = ({
  open,
  fields,
  selectedSet,
  query,
  onQuery,
  onToggleKey,
  onToggleAll,
  onApply,
  onClose,
}) => {
  if (!open) return null
  const shown = (() => {
    const q = query.trim().toLowerCase()
    if (!q) return fields
    return fields.filter((f) => f.key.toLowerCase().includes(q))
  })()
  const allShownSelected = shown.length > 0 && shown.every((f) => selectedSet.has(f.key))

  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[85vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between px-5 py-4 border-b'>
          <h3 className='text-base font-semibold'>필드 선택</h3>
          <button className='text-gray-500 hover:text-gray-700' onClick={onClose}>
            ✕
          </button>
        </div>

        <div className='px-5 py-4 space-y-4 flex-1 overflow-hidden'>
          {/* 현재 선택 칩 미리보기 */}
          <div className='flex flex-wrap items-center gap-2 max-h-28 overflow-auto pr-1'>
            {selectedSet.size === 0 ? (
              <span className='text-sm text-gray-400'>선택된 필드가 없습니다.</span>
            ) : (
              Array.from(selectedSet).map((k) => (
                <span
                  key={k}
                  className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm'
                >
                  {k}
                  <button
                    className='ml-1 text-gray-400 hover:text-gray-600'
                    onClick={() => onToggleKey(k)}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          {/* 검색 + 전체선택 */}
          <div className='flex items-center gap-3'>
            <input
              className='flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200'
              placeholder='필드 검색'
              value={query}
              onChange={(e) => onQuery(e.target.value)}
            />
            <label className='inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none'>
              <input type='checkbox' checked={allShownSelected} onChange={onToggleAll} />
              전체 선택
            </label>
          </div>

          {/* 리스트 */}
          <div className='max-h-[420px] overflow-auto rounded-lg border border-gray-200'>
            {shown.map((f) => (
              <label
                key={f.key}
                className='flex items-center gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50'
              >
                <input
                  type='checkbox'
                  checked={selectedSet.has(f.key)}
                  onChange={() => onToggleKey(f.key)}
                />
                <span className='text-sm'>{f.key}</span>
              </label>
            ))}
            {shown.length === 0 && (
              <div className='p-6 text-center text-sm text-gray-400'>검색 결과가 없습니다.</div>
            )}
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 px-5 py-4 border-t'>
          <button
            className='px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm'
            onClick={onClose}
          >
            취소
          </button>
          <button
            className='px-4 py-2 rounded-xl text-white bg-[#3877BE] hover:bg-blue-700 border border-[#3877BE] text-sm'
            onClick={onApply}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}

/** 상단 ‘조회 필드 선택’ 바 + 모달 (조건과 완전 독립) */
const FieldPicker = ({ fields = [], selected = [], onChange }) => {
  // selected: string[] | Set<string>

  const selectedList = useMemo(
    () => (Array.isArray(selected) ? selected.slice() : Array.from(selected || [])),
    [selected],
  )

  const [chipList, setChipList] = useState(() => selectedList)
  const [chipSet, setChipSet] = useState(() => new Set(selectedList))
  useEffect(() => {
    // 외부 selected 변경 시 동기화 (순서 포함)
    setChipList(selectedList)
    setChipSet(new Set(selectedList))
  }, [selectedList])

  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [pickerSet, setPickerSet] = useState(new Set())

  const openPicker = () => {
    setPickerSet(new Set([...chipSet]))
    setPickerQuery('')
    setPickerOpen(true)
  }
  const closePicker = () => setPickerOpen(false)

  const toggleChip = (key) => {
    if (chipSet.has(key)) {
      const nextList = chipList.filter((k) => k !== key)
      setChipList(nextList)
      const nextSet = new Set(nextList)
      setChipSet(nextSet)
      onChange && onChange(nextList)
    } else {
      const nextList = [...chipList, key]
      setChipList(nextList)
      const nextSet = new Set(nextList)
      setChipSet(nextSet)
      onChange && onChange(nextList)
    }
  }

  const togglePickerKey = (key) =>
    setPickerSet((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const pickerFiltered = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    if (!q) return fields
    return fields.filter((f) => f.key.toLowerCase().includes(q))
  }, [fields, pickerQuery])

  const toggleAllInPicker = () => {
    const shownKeys = new Set(pickerFiltered.map((f) => f.key))
    const allSelected = [...shownKeys].every((k) => pickerSet.has(k))
    setPickerSet((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        ;[...shownKeys].forEach((k) => next.delete(k))
      } else {
        ;[...shownKeys].forEach((k) => next.add(k))
      }
      return next
    })
  }

  const applyPicker = () => {
    const inSet = (k) => pickerSet.has(k)
    const kept = chipList.filter(inSet)
    const added = Array.from(pickerSet).filter((k) => !chipSet.has(k))
    const nextList = [...kept, ...added]
    setChipList(nextList)
    setChipSet(new Set(nextList))
    onChange && onChange(nextList)
    setPickerOpen(false)
  }

  return (
    <>
      <div className='border border-gray-200 rounded-2xl px-4 py-3 bg-white flex items-start gap-4'>
        {/* 1) 라벨 영역 */}
        <div className='shrink-0 pt-1'>
          <span className='text-base font-medium'>조회 필드 선택</span>
        </div>

        {/* 2) 칩(선택된 태그) 영역 */}
        <div className='flex-1 min-w-0'>
          {chipList.length === 0 ? (
            <span className='text-sm text-gray-400'>선택된 필드가 없습니다.</span>
          ) : (
            <div className='flex flex-wrap items-center gap-2 pr-1'>
              {chipList.map((k, idx) => (
                <span
                  key={k}
                  data-index={idx}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', String(idx))
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from = Number(e.dataTransfer.getData('text/plain'))
                    const to = Number(e.currentTarget.dataset.index || 0)
                    if (Number.isNaN(from) || Number.isNaN(to) || from === to) return
                    const next = chipList.slice()
                    const [moved] = next.splice(from, 1)
                    next.splice(to, 0, moved)
                    setChipList(next)
                    setChipSet(new Set(next))
                    onChange && onChange(next)
                  }}
                  className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm cursor-move'
                >
                  {k}
                  <button
                    className='ml-1 text-gray-400 hover:text-gray-600'
                    onClick={() => toggleChip(k)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3) 버튼 영역 */}
        <div className='shrink-0 self-center'>
          <button
            type='button'
            className='px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm'
            onClick={openPicker}
          >
            필드 선택
          </button>
        </div>
      </div>

      <FieldPickerModal
        open={pickerOpen}
        fields={fields}
        selectedSet={pickerSet}
        query={pickerQuery}
        onQuery={setPickerQuery}
        onToggleKey={togglePickerKey}
        onToggleAll={toggleAllInPicker}
        onApply={applyPicker}
        onClose={closePicker}
      />
    </>
  )
}

export default FieldPicker
