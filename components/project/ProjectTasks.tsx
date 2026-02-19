import React, { useState } from 'react';
import { CheckCircle2, Check, Trash2, CalendarDays } from 'lucide-react';
import { Task } from '../../types';
import { useProject } from '../../contexts/ProjectContext';

const ProjectTasks: React.FC = () => {
    const { project, user, isReadOnly, onUpdateTasks } = useProject();
    // Local state for adding tasks is not needed if we use simple prompt or a form.
    // The original code used prompt. We can improve this later, but for now exact extraction.
    // Actually, let's keep it simple as in original.

    const handleAddTask = () => {
        const title = prompt('任務內容：');
        if (title) {
            const newTask: Task = {
                id: Date.now().toString(),
                title,
                assignee: user.name,
                status: 'Todo',
                priority: 'Medium',
                dueDate: new Date().toISOString().split('T')[0]
            };
            onUpdateTasks([newTask, ...(project.tasks || [])]);
        }
    };

    const handleToggleTask = (task: Task) => {
        const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
        onUpdateTasks((project.tasks || []).map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    };

    const handleDeleteTask = (taskId: string) => {
        onUpdateTasks((project.tasks || []).filter(t => t.id !== taskId));
    };

    return (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <h3 className="font-black text-xs uppercase tracking-widest">待辦任務清單</h3>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={handleAddTask}
                        className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-stone-800 transition-all active:scale-95"
                    >
                        + 新增任務
                    </button>
                )}
            </div>
            <div className="divide-y divide-stone-50">
                {project.tasks && project.tasks.length > 0 ? project.tasks.map(task => (
                    <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                            <button
                                disabled={isReadOnly}
                                onClick={() => handleToggleTask(task)}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 text-transparent hover:border-emerald-400'}`}
                            >
                                <Check size={12} strokeWidth={4} />
                            </button>
                            <div>
                                <p className={`text-sm font-bold text-stone-700 ${task.status === 'Done' ? 'line-through opacity-50' : ''}`}>{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase">{task.assignee}</span>
                                    {task.dueDate && <span className="text-[9px] text-stone-400 flex items-center gap-1"><CalendarDays size={10} /> {task.dueDate}</span>}
                                </div>
                            </div>
                        </div>
                        {!isReadOnly && (
                            <button onClick={() => handleDeleteTask(task.id)} className="text-stone-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all px-2">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-stone-300 gap-4 opacity-50">
                        <CheckCircle2 size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest">目前沒有待辦任務</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectTasks;
