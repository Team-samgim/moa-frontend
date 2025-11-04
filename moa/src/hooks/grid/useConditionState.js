import { useRef, useState } from 'react'

export default function useConditionState() {
  const [conditions, setConditions] = useState([{ op: 'contains', val: '', val1: '', val2: '' }])
  const [logicOps, setLogicOps] = useState([])
  const inputRefs = useRef([])

  const buildFilterModelFromUI = () => {
    const latest = conditions.map((c, i) => {
      const ref = inputRefs.current[i] || {}
      const next = { ...c }
      next.val = ref.val?.value ?? c.val ?? ''
      if (c.op === 'between' && ref.val1 && ref.val2)
        next.val = `${ref.val1.value || ''},${ref.val2.value || ''}`
      return next
    })
    const hasCondition = latest.some((c) => (c.val || '').trim() !== '')
    return { hasCondition, latest, logicOps, inputRefs }
  }

  return { conditions, logicOps, inputRefs, setConditions, setLogicOps, buildFilterModelFromUI }
}
