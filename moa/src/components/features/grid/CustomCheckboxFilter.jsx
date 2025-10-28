import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import axiosInstance from '@/api/axios'

const CustomCheckboxFilter = forwardRef((props, ref) => {
  const [uniqueValues, setUniqueValues] = useState([])
  const [selected, setSelected] = useState([])

  const layer = props?.filterParams?.layer || 'ethernet'
  const field = props.colDef.field

  /** 부모(activeFilters)에서 선택값 복원 */
  useEffect(() => {
    const activeValues = props.context?.activeFilters?.[field]?.values || []
    setSelected(Array.isArray(activeValues) ? activeValues : [])
  }, [props.context?.activeFilters, field])

  /** 최초 1회만 서버에서 필터 값 로드 (필터를 다시 열어도 재요청 X) */
  useEffect(() => {
    const fetchFilterValues = async () => {
      try {
        const params = {
          layer,
          field,
          // ✅ 현재 적용 중인 필터 전체 전달
          filterModel: props.context?.activeFilters
            ? JSON.stringify(
                Object.fromEntries(
                  Object.entries(props.context.activeFilters).filter(([k]) => k !== field),
                ),
              )
            : undefined,
        }

        const res = await axiosInstance.get('/filtering', { params })
        setUniqueValues(res.data.values || [])
      } catch (err) {
        console.error(`[${field}] 필터 값 로드 실패:`, err)
      }
    }

    fetchFilterValues()
  }, [layer, field, props.context?.activeFilters])

  /** 필터가 초기화될 때 체크박스 해제 */
  useEffect(() => {
    if (Object.keys(props.context?.activeFilters || {}).length === 0) {
      setSelected([])
    }
  }, [props.context?.activeFilters])

  /** agGrid 필터 API 연결 */
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

  /** 체크박스 클릭 시 */
  const onChange = (val) => {
    const updated = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    setSelected(updated)
    props.context?.updateFilter?.(field, updated)
  }

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto', padding: '5px' }}>
      {uniqueValues.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#888' }}>값 없음</div>
      ) : (
        uniqueValues.map((val) => (
          <label key={val} style={{ display: 'block', fontSize: '12px' }}>
            <input
              type='checkbox'
              checked={selected.includes(val)}
              onChange={() => onChange(val)}
            />
            {val}
          </label>
        ))
      )}
    </div>
  )
})

export default CustomCheckboxFilter
