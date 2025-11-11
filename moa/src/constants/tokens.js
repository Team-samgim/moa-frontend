export const TOKENS = {
  BORDER: '#D1D1D6',
  BRAND: '#3877BE',
  LAYER_HEX: {
    http_page: '#DEEBFA',
    http_uri: '#F8F1D0',
    tcp: '#E6F0C7',
    ethernet: '#FCEBEB',
  },
  PALETTE: {
    http_page: '#3877BE',
    http_uri: '#FFD692',
    tcp: '#C4D398',
    ethernet: '#B8B8B8',
  },
}

export const getLayerHex = (layer) =>
  TOKENS.LAYER_HEX[String(layer || '').toLowerCase()] || '#CFCFCF'

export const getPalette = (layer) => TOKENS.PALETTE[String(layer || '').toLowerCase()] || '#CFCFCF'

export const CLASSES = {
  ROW_H: 'h-12',
  TH: 'px-5 py-3 whitespace-nowrap align-middle text-[13px]',
  TD: 'px-5 whitespace-nowrap align-middle text-[13px]',
  BTN: 'inline-flex items-center justify-center rounded border text-[12px] h-9 px-3 hover:bg-gray-50',
  BTN_ICON: 'inline-flex items-center justify-center rounded border h-9 w-9 hover:bg-gray-50',
}
