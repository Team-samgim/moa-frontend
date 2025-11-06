import axiosInstance from '@/api/axios'

export async function saveGridPreset({ presetName, config, favorite = false }) {
  const payload = {
    presetName,
    presetType: 'GRID',
    config,
    favorite,
  }
  const { data } = await axiosInstance.post('/presets/grid', payload)
  return data // { presetId }
}
