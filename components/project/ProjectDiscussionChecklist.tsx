import React, { useState, useMemo } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { ChecklistTask } from '../../types';
import { CheckSquare, Trash2, Plus, Clock, UserPlus, MoreHorizontal, Check } from 'lucide-react';

const DEFAULT_GROUPS = [
  {
    title: '會勘前後',
    tasks: [
      '約定會勘時間',
      '(財)開立發票(需統編/不須統編)',
      '(財)確認會勘訂金款項入帳',
      '(財)確認會勘尾款款項入帳',
      '現勘照片上傳',
      '製作報價單 (最好於五個工作天以內完成)',
      '與業主確認報價單內容'
    ]
  },
  {
    title: '開工文件準備',
    tasks: [
      '業主已回簽報價單',
      '安排工期',
      '投保工程保險：提供用印報價單到保險群組',
      '製作工程承攬合約書電子檔',
      '合約書電子檔給業主閱覽',
      '印出紙本合約書',
      '(財)製作頭款請款單excel檔',
      '(財)頭款請款單給業主確認',
      '(財)收到頭款款項、已完成第二筆款項請款excel檔',
      '(財)投保工程保險：要保書用印',
      '(財)等業務提供保險號、填寫簽帳卡繳費',
      '(財)紙本保單追蹤+收據掃描',
      '製作工安資料夾',
      '(財)投保工程保險：紙本保單掃描+歸檔',
      '(倉)準備物料 (確認庫存、訂購物料)',
      '(倉)機具及材料備齊、拍照回報'
    ]
  },
  {
    title: '施工中',
    tasks: [
      '進場(機具、物料)',
      '工項1',
      '工項2',
      '每日上傳照片紀錄',
      '撤場(機具、物料)',
      '工程進度50%',
      '(財)第二筆款項請款單給業主',
      '(財)收到第二筆款款項',
      '工程進度70%',
      '(財)第三筆款項請款單給業主',
      '(財)收到第三筆款款項'
    ]
  },
  {
    title: '完工後',
    tasks: [
      '與業主確認驗收 (一般合約訂定於7日內)',
      '(財)製作尾款通知書、開立發票',
      '製作&印出完工報告書',
      '寄出完工報告書',
      '確認業主收到完工報告書',
      '(財)確認收到尾款',
      '結案歸檔'
    ]
  }
];

