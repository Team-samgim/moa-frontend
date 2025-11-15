import { useMutation } from '@tanstack/react-query'
import { exportChartImage, exportPivotCsv } from '@/api/export'
import { savePivotPreset } from '@/api/presets'
import { usePivotStore } from '@/stores/pivotStore'
import { buildTimePayload } from '@/utils/pivotTime'
import { buildChartPresetConfig } from '@/utils/preset/chartPreset'
import { buildPivotPresetConfigFromStore } from '@/utils/preset/pivotPreset'

const useExportChartImage = (chartViewRef) => {
  return useMutation({
    mutationFn: async () => {
      if (!chartViewRef.current || !chartViewRef.current.getImageDataUrl) {
        throw new Error('차트 뷰가 준비되지 않았습니다.')
      }

      const dataUrl = chartViewRef.current.getImageDataUrl()
      if (!dataUrl) {
        throw new Error('차트 이미지를 가져올 수 없습니다.')
      }

      const config = buildChartPresetConfig()

      const res = await exportChartImage({
        config,
        dataUrl,
      })

      return res
    },
    onSuccess: (data) => {
      alert('차트 이미지 내보내기가 완료되었습니다.')
      if (data?.httpUrl) {
        window.open(data.httpUrl, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (e) => {
      console.error(e)
      alert('차트 이미지 내보내기 중 오류가 발생했습니다.')
    },
  })
}

const useExportPivotCsv = () => {
  return useMutation({
    mutationFn: async () => {
      const cfg = usePivotStore.getState()

      if (!cfg.layer || !cfg.rows?.length || !cfg.values?.length) {
        throw new Error('열/행/값을 먼저 설정해야 CSV를 내보낼 수 있습니다.')
      }

      const presetConfig = buildPivotPresetConfigFromStore()
      const presetName = `피벗 내보내기 - ${new Date().toLocaleString()}`

      const presetRes = await savePivotPreset({
        presetName,
        config: presetConfig,
        favorite: false,
        origin: 'EXPORT',
      })

      if (!presetRes || !presetRes.presetId) {
        throw new Error('피벗 프리셋 저장에 실패했습니다.')
      }

      const presetId = presetRes.presetId
      const time = buildTimePayload(cfg.timeRange, cfg.customRange)

      const pivotRequest = {
        layer: cfg.layer,
        time,
        column: cfg.column,
        rows: cfg.rows,
        values: cfg.values,
        filters: cfg.filters,
      }

      const fileNameBase = `pivot_${cfg.layer || 'layer'}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[-T:]/g, '')}`

      const res = await exportPivotCsv({
        presetId,
        pivot: pivotRequest,
        fileName: fileNameBase,
      })

      return res
    },
    onSuccess: (data) => {
      alert('피벗 CSV 내보내기가 완료되었습니다.')
      if (data?.httpUrl) {
        window.open(data.httpUrl, '_blank', 'noopener,noreferrer')
      }
    },
    onError: (e) => {
      console.error(e)
      alert(
        `피벗 CSV 내보내기 중 오류가 발생했습니다.\n${
          e?.response?.data?.message || e?.message || ''
        }`,
      )
    },
  })
}

function useExport(chartViewRef) {
  const exportChartImageMutation = useExportChartImage(chartViewRef)
  const exportPivotCsvMutation = useExportPivotCsv()

  return {
    exportChartImageMutation,
    exportPivotCsvMutation,
  }
}

export default useExport
