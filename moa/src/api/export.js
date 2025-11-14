import axiosInstance from '@/api/axios'

export async function exportChartImage({ config, dataUrl, fileName }) {
  if (!dataUrl) throw new Error('dataUrl이 비어 있습니다.')

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')

  const payload = {
    config,
    imageBase64: base64,
    fileName: fileName || null,
  }

  const { data } = await axiosInstance.post('/exports/chart', payload)
  return data
}
