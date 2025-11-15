import axiosInstance from '@/api/axios'

export async function saveGridPreset({ presetName, config, favorite = false }) {
  const payload = {
    presetName,
    presetType: 'SEARCH',
    config,
    favorite,
  }
  const { data } = await axiosInstance.post('/presets/search', payload)
  return data // { presetId }
}

export async function savePivotPreset({ presetName, config, favorite = false, origin }) {
  const payload = {
    presetName,
    presetType: 'PIVOT',
    config,
    favorite,
    origin,
  }
  const { data } = await axiosInstance.post('/presets/pivot', payload)
  return data // { presetId }
}
