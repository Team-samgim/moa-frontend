// AggregatesGrid.jsx
import React, { useMemo } from 'react'
import { cut } from '@/utils/aggFormat' // 이미 있는 util 재사용

// 숫자 포맷 (fmtAggCell5와 규칙 맞춰줌)
const fmtNum = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n)) ? '-' : Number(n).toLocaleString()

// top 결과 파싱 (top1/top2/top3 또는 top=[{value,count},...])
const readTop = (agg, k = 3) => {
  const arr = []

  if (Array.isArray(agg?.top)) {
    for (let i = 0; i < Math.min(k, agg.top.length); i++) {
      const it = agg.top[i]
      if (it && it.value !== undefined && it.value !== null) {
        arr.push({ value: it.value, count: it.count ?? null })
      } else {
        arr.push(null)
      }
    }
  } else {
    for (let i = 1; i <= k; i++) {
      const t = agg?.[`top${i}`]
      if (t && t.value !== undefined && t.value !== null) {
        arr.push({ value: t.value, count: t.count ?? null })
      } else {
        arr.push(null)
      }
    }
  }
  return arr
}

/**
 * 컬럼 기준 집계 카드 뷰
 * - DataGrid 컬럼 순서대로 카드 생성
 * - 5개씩 여러 줄로 표시 (그리드 레이아웃)
 * - 숫자 타입 : 개수 / 합계 / 평균 / 최소 / 최대
 * - 문자열/IP/MAC : 개수 / 고유값 / Top1~3
 */
const AggregatesGrid = ({ columns = [], aggregates = {} }) => {
  // 카드로 만들 컬럼들 (No/__rowNo/날짜 등 제외)
  const visibleColumns = useMemo(
    () =>
      (columns || []).filter((c) => {
        const field = c.field || c.name
        if (!field) return false
        if (c.field === '__rowNo') return false
        if (c.headerName === 'No') return false

        const type = (c.filterParams?.type || c.type || '').toLowerCase()
        // 날짜 타입은 의미 있는 집계가 없다면 제외
        if (type === 'date') return false

        return true
      }),
    [columns],
  )

  // 집계 데이터가 하나라도 있는지 확인
  const hasAnyAgg = useMemo(
    () =>
      visibleColumns.some((col) => {
        const field = col.field || col.name
        const a = aggregates?.[field]
        return a && Object.keys(a).length > 0
      }),
    [visibleColumns, aggregates],
  )

  if (!visibleColumns.length || !hasAnyAgg) return null

  return (
    <section className='mt-4'>
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='text-sm font-semibold text-gray-700'>컬럼별 집계</h3>
        <span className='text-xs text-gray-400'>{visibleColumns.length}개 컬럼</span>
      </div>

      {/* 스크롤 가능한 컨테이너 */}
      <div className='max-h-[600px] overflow-y-auto pr-1'>
        {/* 5개씩 여러 줄로 표시하는 그리드 */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
          {visibleColumns.map((col) => {
            const field = col.field || col.name
            const header = col.headerName || col.labelKo || field

            const agg = aggregates?.[field] || {}

            // 컬럼 메타에서 추정한 기본 타입
            const baseType = (col.filterParams?.type || col.type || 'string').toLowerCase()

            // ✅ 집계 결과를 보고 숫자 타입 여부 보정
            const isNumericAgg = 'sum' in agg || 'avg' in agg || 'min' in agg || 'max' in agg

            const isNumber = baseType === 'number' || isNumericAgg
            const isDate = baseType === 'date'

            let items = []

            if (isNumber) {
              items = [
                { label: '개수', value: 'count' in agg ? fmtNum(agg.count) : '-' },
                { label: '합계', value: 'sum' in agg ? fmtNum(agg.sum) : '-' },
                {
                  label: '평균',
                  value:
                    'avg' in agg && agg.avg !== null && agg.avg !== undefined
                      ? Number(agg.avg).toFixed(2)
                      : '-',
                },
                { label: '최소', value: 'min' in agg ? fmtNum(agg.min) : '-' },
                { label: '최대', value: 'max' in agg ? fmtNum(agg.max) : '-' },
              ]
            } else if (!isDate) {
              const [t1, t2, t3] = readTop(agg, 3)
              items = [
                { label: '개수', value: 'count' in agg ? fmtNum(agg.count) : '-' },
                { label: '고유값', value: 'distinct' in agg ? fmtNum(agg.distinct) : '-' },
                {
                  label: t1 ? `Top1(${fmtNum(t1.count)})` : 'Top1',
                  value: t1 ? cut(t1.value) : '-',
                },
                {
                  label: t2 ? `Top2(${fmtNum(t2.count)})` : 'Top2',
                  value: t2 ? cut(t2.value) : '-',
                },
                {
                  label: t3 ? `Top3(${fmtNum(t3.count)})` : 'Top3',
                  value: t3 ? cut(t3.value) : '-',
                },
              ]
            } else {
              items = [
                {
                  label: '개수',
                  value: 'count' in agg ? fmtNum(agg.count) : '-',
                },
              ]
            }

            return (
              <article
                key={field}
                className='rounded-xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-100'
              >
                {/* 카드 헤더 */}
                <header className='mb-3 flex items-center justify-between gap-2'>
                  <div className='flex-1 truncate'>
                    <h4 className='truncate text-sm font-semibold text-slate-800'>{header}</h4>
                    <p className='truncate text-xs text-slate-400'>{field}</p>
                  </div>
                </header>

                {/* 메트릭 리스트 */}
                <dl className='space-y-1.5'>
                  {items.map((it) => (
                    <div
                      key={it.label}
                      className='flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50'
                    >
                      <dt className='text-xs text-slate-500'>{it.label}</dt>
                      <dd className='max-w-[140px] truncate text-right text-xs font-mono text-slate-800'>
                        {it.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default AggregatesGrid
