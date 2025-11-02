import React from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from '@/api/axios'

function nowForFilename() {
  const iso = new Date().toISOString()
  return iso.replace(/[:.]/g, '').replace('T', '_').replace('Z', '')
}

const GridToolbar = ({ currentLayer, onReset, onPivot, gridApis, getActiveFilters }) => {
  const exportMut = useMutation({
    mutationFn: async () => {
      const api = gridApis?.api
      if (!api) throw new Error('그리드가 아직 준비되지 않았습니다.')

      // 1) 실제 "화면에 표시 중" 컬럼 순서 -> 'field' 로 추출(별칭/colId X)
      const displayedFields = api
        .getAllDisplayedColumns()
        .map((c) => c.getColDef()?.field)
        .filter((f) => !!f && f !== '__rowNo') // 화면 전용 번호 컬럼 제외
      const columns = displayedFields

      // 2) 정렬(단일만)
      const sortModel = api.getSortModel?.()[0] || null
      const sortField = sortModel
        ? api.getColumnDef(sortModel.colId)?.field || sortModel.colId // field 우선
        : null
      const sortDirection = sortModel ? sortModel.sort : null

      // 3) 필터
      const filterModel = getActiveFilters ? getActiveFilters() : {}

      // 4) 파일명
      const fileName = `grid_export_${nowForFilename()}.csv`

      const { data } = await axios.post('/exports/grid', {
        layer: currentLayer,
        columns,
        filterModelJson: JSON.stringify(filterModel),
        sortField,
        sortDirection,
        fileName,
      })

      return data
    },
    onSuccess: (data) => {
      alert('CSV 저장 완료!')
      if (data?.httpUrl) window.open(data.httpUrl, '_blank')
    },
    onError: (e) => {
      console.error(e)
      alert(`CSV 저장 실패: ${e?.response?.status ?? ''}`)
    },
  })

  const ready = !!gridApis?.api
  const disabled = exportMut.isPending || !ready

  return (
    <div className='mb-4 flex items-center justify-between'>
      <div className='rounded-md bg-[#3877BE] px-3 py-1.5 font-medium text-white'>
        {currentLayer}
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={onReset}
          className='rounded-md border border-[#3877BE] px-3 py-1.5 text-[#3877BE] bg-white hover:bg-blue-50 transition'
        >
          필터 초기화
        </button>

        <button
          onClick={() => exportMut.mutate()}
          disabled={disabled}
          className='rounded-md bg-emerald-600 px-3 py-1.5 text-white shadow-sm hover:shadow transition disabled:opacity-50'
          title={ready ? '' : '그리드가 준비되면 활성화됩니다'}
        >
          {exportMut.isPending ? '저장 중…' : 'CSV 저장'}
        </button>

        {onPivot && (
          <button
            onClick={onPivot}
            className='rounded-md bg-[#3877BE] px-3 py-1.5 text-white shadow-sm hover:shadow transition'
          >
            피벗 모드
          </button>
        )}
      </div>
    </div>
  )
}

export default GridToolbar
