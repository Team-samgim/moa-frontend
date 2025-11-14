import { create } from 'zustand'

export const usePivotModalStore = create((set) => ({
  isOpen: false,
  mode: null, // 'rows' | 'column' | 'values'

  draftRows: [],
  draftColumn: null,
  draftValues: [],

  openModal: (mode, { rows, column, values }) =>
    set(() => ({
      isOpen: true,
      mode,
      draftRows: rows ? [...rows] : [],
      draftColumn: column ? { ...column } : null,
      draftValues: values ? [...values] : [],
    })),

  closeModal: () =>
    set(() => ({
      isOpen: false,
      mode: null,
    })),

  setDraftRows: (rows) => set(() => ({ draftRows: rows })),

  setDraftColumn: (col) => set(() => ({ draftColumn: col })),

  setDraftValues: (vals) => set(() => ({ draftValues: vals })),
}))
