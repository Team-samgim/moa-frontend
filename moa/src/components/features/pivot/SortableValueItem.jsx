import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FilterIcon from '@/assets/icons/filter.svg?react'
import SideKickIcon from '@/assets/icons/side-kick.svg?react'

const SortableValueItem = ({ item, onFilter = () => {} }) => {
  const sortableId = item.field + '::' + item.agg

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: sortableId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center justify-between px-3 py-2 text-sm text-gray-800 bg-white border-t first:border-t-0 border-gray-200'
    >
      <div className='flex flex-col'>
        <span className='flex items-center gap-2'>
          <button
            className='text-gray-500 cursor-grab active:cursor-grabbing shrink-0'
            {...attributes}
            {...listeners}
          >
            <SideKickIcon className='h-4 w-4 text-gray-500' />
          </button>
          {item.alias ?? item.field}
        </span>
        <span className='pl-6 text-[11px] text-gray-500'>
          {item.agg?.toUpperCase()} • {item.field}
        </span>
      </div>
      <div className='flex items-center gap-2 text-gray-400'>
        <button className='p-1 hover:text-red-500' onClick={() => onFilter(item.field)}>
          <FilterIcon className='h-4 w-4 text-[#464646]' />
        </button>
      </div>
    </div>
  )
}

export default SortableValueItem
