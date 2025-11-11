import { useRef, useState } from 'react'

export default function useConditionState() {
  const [conditions, setConditions] = useState([
    { op: 'contains', values: [''], val: '', val1: '', val2: '' },
  ])
  const [logicOps, setLogicOps] = useState([])
  const inputRefs = useRef([])

  const buildFilterModelFromUI = () => {
    const latest = conditions.map((c, i) => {
      const ref = inputRefs.current[i] || {}
      const next = { op: c.op }
      if (c.op === 'between' && ref.val1 && ref.val2) {
        next.values = [ref.val1.value || '', ref.val2.value || '']
      } else {
        const v = ref.val?.value ?? (Array.isArray(c.values) ? c.values[0] : c.val) ?? ''
        next.values = [v]
      }
      return next
    })
    const hasCondition = latest.some((c) => ((c.values?.[0] ?? '') + '').trim() !== '')
    return { hasCondition, latest, logicOps, inputRefs }
  }

  return { conditions, logicOps, inputRefs, setConditions, setLogicOps, buildFilterModelFromUI }
}
