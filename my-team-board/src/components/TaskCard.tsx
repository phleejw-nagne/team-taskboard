import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '@/types';
import { PRIORITIES } from '@/types';

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void; // 클릭 이벤트 추가
}

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priorityConfig = PRIORITIES.find(p => p.value === task.priority);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
          style={{ ...provided.draggableProps.style }}
          onClick={() => onClick(task)} // 클릭 시 실행
        >
          <Card 
            className={`cursor-pointer group hover:shadow-md transition-all border-l-4 ${
              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
            } ${
              task.status === 'DONE' ? 'border-l-green-500 opacity-60' : 
              task.status === 'IN_PROGRESS' ? 'border-l-blue-500' : 'border-l-slate-400'
            }`}
          >
            <CardContent className="p-3 space-y-2">
              {/* 태그 영역 (우선순위) */}
              <div className="flex justify-between items-start">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${priorityConfig?.color}`}>
                  {priorityConfig?.label}
                </span>
              </div>
              
              {/* 제목 */}
              <div className="text-sm font-medium text-slate-800 break-words">
                {task.content}
              </div>

              {/* 하단 정보 (날짜, 담당자) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                {task.dueDate ? (
                  <div className="flex items-center text-xs text-slate-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(task.dueDate), "MM/dd")}
                  </div>
                ) : <div />}
                
                {task.assignee && (
                   <div className="flex items-center text-xs font-medium bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                     <UserIcon className="w-3 h-3 mr-1" />
                     {task.assignee.name}
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}