import { useEffect, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Board, Task, TaskStatus, User } from '@/types';
import { COLUMNS } from '@/types';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskDialog } from '@/components/TaskDialog';
import { Auth } from '@/components/Auth'; // 로그인 컴포넌트 임포트
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PlusCircle, Layout, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function App() {
  // --- 상태 관리 ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // 로그인 체크 중인지 여부

  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- 1. 로그인 상태 감지 (앱 시작 시 실행) ---
  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || '사용자',
        });
      }
      setIsAuthChecking(false);
    });

    // 로그인/로그아웃 이벤트 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name || '사용자',
        });
      } else {
        setUser(null);
        setBoards([]); // 로그아웃 시 데이터 비우기
        setActiveBoardId(null);
      }
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 2. 초기 데이터 로드 (보드 목록) ---
  useEffect(() => {
    if (!user) return; // 로그인 안 했으면 실행 X

    fetchBoards();
    
    // 보드 테이블 실시간 구독
    const channel = supabase
      .channel('public:boards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boards' }, () => {
        fetchBoards();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // --- 3. 보드가 선택되면 태스크 로드 및 실시간 구독 ---
  useEffect(() => {
    if (!activeBoardId) return;
    fetchTasks(activeBoardId);

    const channel = supabase
      .channel(`public:tasks:${activeBoardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${activeBoardId}` }, () => {
        fetchTasks(activeBoardId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeBoardId]);

  // --- Supabase CRUD 함수들 ---

  const fetchBoards = async () => {
    const { data, error } = await supabase.from('boards').select('*').order('created_at', { ascending: true });
    if (!error && data) setBoards(data);
  };

  const fetchTasks = async (boardId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').eq('board_id', boardId).order('created_at', { ascending: true });
    
    if (!error && data) {
      // DB의 snake_case 컬럼을 TypeScript의 camelCase로 매핑
      const mappedTasks: Task[] = data.map((t: any) => ({
        id: t.id,
        board_id: t.board_id,
        content: t.content,
        status: t.status,
        description: t.description,
        priority: t.priority,
        dueDate: t.due_date ? new Date(t.due_date) : undefined,
        assignee: t.assignee,
        issue: t.issue
      }));
      setTasks(mappedTasks);
    }
    setIsLoading(false);
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    const { data, error } = await supabase.from('boards').insert([{ name: newBoardName }]).select();
    if (!error && data) {
      setNewBoardName('');
      setActiveBoardId(data[0].id);
    }
  };

  const addTask = async (content: string, status: TaskStatus) => {
    if (!activeBoardId) return;
    await supabase.from('tasks').insert([{
      board_id: activeBoardId,
      content,
      status,
      priority: 'MEDIUM',
    }]);
  };

  const updateTask = async (updatedTask: Task) => {
    // UI 즉시 업데이트 (Optimistic UI)
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));

    await supabase.from('tasks').update({
      content: updatedTask.content,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      issue: updatedTask.issue,
      due_date: updatedTask.dueDate,
      assignee: updatedTask.assignee
    }).eq('id', updatedTask.id);
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;

    // UI 즉시 업데이트
    setTasks(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === draggableId);
      if (taskIndex === -1) return prev;
      newTasks[taskIndex] = { ...newTasks[taskIndex], status: newStatus };
      return newTasks;
    });

    // Supabase 업데이트
    await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
  };

  // --- 화면 렌더링 ---

  // 1. 로그인 확인 중 (로딩)
  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 2. 로그인 안 됨 - Auth 컴포넌트 표시
  if (!user) {
    return <Auth />;
  }

  // 3. 로그인됨 - 메인 화면
  const activeTasks = tasks.filter(t => t.board_id === activeBoardId);
  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layout className="w-8 h-8 text-blue-600" />
              팀 태스크보드
            </h1>
            <p className="text-slate-500 mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                실시간 동기화 중
              </span>
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Input 
              placeholder="새 보드 이름..." 
              value={newBoardName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBoardName(e.target.value)}
              className="bg-white max-w-xs"
            />
            <Button onClick={createBoard}><PlusCircle className="mr-2 h-4 w-4" /> 보드 생성</Button>
            <Button variant="outline" onClick={handleLogout}>로그아웃</Button>
          </div>
        </header>

        {!activeBoardId ? (
          <div className="text-center py-20">
            <h2 className="text-xl text-slate-400 font-medium">보드를 선택하거나 새로 만드세요.</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {boards.map(board => (
                <Card 
                  key={board.id} 
                  className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-md bg-white"
                  onClick={() => setActiveBoardId(board.id)}
                >
                  <div className="p-6 text-center font-bold text-lg">{board.name}</div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={() => { setActiveBoardId(null); setTasks([]); }}>← 목록으로</Button>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {activeBoard?.name}
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              </h2>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    status={col.id}
                    label={col.label}
                    tasks={activeTasks.filter(t => t.status === col.id)}
                    onAddTask={addTask}
                    onTaskClick={(task) => { setSelectedTask(task); setIsModalOpen(true); }}
                  />
                ))}
              </div>
            </DragDropContext>
          </div>
        )}
      </div>

      {user && (
        <TaskDialog 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTask}
          currentUser={user}
          onSave={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}

export default App;