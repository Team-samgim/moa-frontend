import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PropTypes from 'prop-types'
import { DragHandleContext } from './DragHandleContext'

const SortableWidget = ({ id, children, className }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <DragHandleContext.Provider value={{ listeners, attributes }}>
      <section
        ref={setNodeRef}
        style={style}
        className={`${className} rounded-lg border border-gray-200 bg-white shadow-sm`}
        {...attributes}
      >
        {children}
      </section>
    </DragHandleContext.Provider>
  )
}

SortableWidget.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

export default SortableWidget
