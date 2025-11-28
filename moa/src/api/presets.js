/**
 * Preset 저장 API 모듈
 *
 * 기능:
 * - Grid Preset 저장
 * - Pivot Preset 저장
 *
 * AUTHOR : 방대혁
 */

import axiosInstance from '@/api/axios'

/* ===============================================================
 *  Grid Preset 저장
 * =============================================================== */
/**
 * Grid(Search) Preset 저장
 * POST /presets/search
 *
 * payload 예:
 * {
 *   presetName: string,
 *   presetType: "SEARCH",
 *   config: object,
 *   favorite: boolean
 * }
 *
 * 반환:
 * { presetId: number }
 */
export async function saveGridPreset({ presetName, config, favorite = false }) {
  const payload = {
    presetName,
    presetType: 'SEARCH',
    config,
    favorite,
  }

  const { data } = await axiosInstance.post('/presets/search', payload)
  return data
}

/* ===============================================================
 *  Pivot Preset 저장
 * =============================================================== */
/**
 * Pivot Preset 저장
 * POST /presets/pivot
 *
 * payload 예:
 * {
 *   presetName: string,
 *   presetType: "PIVOT",
 *   config: object,
 *   favorite: boolean,
 *   origin: "USER" | "EXPORT"
 * }
 *
 * 반환:
 * { presetId: number }
 */
export async function savePivotPreset({ presetName, config, favorite = false, origin }) {
  const payload = {
    presetName,
    presetType: 'PIVOT',
    config,
    favorite,
    origin,
  }

  const { data } = await axiosInstance.post('/presets/pivot', payload)
  return data
}
