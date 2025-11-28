/**
 * tokens.js
 *
 * UI 디자인 토큰(컬러, 테마, 공통 클래스) 모음.
 * 컴포넌트에서 일관된 색상·스타일을 사용하기 위한 기준 값들을 정의한다.
 *
 * 구성:
 * - TOKENS: 색상 팔레트 및 레이어별 배경색/메인색 정의
 * - getLayerHex(): 레이어 문자열 기반 배경색(hex) 반환
 * - getPalette(): 레이어 문자열 기반 메인 색상(hex) 반환
 * - CLASSES: 재사용 가능한 Tailwind 기반 공통 클래스 정의
 *
 * AUTHOR: 방대혁
 */

export const TOKENS = {
  // 테두리/브랜드 컬러
  BORDER: '#D1D1D6',
  BRAND: '#3877BE',

  // 레이어별 배경색
  LAYER_HEX: {
    http_page: '#DEEBFA',
    http_uri: '#F8F1D0',
    tcp: '#E6F0C7',
    ethernet: '#FCEBEB',
  },

  // 레이어별 메인 색상(진한 색)
  PALETTE: {
    http_page: '#3877BE',
    http_uri: '#FFD692',
    tcp: '#C4D398',
    ethernet: '#B8B8B8',
  },
}

/**
 * getLayerHex
 *
 * 레이어 문자열을 기반으로 배경색(hex)을 반환한다.
 * layer가 없거나 정의되지 않은 경우 기본값 '#CFCFCF'을 반환한다.
 *
 * @param {string} layer - 레이어 이름
 * @returns {string} hex color
 */
export const getLayerHex = (layer) =>
  TOKENS.LAYER_HEX[String(layer || '').toLowerCase()] || '#CFCFCF'

/**
 * getPalette
 *
 * 레이어에 대응하는 메인 색상(hex)을 반환한다.
 * undefined 또는 정의되지 않은 레이어일 경우 기본값 '#CFCFCF'을 반환한다.
 *
 * @param {string} layer - 레이어 이름
 * @returns {string} hex color
 */
export const getPalette = (layer) => TOKENS.PALETTE[String(layer || '').toLowerCase()] || '#CFCFCF'

/**
 * CLASSES
 *
 * 재사용 가능한 Tailwind 기반 공통 스타일 집합.
 * 여러 컴포넌트에서 동일한 UI 규칙을 사용하도록 정리한 클래스 프리셋이다.
 *
 * KEY:
 * - ROW_H: 테이블 row 높이
 * - TH: 테이블 TH 기본 스타일
 * - TD: 테이블 TD 기본 스타일
 * - BTN: 텍스트 버튼 스타일
 * - BTN_ICON: 아이콘 버튼 스타일
 */
export const CLASSES = {
  ROW_H: 'h-12',
  TH: 'px-5 py-3 whitespace-nowrap align-middle text-[13px]',
  TD: 'px-5 whitespace-nowrap align-middle text-[13px]',
  BTN: 'inline-flex items-center justify-center rounded border text-[12px] h-9 px-3 hover:bg-gray-50',
  BTN_ICON: 'inline-flex items-center justify-center rounded border h-9 w-9 hover:bg-gray-50',
}
