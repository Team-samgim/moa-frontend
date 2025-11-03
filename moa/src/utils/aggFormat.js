// utils/aggFormat.js
export const cut = (s, max = 18) => {
  const t = String(s ?? '')
  return t.length > max ? t.slice(0, max) + '…' : t
}

const fmtNum = (n) => (n === null || n === undefined ? '-' : Number(n).toLocaleString())

// top 결과를 안전하게 파싱 (top1/top2/top3 또는 top=[{value,count},...])
const readTop = (agg, k = 3) => {
  const arr = []
  if (Array.isArray(agg?.top)) {
    for (let i = 0; i < Math.min(k, agg.top.length); i++) {
      const it = agg.top[i]
      arr.push(
        it && it.value !== undefined && it.value !== null
          ? { value: it.value, count: it.count ?? null }
          : null,
      )
    }
  } else {
    for (let i = 1; i <= k; i++) {
      const t = agg?.[`top${i}`]
      arr.push(
        t && t.value !== undefined && t.value !== null
          ? { value: t.value, count: t.count ?? null }
          : null,
      )
    }
  }
  return arr
}

/**
 * 5줄 집계 행 생성
 * - 문자열/IP/MAC : 1)개수  2)고유값  3)Top1(개수)  4)Top2(개수)  5)Top3(개수)
 * - 숫자          : 1)개수  2)합계    3)평균       4)최소       5)최대
 * - 날짜          : '-' (의미 없음 표시)
 * 첫 번째 열(라벨)은 한 번만 "집계"가 아니라 각 줄 의미를 명확히 표기
 */
export const fmtAggCell5 = (columns, aggregates) => {
  const rows = [
    { __label: '개수' }, // (1/5)
    { __label: '고유값 / 합계' }, // (2/5)
    { __label: 'Top1 / 평균' }, // (3/5)
    { __label: 'Top2 / 최소' }, // (4/5)
    { __label: 'Top3 / 최대' }, // (5/5)
  ]

  columns.forEach((col) => {
    const field = col.field
    if (!field) return
    const t = (col.filterParams?.type || 'string').toLowerCase()
    const a = aggregates?.[field] || {}

    if (t === 'date') {
      rows.forEach((r) => {
        r[field] = '-'
      })
      return
    }

    if (t === 'number') {
      rows[0][field] = 'count' in a ? fmtNum(a.count) : '-'
      rows[1][field] = 'sum' in a ? fmtNum(a.sum) : '-'
      rows[2][field] =
        'avg' in a && a.avg !== null && a.avg !== undefined ? Number(a.avg).toFixed(2) : '-'
      rows[3][field] = 'min' in a ? fmtNum(a.min) : '-'
      rows[4][field] = 'max' in a ? fmtNum(a.max) : '-'
      return
    }

    // string / ip / mac
    const [t1, t2, t3] = readTop(a, 3)
    rows[0][field] = 'count' in a ? fmtNum(a.count) : '-'
    rows[1][field] = 'distinct' in a ? fmtNum(a.distinct) : '-'
    rows[2][field] = t1 ? `${cut(t1.value)} (${fmtNum(t1.count)})` : '-'
    rows[3][field] = t2 ? `${cut(t2.value)} (${fmtNum(t2.count)})` : '-'
    rows[4][field] = t3 ? `${cut(t3.value)} (${fmtNum(t3.count)})` : '-'
  })

  return rows
}
