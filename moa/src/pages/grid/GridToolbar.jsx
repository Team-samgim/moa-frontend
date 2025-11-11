import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { exportGrid } from '@/api/grid'
import { saveGridPreset } from '@/api/presets'

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
  getUiQuery,
}) => {
  // === 프리셋 저장 ===
  const presetMut = useMutation({
    mutationFn: async () => {
      const api = gridApis?.api
      if (!api) throw new Error('그리드가 아직 준비되지 않았습니다.')

      // 1) 현재 표시 중인 컬럼
      const columns = api
        .getAllDisplayedColumns()
        .map((c) => c.getColDef())
        .map((def) => def?.field ?? def?.colId)
        .filter((f) => !!f && f !== '__rowNo')

      // 2) 정렬 상태
      const base = getBaseSpec ? getBaseSpec() : null
      const sm = api.getSortModel?.()[0] || null
      const sortField = sm
        ? api.getColumnDef(sm.colId)?.field || sm.colId
        : base?.options?.orderBy || 'ts_server_nsec'
      const sortDirection = (sm?.sort || base?.options?.order || 'desc').toUpperCase()

      // 3) 필터 / 베이스 스펙(기간+조건+옵션)
      const filterModel = getActiveFilters ? getActiveFilters() : {}
      const uiQuery = getUiQuery ? getUiQuery() : null
      const baseSpec = getBaseSpec ? getBaseSpec() : null

      // 4) 저장 페이로드
      const config = {
        layer: currentLayer,
        columns,
        sort: { field: sortField, direction: sortDirection },
        filters: filterModel,
        baseSpec, // SearchPage의 buildSearchPayload 결과(기간/조건/옵션 포함)
        version: 1,
        query: uiQuery,
      }

      // 이름 입력(빈 입력 시 자동 이름)
      const fallback = `검색 프리셋 ${new Date().toLocaleString()}`
      const presetName = (window.prompt('프리셋 이름을 입력하세요', fallback) || fallback).trim()

      const res = await saveGridPreset({
        presetName,
        config,
        favorite: false,
      })
      return res
    },
    onSuccess: (data) => {
      alert(`프리셋 저장 완료! (ID: ${data?.presetId})`)
    },
    onError: (e) => {
      console.error(e)
      alert(`프리셋 저장 실패: ${e?.response?.status ?? e?.message ?? ''}`)
    },
  })

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

      // axios.post를 여기서 직접 써도 되지만, exportGrid로 감싸두면 더 깔끔
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
  const disabled = exportMut.isPending || presetMut.isPending || !ready

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
          onClick={() => presetMut.mutate()}
          disabled={disabled}
          className='rounded-md bg-indigo-600 px-3 py-1.5 text-white shadow-sm hover:shadow transition disabled:opacity-50'
          title={ready ? '' : '그리드가 준비되면 활성화됩니다'}
        >
          {presetMut.isPending ? '저장 중…' : '프리셋 저장'}
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
