import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { exportGrid } from '@/api/grid'
import { saveGridPreset } from '@/api/presets'

function nowForFilename() {
  const iso = new Date().toISOString()
  return iso.replace(/[:.]/g, '').replace('T', '_').replace('Z', '')
}

// 날짜 → epoch seconds 보정 함수
const toEpochSec = (d) => {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor(date.getTime() / 1000)
}

const presetSeconds = {
  '1H': 3600,
  '2H': 7200,
  '24H': 86400,
  '7D': 604800,
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

      // 2) UI 쿼리(여기 안에 conditions, timePreset, customTimeRange 있음)
      const uiQuery = getUiQuery ? getUiQuery() : null
      const condition = uiQuery?.conditions ?? [] // ✅ 검색 조건 필드들

      const baseSpec = getBaseSpec ? getBaseSpec() : null
      const timePreset = uiQuery?.timePreset ?? '1H'
      const customTimeRange = uiQuery?.customTimeRange ?? null

      // 3) 시간 스냅샷 계산 (프리셋 저장 시점 기준)
      let time = null

      // (1) 서버에 이미 from/to가 있는 경우 우선 사용
      if (baseSpec?.time?.fromEpoch !== null && baseSpec?.time?.toEpoch !== null) {
        time = {
          field: baseSpec.time.field || 'ts_server_nsec',
          fromEpoch: baseSpec.time.fromEpoch,
          toEpoch: baseSpec.time.toEpoch,
        }
      }
      // (2) 커스텀 범위가 있으면 그대로 사용
      else if (customTimeRange?.from && customTimeRange?.to) {
        const fromEpoch = toEpochSec(customTimeRange.from)
        const toEpoch = toEpochSec(customTimeRange.to)
        if (fromEpoch !== null && toEpoch !== null) {
          time = {
            field: 'ts_server_nsec',
            fromEpoch,
            toEpoch,
          }
        }
      }
      // (3) 프리셋(1H/2H/24H/7D 등) 기준으로 현재 시점 계산
      if (!time) {
        const now = Math.floor(Date.now() / 1000)
        const span = presetSeconds[timePreset] ?? 3600
        time = {
          field: 'ts_server_nsec',
          fromEpoch: now - span,
          toEpoch: now,
        }
      }

      // 4) search 블록 생성
      const search = {
        version: 1,
        layer: currentLayer,
        columns,
        condition, // 검색 조건 배열
        query: uiQuery, // timePreset, customTimeRange, globalNot, viewKeys 등 전체 UI 상태
        time, // ✅ 실제 당시 시간 범위 스냅샷
      }

      // 5) 최종 config는 search로 한 번 감싸기
      const config = {
        search,
      }

      const fallback = `검색 프리셋 ${new Date().toLocaleString()}`
      const presetName = (window.prompt('프리셋 이름을 입력하세요', fallback) || fallback).trim()

      const requestBody = {
        presetName,
        presetType: 'SEARCH',
        config,
        favorite: false,
      }

      const res = await saveGridPreset(requestBody)
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
          className='rounded-md bg-[#F8F1D0] px-3 py-1.5 text-black shadow-sm hover:shadow transition disabled:opacity-50'
          title={ready ? '' : '그리드가 준비되면 활성화됩니다'}
        >
          {presetMut.isPending ? '저장 중…' : '프리셋 저장'}
        </button>

        <button
          onClick={() => exportMut.mutate()}
          disabled={disabled}
          className='rounded-md bg-[#E6F0C7] px-3 py-1.5 text-black shadow-sm hover:shadow transition disabled:opacity-50'
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
