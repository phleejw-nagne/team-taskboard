import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Task, Priority, User } from '@/types';
import { PRIORITIES } from '@/types';

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  currentUser: User; // 현재 로그인한 사용자 (담당자 할당 테스트용)
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskDialog({ isOpen, onClose, task, currentUser, onSave, onDelete }: TaskDialogProps) {
  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignee, setAssignee] = useState<User | undefined>();

  const dateToInputValue = (d?: Date) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseInputDate = (v: string) => {
    if (!v) return undefined;
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // 모달이 열릴 때 데이터 채워넣기
  useEffect(() => {
    if (task) {
      setTitle(task.content);
      setDescription(task.description || '');
      setIssue(task.issue || '');
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setAssignee(task.assignee);
    }
  }, [task, isOpen]);

  const handleSave = () => {
    if (!task) return;
    onSave({
      ...task,
      content: title,
      description,
      issue,
      priority,
      dueDate,
      assignee,
    });
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>할 일 상세 정보</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* 제목 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">할 일 제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 우선순위 */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">우선순위</label>
              <select
                value={priority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as Priority)}
                className="rounded-md border px-3 py-2"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* 담당자 (간단히 현재 유저 할당/해제 버튼으로 구현) */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">담당자</label>
              <div className="flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   className={`w-full justify-start ${assignee ? 'border-blue-500 bg-blue-50' : ''}`}
                   onClick={() => setAssignee(assignee ? undefined : currentUser)}
                 >
                   <UserIcon className="mr-2 h-4 w-4" />
                   {assignee ? assignee.name : '담당자 없음'}
                 </Button>
              </div>
            </div>
          </div>

          {/* 마감일 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">마감일</label>
            <div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <input
                  type="date"
                  value={dateToInputValue(dueDate)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(parseInputDate(e.target.value))}
                  className="rounded-md border px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">상세 설명</label>
            <textarea
              className="min-h-[100px] rounded-md border p-2"
              placeholder="자세한 내용을 적어주세요..."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </div>

          {/* 이슈 사항 */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-red-600">이슈 / 특이사항</label>
            <Input 
              className="border-red-200 focus-visible:ring-red-500"
              placeholder="문제 발생 시 기록"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" onClick={() => { onDelete(task.id); onClose(); }}>삭제</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave}>저장</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}