import { createContext, useContext } from 'react'

// 드래그 핸들 Context
export const DragHandleContext = createContext(null)

export const useDragHandle = () => {
  const context = useContext(DragHandleContext)
  if (!context) {
    return { listeners: null, attributes: null }
  }
  return context
}
