import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onAddTask: (content: string, status: TaskStatus) => void;
  onTaskClick: (task: Task) => void; // 클릭 이벤트 추가됨
}

export function KanbanColumn({ status, label, tasks, onAddTask, onTaskClick }: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  const handleAdd = () => {
    if (!newTaskContent.trim()) return;
    onAddTask(newTaskContent, status);
    setNewTaskContent('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50/50 rounded-xl border border-slate-200 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700">{label}</h3>
        <span className="text-xs font-bold bg-white px-2 py-1 rounded-full border text-slate-500">
          {tasks.length}
        </span>
      </div>

      {/* 드롭 영역 */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 min-h-[150px] transition-colors rounded-lg ${
              snapshot.isDraggingOver ? 'bg-slate-100/80' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onClick={onTaskClick} // 클릭 핸들러 전달
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* 할 일 추가 영역 */}
      <div className="mt-3">
        {isAdding ? (
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="할 일을 입력하세요..."
              value={newTaskContent}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskContent(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAdd()}
              className="bg-white"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="w-full">추가</Button>
              <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-900 border border-dashed border-slate-300"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> 카드 추가
          </Button>
        )}
      </div>
    </div>
  );
}