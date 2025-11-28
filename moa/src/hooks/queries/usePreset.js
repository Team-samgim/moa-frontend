// 작성자: 최이서
import { useMutation } from '@tanstack/react-query'
import { savePivotPreset } from '@/api/presets'
import { buildPivotPresetConfigFromStore } from '@/utils/preset/pivotPreset'

const useSavePivotPreset = () => {
  return useMutation({
    mutationFn: async () => {
      const config = buildPivotPresetConfigFromStore()

      const fallback = `피벗 프리셋 ${new Date().toLocaleString()}`
      const input = window.prompt('피벗 프리셋 이름을 입력하세요', fallback)
      if (input === null) {
        return null
      }

      const presetName = (input || fallback).trim()
      if (!presetName) {
        window.alert('프리셋 이름이 비어 있습니다.')
        return null
      }

      const res = await savePivotPreset({
        presetName,
        config,
        favorite: false,
        origin: 'USER',
      })
      return res
    },
    onSuccess: (data) => {
      if (!data) return
      window.alert(`피벗 프리셋 저장 완료! (ID: ${data.presetId})`)
    },
    onError: (e) => {
      console.error(e)
      window.alert(`피벗 프리셋 저장 실패: ${e?.response?.status || e?.message || ''}`)
    },
  })
}

function usePreset() {
  const savePivotPresetMutation = useSavePivotPreset()

  return {
    savePivotPresetMutation,
  }
}

export default usePreset
