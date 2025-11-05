import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableValueItem from './SortableValueItem'

const SortableValuesList = ({ values, onDragEnd, onFilterValue }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const getId = (v) => v.field + '::' + v.agg

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={values.map((v) => getId(v))} strategy={verticalListSortingStrategy}>
        {values.length > 0 ? (
          values.map((v) => <SortableValueItem key={getId(v)} item={v} onFilter={onFilterValue} />)
        ) : (
          <div className='px-3 py-6 text-center text-xs text-gray-400'>값을 선택하세요</div>
        )}
      </SortableContext>
    </DndContext>
  )
}

export default SortableValuesList
