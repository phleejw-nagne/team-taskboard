import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          style={{ ...provided.draggableProps.style }}
        >
          <Card 
            className={`cursor-grab hover:shadow-md transition-shadow border-l-4 ${
              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
            } ${
              task.status === 'DONE' ? 'border-l-green-500' : 
              task.status === 'IN_PROGRESS' ? 'border-l-blue-500' : 'border-l-slate-400'
            }`}
          >
            <CardContent className="p-4 text-sm font-medium text-slate-700">
              {task.content}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}