import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react'

const CustomCheckboxFilter = forwardRef((props, ref) => {
  const [uniqueValues, setUniqueValues] = useState([])
  const [selected, setSelected] = useState([])

  const layer = props?.filterParams?.layer || 'ethernet'
  const token = localStorage.getItem('accessToken')
  const field = props.colDef.field

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

  useEffect(() => {
    fetch(`http://localhost:8080/api/filtering?layer=${layer}&field=${field}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUniqueValues(data.values || []))
      .catch((err) => console.error('필터 값 로드 실패:', err))
  }, [layer, field, token])

  const onChange = (val) => {
    let updated
    if (selected.includes(val)) {
      updated = selected.filter((v) => v !== val)
    } else {
      updated = [...selected, val]
    }
    setSelected(updated)

    // Grid context 통해 전달
    if (props.context?.updateFilter) {
      props.context.updateFilter(field, updated)
    }
  }

  return (
    <div style={{ maxHeight: 200, overflowY: 'auto', padding: '5px' }}>
      {uniqueValues.map((val) => (
        <label key={val} style={{ display: 'block', fontSize: '12px' }}>
          <input type='checkbox' checked={selected.includes(val)} onChange={() => onChange(val)} />
          {val}
        </label>
      ))}
    </div>
  )
})

export default CustomCheckboxFilter