const ProjectDiscussionChecklist: React.FC = () => {
  const { project, isReadOnly, onUpdateChecklist } = useProject();
  const rawChecklist = project.checklist || [];

  // Grouped tasks
  const groupedTasks = useMemo(() => {
    const map = new Map<string, ChecklistTask[]>();
    rawChecklist.forEach(t => {
      const g = t.group || '其他未分組項目';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    });
    return map;
  }, [rawChecklist]);

  const [newTaskInput, setNewTaskInput] = useState<{ [key: string]: string }>({});

  const handleToggleTask = (task: ChecklistTask) => {
    if (isReadOnly) return;
    const updated = rawChecklist.map(t => t.id === task.id ? { ...t, isDone: !t.isDone } : t);
    onUpdateChecklist(updated);
  };

  const handleImportDefaults = () => {
    if (isReadOnly) return;
    const newTasks: ChecklistTask[] = [];
    DEFAULT_GROUPS.forEach((g, gIdx) => {
      g.tasks.forEach((tTitle, tIdx) => {
        newTasks.push({
          id: `CHK-${Date.now()}-${gIdx}-${tIdx}`,
          title: tTitle,
          group: g.title,
          groupOrder: gIdx,
          isDone: false
        });
      });
    });
    onUpdateChecklist([...rawChecklist, ...newTasks]);
  };

  const handleDeleteGroup = (groupName: string) => {
    if (isReadOnly || !confirm(`確定要刪除整個「${groupName}」待辦群組嗎？`)) return;
    const updated = rawChecklist.filter(t => t.group !== groupName);
    onUpdateChecklist(updated);
  };

  const handleAddTask = (groupName: string) => {
    const title = newTaskInput[groupName]?.trim();
    if (!title || isReadOnly) return;

    const newTask: ChecklistTask = {
      id: `CHK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      group: groupName,
      isDone: false
    };

    onUpdateChecklist([...rawChecklist, newTask]);
    setNewTaskInput(prev => ({ ...prev, [groupName]: '' }));
  };

  const handleDeleteTask = (taskId: string) => {
    if (isReadOnly) return;
    const updated = rawChecklist.filter(t => t.id !== taskId);
    onUpdateChecklist(updated);
  };

  const hasGroups = groupedTasks.size > 0;

  // Sorted group keys based on original order if possible
  const groupKeys = Array.from(groupedTasks.keys()).sort((a, b) => {
    const getOrder = (g: string) => {
      const tasks = groupedTasks.get(g) || [];
      const ord = tasks.find(t => t.groupOrder !== undefined)?.groupOrder;
      return ord !== undefined ? ord : 999;
    };
    return getOrder(a) - getOrder(b);
  });

  if (!hasGroups && !isReadOnly) {
    return (
      <div className="bg-stone-900 rounded-3xl border border-stone-800 p-6 shadow-xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-stone-800 rounded-2xl flex items-center justify-center mb-4 text-stone-400">
          <CheckSquare size={24} />
        </div>
        <h4 className="text-white font-black text-sm mb-2 uppercase tracking-widest">目前沒有專案待辦清單</h4>
        <p className="text-stone-400 text-xs mb-6">點擊下方按鈕以套用標準專案待辦模板（會勘、開工、施工、完工）</p>
        <button
          onClick={handleImportDefaults}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-colors"
        >
          匯入標準待辦模板
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupKeys.map(groupName => {
        const tasks = groupedTasks.get(groupName) || [];
        const completedCount = tasks.filter(t => t.isDone).length;
        const totalCount = tasks.length;
        const progressStr = totalCount === 0 ? '0%' : `${Math.round((completedCount / totalCount) * 100)}%`;

        return (
          <div key={groupName} className="bg-[#1f1f23] rounded-2xl border border-stone-800/80 p-5 shadow-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="text-stone-400">
                  <CheckSquare size={16} />
                </div>
                <h4 className="text-[#e2e2e5] font-black text-[13px] tracking-wide">{groupName}</h4>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() => handleDeleteGroup(groupName)}
                  className="bg-[#2d2d31] hover:bg-rose-900/50 text-[#8e8e93] hover:text-rose-400 text-[11px] px-3 py-1 rounded-lg font-bold transition-colors"
                >
                  刪除
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[#8e8e93] text-[10px] font-bold w-6">{progressStr}</span>
              <div className="flex-1 h-1.5 bg-[#2d2d31] rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: progressStr }}></div>
              </div>
            </div>

            <div className="space-y-1 mt-1">
              {tasks.map(task => (
                <div key={task.id} className="group relative flex items-center justify-between hover:bg-[#2d2d31]/50 p-2 rounded-xl transition-colors cursor-pointer" onClick={() => handleToggleTask(task)}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${task.isDone ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-[#4a4a4e] bg-transparent'}`}>
                      {task.isDone && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span className={`text-[13px] truncate font-medium transition-colors ${task.isDone ? 'text-[#8e8e93] line-through' : 'text-[#e2e2e5]'}`}>
                      {task.title}
                    </span>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-[#8e8e93] hover:text-[#e2e2e5] hover:bg-[#3d3d41] rounded-md transition-colors">
                        <Clock size={12} />
                      </button>
                      <button className="p-1.5 text-[#8e8e93] hover:text-[#e2e2e5] hover:bg-[#3d3d41] rounded-md transition-colors">
                        <UserPlus size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="p-1.5 text-[#8e8e93] hover:text-rose-400 hover:bg-[#3d3d41] rounded-md transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <div className="mt-3 pl-2">
                <input
                  type="text"
                  placeholder="增加項目進此區..."
                  value={newTaskInput[groupName] || ''}
                  onChange={(e) => setNewTaskInput(prev => ({ ...prev, [groupName]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTask(groupName);
                    }
                  }}
                  className="bg-[#2d2d31] hover:bg-[#36363a] focus:bg-[#36363a] text-[#8e8e93] focus:text-[#e2e2e5] px-3 py-1.5 rounded-lg text-xs font-bold outline-none border border-transparent focus:border-[#4a4a4e] transition-colors w-32 focus:w-full max-w-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectDiscussionChecklist;
