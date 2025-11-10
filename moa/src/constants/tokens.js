export const TOKENS = {
  BORDER: '#D1D1D6',
  BRAND: '#3877BE',
  LAYER_HEX: {
    http_page: '#DEEBFA',
    http_uri: '#F8F1D0',
    tcp: '#E6F0C7',
    ethernet: '#FCEBEB',
  },
}

export const getLayerHex = (layer) =>
  TOKENS.LAYER_HEX[String(layer || '').toLowerCase()] || '#CFCFCF'

export const CLASSES = {
  ROW_H: 'h-12',
  TH: 'px-4 py-2 whitespace-nowrap align-middle text-[13px]',
  TD: 'px-4 py-0 whitespace-nowrap align-middle text-[13px]',
  BTN: 'inline-flex items-center justify-center rounded border text-[12px] h-9 px-3 hover:bg-gray-50',
  BTN_ICON: 'inline-flex items-center justify-center rounded border h-9 w-9 hover:bg-gray-50',
}
