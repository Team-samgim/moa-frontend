import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableRowItem from './SortableRowItem'

const SortableRowsList = ({ rows, onDragEnd, onFilterRow }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={rows.map((r) => r.field)} strategy={verticalListSortingStrategy}>
        {rows.length > 0 ? (
          rows.map((r) => <SortableRowItem key={r.field} item={r} onFilter={onFilterRow} />)
        ) : (
          <div className='px-3 py-6 4xl:px-4 4xl:py-8 text-center text-xs 4xl:text-sm text-gray-400'>
            행을 선택하세요
          </div>
        )}
      </SortableContext>
    </DndContext>
  )
}

export default SortableRowsList
