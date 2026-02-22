import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Todo {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

interface TodoListProps {
    userId: string;
}

const TodoList: React.FC<TodoListProps> = ({ userId }) => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [inputText, setInputText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const storageKey = `bt_personal_todos_${userId}`;

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setTodos(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load personal todos', e);
        }
    }, [userId]);

    const saveTodos = (newTodos: Todo[]) => {
        setTodos(newTodos);
        try {
            localStorage.setItem(storageKey, JSON.stringify(newTodos));
        } catch (e) {
            console.error('Failed to save personal todos', e);
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newTodo: Todo = {
            id: crypto.randomUUID(),
            text: inputText.trim(),
            completed: false,
            createdAt: Date.now()
        };

        saveTodos([newTodo, ...todos]);
        setInputText('');
    };

    const toggleTodo = (id: string) => {
        saveTodos(todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const deleteTodo = (id: string) => {
        saveTodos(todos.filter(t => t.id !== id));
    };

    const filteredTodos = todos.filter(t =>
        t.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">個人待辦事項</h1>
                    <p className="text-slate-500 text-sm font-medium">記錄您的個人任務，這些資料僅儲存於本機，只有您自己看得到。</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0 flex-1">
                <div className="p-6 md:p-8 flex flex-col h-full gap-6">
                    <form onSubmit={handleAdd} className="flex gap-3 shrink-0">
                        <input
                            type="text"
                            placeholder="新增待辦事項..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-colors"
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="bg-orange-600 text-white px-6 rounded-2xl font-bold flex items-center gap-2 hover:bg-orange-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline">新增</span>
                        </button>
                    </form>

                    <div className="relative shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜尋待辦事項..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-orange-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 overflow-y-auto no-scrollbar pb-6 flex-1 min-h-0">
                        {filteredTodos.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                                <AlertCircle size={48} className="mb-4 text-slate-200" />
                                <p className="font-bold">{searchTerm ? '找不到符合條件的待辦事項' : '目前沒有待辦事項，開始規劃您的一天吧！'}</p>
                            </div>
                        ) : (
                            filteredTodos.map(todo => (
                                <div
                                    key={todo.id}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group ${todo.completed
                                            ? 'bg-slate-50 border-slate-100 opacity-70'
                                            : 'bg-white border-slate-200 hover:border-orange-200 hover:shadow-sm'
                                        }`}
                                >
                                    <label className="flex items-center gap-4 cursor-pointer flex-1 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => toggleTodo(todo.id)}
                                            className="shrink-0 focus:outline-none"
                                        >
                                            {todo.completed ? (
                                                <CheckCircle2 size={24} className="text-emerald-500 drop-shadow-sm" />
                                            ) : (
                                                <Circle size={24} className="text-slate-300 group-hover:text-orange-400 transition-colors" />
                                            )}
                                        </button>
                                        <span className={`text-sm font-bold truncate transition-all ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                                            }`}>
                                            {todo.text}
                                        </span>
                                    </label>

                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        className="shrink-0 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2"
                                        title="刪除"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoList;
