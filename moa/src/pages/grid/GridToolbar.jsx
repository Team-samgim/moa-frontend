/**
 * GridToolbar
 *
 * 기능:
 * - 그리드 필터 초기화 버튼
 * - 피벗 모드 전환 버튼(onPivot)
 * - 현재 표시된 컬럼/필터/정렬/기본스펙을 기반으로 CSV 내보내기
 *
 * 주요 동작:
 * - AG Grid API에서 표시 컬럼 목록을 수집
 * - 정렬 상태(sortModel)와 activeFilters, baseSpec을 포함해 서버에 export 요청
 * - exportGrid API 호출 후 presigned URL을 받아 브라우저에서 다운로드
 *
 * 사용처:
 * - 모든 Grid 화면 상단의 공통 툴바
 *
 * AUTHOR: 방대혁
 */

import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { exportGrid } from '@/api/grid'
import ExcelIcon from '@/assets/icons/excel.svg?react'
import FilterIcon from '@/assets/icons/filter-grid.svg?react'
import GoPivotIcon from '@/assets/icons/go-front.svg?react'

function nowForFilename() {
  const iso = new Date().toISOString()
  return iso.replace(/[:.]/g, '').replace('T', '_').replace('Z', '')
}

const GridToolbar = ({
  currentLayer,
  onReset,
  onPivot,
  gridApis,
  getActiveFilters,
  getBaseSpec,
}) => {
  const exportMut = useMutation({
    mutationFn: async () => {
      const api = gridApis?.api
      if (!api) throw new Error('그리드가 아직 준비되지 않았습니다.')

      const columns = api
        .getAllDisplayedColumns()
        .map((c) => c.getColDef())
        .map((def) => def?.field ?? def?.colId)
        .filter((f) => !!f && f !== '__rowNo')

      const base = getBaseSpec ? getBaseSpec() : null
      const sm = api.getSortModel?.()[0] || null
      const sortField = sm
        ? api.getColumnDef(sm.colId)?.field || sm.colId
        : base?.options?.orderBy || 'ts_server_nsec'
      const sortDirection = (sm?.sort || base?.options?.order || 'desc').toUpperCase()

      const filterModel = getActiveFilters ? getActiveFilters() : {}
      const baseSpec = getBaseSpec ? getBaseSpec() : null
      const fileName = `grid_export_${nowForFilename()}`

      const data = await exportGrid({
        layer: currentLayer,
        columns,
        filterModelJson: JSON.stringify(filterModel),
        baseSpecJson: baseSpec ? JSON.stringify(baseSpec) : undefined,
        sortField,
        sortDirection,
        fileName,
      })
      return data
    },
    onSuccess: (data) => {
      alert('CSV 저장 완료!')
      if (data?.httpUrl) window.open(data.httpUrl, '_blank', 'noopener,noreferrer')
    },
    onError: (e) => {
      console.error(e)
      alert(`CSV 저장 실패: ${e?.response?.status ?? e?.message ?? ''}`)
    },
  })

  const ready = !!gridApis?.api
  const disabled = exportMut.isPending || !ready

  return (
    <div className='mb-4 flex items-center justify-between font-sans w-full'>
      {onPivot && (
        <button
          className='
            flex items-center gap-3 rounded-full px-4 py-1.5 justify-between
            font-medium text-gray-700 text-[13px]
            relative overflow-hidden
            transition-all
            hover:scale-[1.02]
            active:scale-[0.98]
            shadow-[0_0_4px_3px_rgba(150,175,76,0.25)]
            bg-[#DFE9C3]
          '
          onClick={onPivot}
        >
          <span>피벗 모드</span>
          <div
            className='
              flex items-center justify-center w-5.5 h-5.5 rounded-full
              bg-[#B9CF77] shadow-[0_0_10px_0_#A0BC4A]
            '
          >
            <GoPivotIcon className='w-3.5 h-3.5 text-gray-700' />
          </div>
        </button>
      )}

      <div className='flex items-center gap-1'>
        <button
          className='rounded-md border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 font-medium text-[12px] 4xl:text-[14px] text-gray-500 px-3 py-1 disabled:opacity-50'
          onClick={onReset}
        >
          <FilterIcon className='w-4 h-4 4xl:w-4.5 4xl:h-4.5 text-[#595959]' />
          <span>필터 초기화</span>
        </button>
        <button
          className='rounded-md border border-gray-300 hover:bg-gray-50 flex justify-center items-center gap-2 font-medium text-[12px] 4xl:text-[14px] text-gray-500 px-3 py-1 disabled:opacity-50'
          type='button'
          onClick={() => exportMut.mutate()}
          disabled={disabled}
          title={ready ? '' : '그리드가 준비되면 활성화됩니다'}
        >
          <ExcelIcon className='w-4 h-4 4xl:w-4.5 4xl:h-4.5 text-[#595959]' />
          <span>{exportMut.isPending ? '저장 중…' : 'CSV 파일 저장'}</span>
        </button>
      </div>
    </div>
  )
}

export default GridToolbar
