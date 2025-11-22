import { useMemo, useState, useEffect } from 'react'
import { LAYER_ACTIVE_STYLES } from '@/constants/colors'

/** 공통: 잠금 아닌 필드 칩에 적용할 색 (레이어별) */
const getUnlockedFieldChipClass = (layerKey) => {
  const layerStyle =
    (layerKey && LAYER_ACTIVE_STYLES[layerKey]) ||
    'bg-[#EAF1F9] text-gray-700 border border-[#D1D1D6]'

  // 레이어 색 + 칩용 기본 폰트
  return `${layerStyle} font-medium`
}

/** 내부 모달 (조회 필드 전용) */
const FieldPickerModal = ({
  open,
  fields,
  selectedSet,
  lockedKeys,
  query,
  onQuery,
  onToggleKey,
  onToggleAll,
  onApply,
  onClose,
  layerKey, // 🔹 레이어 키 추가
}) => {
  if (!open) return null
  const shown = (() => {
    const q = query.trim().toLowerCase()
    if (!q) return fields
    return fields.filter(
      (f) => f.key.toLowerCase().includes(q) || f.labelKo?.toLowerCase().includes(q),
    )
  })()
  const allShownSelected = shown.length > 0 && shown.every((f) => selectedSet.has(f.key))

  return (
    <div className='fixed inset-0 z-50'>
      <div className='absolute inset-0 bg-black/30' onClick={onClose} />
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[85vh] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between px-5 py-4 border-b'>
          <h3 className='text-base 4xl:text-lg font-semibold'>필드 선택</h3>
          <button className='text-gray-500 hover:text-gray-700' onClick={onClose}>
            ✕
          </button>
        </div>

        <div className='px-5 py-4 space-y-4 flex-1 overflow-hidden'>
          {/* 현재 선택 칩 미리보기 */}
          <div className='flex flex-wrap items-center gap-2 4xl:gap-2.5 max-h-28 overflow-auto pr-1'>
            {selectedSet.size === 0 ? (
              <span className='text-sm 4xl:text-base text-gray-400'>선택된 필드가 없습니다.</span>
            ) : (
              Array.from(selectedSet).map((k) => {
                const isLocked = lockedKeys.has(k)
                return (
                  <span
                    key={k}
                    className={[
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 4xl:px-3.5 4xl:py-1.5 text-sm 4xl:text-base',
                      isLocked
                        ? 'bg-gray-100 text-gray-500 cursor-default'
                        : getUnlockedFieldChipClass(layerKey),
                    ].join(' ')}
                  >
                    {k}
                    {!isLocked && (
                      <button
                        className='ml-1 text-gray-400 hover:text-gray-600'
                        onClick={() => onToggleKey(k)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                )
              })
            )}
          </div>

          {/* 검색 + 전체선택 */}
          <div className='flex items-center gap-3'>
            <input
              className='flex-1 rounded-lg border border-gray-300 px-3 py-2 4xl:px-4 4xl:py-2.5 text-sm 4xl:text-base outline-none focus:ring-2 focus:ring-blue-200'
              placeholder='필드 검색 (한글명/영문명)'
              value={query}
              onChange={(e) => onQuery(e.target.value)}
            />
            <label className='inline-flex items-center gap-2 text-sm 4xl:text-base text-gray-600 cursor-pointer select-none'>
              <input type='checkbox' checked={allShownSelected} onChange={onToggleAll} />
              전체 선택
            </label>
          </div>

          {/* 리스트 */}
          <div className='max-h-[420px] overflow-auto rounded-lg border border-gray-200'>
            {shown.map((f) => {
              const isLocked = lockedKeys.has(f.key)
              const isSelected = selectedSet.has(f.key)

              return (
                <label
                  key={f.key}
                  className={[
                    'flex items-center gap-3 px-4 py-3 4xl:px-5 4xl:py-3.5 border-b last:border-b-0',
                    isLocked ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-gray-50',
                  ].join(' ')}
                >
                  <input
                    type='checkbox'
                    checked={isSelected}
                    disabled={isLocked}
                    onChange={() => !isLocked && onToggleKey(f.key)}
                    className={isLocked ? 'cursor-not-allowed' : ''}
                  />
                  <div className='flex-1 flex items-center justify-between'>
                    <span className='text-sm 4xl:text-base'>{f.labelKo || f.key}</span>
                    {isLocked && (
                      <span className='text-xs 4xl:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
                        필수
                      </span>
                    )}
                  </div>
                </label>
              )
            })}
            {shown.length === 0 && (
              <div className='p-6 text-center text-sm 4xl:text-base text-gray-400'>
                검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center justify-end gap-2 px-5 py-4 border-t '>
          <button
            className='px-4 py-2 4xl:px-5 4xl:py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm 4xl:text-base'
            onClick={onClose}
          >
            취소
          </button>
          <button
            className='px-4 py-2 4xl:px-5 4xl:py-2.5 rounded-xl text-white bg-[#3877BE] hover:bg-blue-700 border border-[#3877BE] text-sm 4xl:text-base'
            onClick={onApply}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}

/** 상단 '조회 필드 선택' 바 + 모달 (조건과 완전 독립) */
const FieldPicker = ({ fields = [], selected = [], onChange, layerKey }) => {
  // fields: { key: string, labelKo: string, isInfo: boolean, ... }[]
  // selected: string[] | Set<string>

  // isInfo가 true인 필드들 추출 (잠금 대상)
  const lockedKeys = useMemo(() => {
    return new Set(fields.filter((f) => f.isInfo).map((f) => f.key))
  }, [fields])

  const selectedList = useMemo(
    () => (Array.isArray(selected) ? selected.slice() : Array.from(selected || [])),
    [selected],
  )

  // 초기화: isInfo=true 필드들을 자동으로 선택 상태로 추가
  const [chipList, setChipList] = useState(() => {
    const locked = Array.from(lockedKeys)
    const userSelected = selectedList.filter((k) => !lockedKeys.has(k))
    return [...locked, ...userSelected]
  })
  const [chipSet, setChipSet] = useState(() => new Set(chipList))

  useEffect(() => {
    // 외부 selected 변경 시 동기화 (잠금 필드는 항상 유지)
    const locked = Array.from(lockedKeys)
    const userSelected = selectedList.filter((k) => !lockedKeys.has(k))
    const merged = [...locked, ...userSelected]
    setChipList(merged)
    setChipSet(new Set(merged))
  }, [selectedList, lockedKeys])

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
    // 잠금 필드는 삭제 불가
    if (lockedKeys.has(key)) return

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

  const togglePickerKey = (key) => {
    // 잠금 필드는 토글 불가
    if (lockedKeys.has(key)) return

    setPickerSet((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const pickerFiltered = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    if (!q) return fields
    return fields.filter(
      (f) => f.key.toLowerCase().includes(q) || f.labelKo?.toLowerCase().includes(q),
    )
  }, [fields, pickerQuery])

  const toggleAllInPicker = () => {
    const shownKeys = new Set(pickerFiltered.map((f) => f.key))
    // 잠금 필드 제외하고 전체 선택/해제
    const unlockableKeys = [...shownKeys].filter((k) => !lockedKeys.has(k))
    const allSelected = unlockableKeys.every((k) => pickerSet.has(k))

    setPickerSet((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        unlockableKeys.forEach((k) => next.delete(k))
      } else {
        unlockableKeys.forEach((k) => next.add(k))
      }
      return next
    })
  }

  const applyPicker = () => {
    // 잠금 필드는 항상 포함
    const locked = Array.from(lockedKeys)
    const inSet = (k) => pickerSet.has(k)
    const kept = chipList.filter((k) => !lockedKeys.has(k) && inSet(k))
    const added = Array.from(pickerSet).filter((k) => !chipSet.has(k) && !lockedKeys.has(k))
    const nextList = [...locked, ...kept, ...added]
    setChipList(nextList)
    setChipSet(new Set(nextList))
    onChange && onChange(nextList)
    setPickerOpen(false)
  }

  return (
    <>
      <div className='flex flex-col gap-2'>
        {/* 1) 라벨 영역 */}
        <div className='flex justify-between'>
          <span className='text-sm 4xl:text-base font-medium'>조회 필드 선택</span>
          <div className='shrink-0 self-center'>
            <button
              type='button'
              className='px-3.5 py-1.5 4xl:px-4 4xl:py-2 rounded 4xl:rounded-lg border border-gray-300 hover:bg-gray-50 text-xs 4xl:text-sm'
              onClick={openPicker}
            >
              필드 선택
            </button>
          </div>
        </div>

        {/* 2) 칩(선택된 태그) 영역 */}
        <div className='flex-1 min-w-0'>
          {chipList.length === 0 ? (
            <span className='text-sm 4xl:text-base text-gray-400'>선택된 필드가 없습니다.</span>
          ) : (
            <div className='flex flex-wrap items-center gap-2.5 4xl:gap-3 pr-1'>
              {chipList.map((k, idx) => {
                const isLocked = lockedKeys.has(k)
                return (
                  <span
                    key={k}
                    data-index={idx}
                    draggable={!isLocked}
                    onDragStart={(e) => {
                      if (isLocked) {
                        e.preventDefault()
                        return
                      }
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
                    className={[
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 4xl:px-3.5 4xl:py-1.5 text-sm 4xl:text-base',
                      isLocked
                        ? 'bg-gray-100 text-gray-500 cursor-default'
                        : `${getUnlockedFieldChipClass(layerKey)} cursor-move`,
                    ].join(' ')}
                  >
                    {k}
                    {!isLocked && (
                      <button
                        className='ml-1 text-gray-400 hover:text-gray-600'
                        onClick={() => toggleChip(k)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <FieldPickerModal
        open={pickerOpen}
        fields={fields}
        selectedSet={pickerSet}
        lockedKeys={lockedKeys}
        query={pickerQuery}
        onQuery={setPickerQuery}
        onToggleKey={togglePickerKey}
        onToggleAll={toggleAllInPicker}
        onApply={applyPicker}
        onClose={closePicker}
        layerKey={layerKey} // 🔹 모달에도 전달
      />
    </>
  )
}

export default FieldPicker
