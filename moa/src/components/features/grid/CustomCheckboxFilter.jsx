import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import axiosInstance from '@/api/axios'

const CustomCheckboxFilter = forwardRef((props, ref) => {
  const [uniqueValues, setUniqueValues] = useState([])
  const [filteredValues, setFilteredValues] = useState([]) // 검색된 목록
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')

  const layer = props?.filterParams?.layer || 'ethernet'
  const field = props.colDef.field

  /** 부모(activeFilters)에서 선택값 복원 */
  useEffect(() => {
    const activeValues = props.context?.activeFilters?.[field]?.values || []
    setSelected(Array.isArray(activeValues) ? activeValues : [])
  }, [props.context?.activeFilters, field])

  /** 서버에서 필터 값 로드 */
  useEffect(() => {
    const fetchFilterValues = async () => {
      try {
        const params = {
          layer,
          field,
          filterModel: props.context?.activeFilters
            ? JSON.stringify(
                Object.fromEntries(
                  Object.entries(props.context.activeFilters).filter(([k]) => k !== field),
                ),
              )
            : undefined,
        }

        const res = await axiosInstance.get('/filtering', { params })
        const values = res.data.values || []
        setUniqueValues(values)
        setFilteredValues(values)
      } catch (err) {
        console.error(`[${field}] 필터 값 로드 실패:`, err)
      }
    }

    fetchFilterValues()
  }, [layer, field, props.context?.activeFilters])

  /** 필터 초기화 시 체크 해제 */
  useEffect(() => {
    if (Object.keys(props.context?.activeFilters || {}).length === 0) {
      setSelected([])
    }
  }, [props.context?.activeFilters])

  /** agGrid 필터 API */
  useImperativeHandle(ref, () => ({
    isFilterActive() {
      return selected.length > 0
    },
    doesFilterPass() {
      return true
    },
    getModel() {
      return { values: selected }
    },
    setModel(model) {
      if (model?.values) setSelected(model.values)
    },
  }))

  /** 검색 기능 */
  const handleSearch = (e) => {
    const keyword = e.target.value.toLowerCase()
    setSearch(keyword)
    const filtered = uniqueValues.filter((v) => v?.toString().toLowerCase().includes(keyword))
    setFilteredValues(filtered)
  }

  /** 체크박스 클릭 */
  const toggleValue = (val) => {
    const updated = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    setSelected(updated)
  }

  /** 필터 적용 */
  const applyFilter = () => {
    props.context?.updateFilter?.(field, selected)
  }

  /** 필터 초기화 */
  const clearFilter = () => {
    setSelected([])
    props.context?.updateFilter?.(field, [])
  }

  return (
    <div
      style={{
        width: 200,
        padding: '8px',
        fontSize: 13,
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        backgroundColor: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      }}
    >
      {/* 검색창 */}
      <input
        type='text'
        placeholder='검색...'
        value={search}
        onChange={handleSearch}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid #ccc',
          marginBottom: 8,
          fontSize: 12,
        }}
      />

      {/* 체크박스 리스트 */}
      <div
        style={{
          maxHeight: 180,
          overflowY: 'auto',
          borderTop: '1px solid #eee',
          borderBottom: '1px solid #eee',
          padding: '4px 0',
        }}
      >
        {filteredValues.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, padding: '8px 0' }}>
            결과 없음
          </div>
        ) : (
          filteredValues.map((val) => (
            <label
              key={val}
              style={{
                display: 'block',
                fontSize: '12px',
                padding: '2px 4px',
                cursor: 'pointer',
              }}
            >
              <input
                type='checkbox'
                checked={selected.includes(val)}
                onChange={() => toggleValue(val)}
                style={{ marginRight: 6 }}
              />
              {val}
            </label>
          ))
        )}
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={applyFilter}
          style={{
            flex: 1,
            background: '#3877BE',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 0',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          적용
        </button>
        <button
          onClick={clearFilter}
          style={{
            flex: 1,
            background: '#fff',
            color: '#3877BE',
            border: '1px solid #3877BE',
            borderRadius: 4,
            padding: '4px 0',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          초기화
        </button>
      </div>
    </div>
  )
})

export default CustomCheckboxFilter
