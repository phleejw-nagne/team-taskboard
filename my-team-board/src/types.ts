export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

export interface Board {
  id: string;
  name: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  board_id: string;
  content: string;
  status: TaskStatus;
  description?: string;
  priority: Priority;
  dueDate?: Date;
  assignee?: User;
  issue?: string;
}

export const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: '준비됨', color: 'bg-slate-100 text-slate-700' },
  { id: 'IN_PROGRESS', label: '진행중', color: 'bg-blue-50 text-blue-700' },
  { id: 'DONE', label: '완료됨', color: 'bg-green-50 text-green-700' },
];

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: '낮음', color: 'bg-slate-200 text-slate-700' },
  { value: 'MEDIUM', label: '보통', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'HIGH', label: '높음', color: 'bg-red-100 text-red-800' },
];