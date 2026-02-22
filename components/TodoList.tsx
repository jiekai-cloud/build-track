import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Search, CheckCircle2, Circle, AlertCircle, Edit2, X, Check, Cloud, CloudOff } from 'lucide-react';
import { db } from '../services/firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [isSynced, setIsSynced] = useState(false);

    const storageKey = `bt_personal_todos_${userId}`;
    const saveTimerRef = useRef<any>(null);

    // Load: localStorage first (instant), then Firebase (merge newer)
    useEffect(() => {
        // 1. Load local instantly
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) setTodos(JSON.parse(saved));
        } catch (e) {
            console.error('Failed to load personal todos from local', e);
        }

        // 2. Load from Firebase (per-user document)
        const loadFromCloud = async () => {
            try {
                const docRef = doc(db, 'user_todos', userId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const cloudTodos = snap.data().todos as Todo[] || [];
                    if (cloudTodos.length > 0) {
                        setTodos(prev => {
                            // Merge: use cloud if it has more or same items
                            if (cloudTodos.length >= prev.length) return cloudTodos;
                            return prev;
                        });
                    }
                    setIsSynced(true);
                } else {
                    setIsSynced(true); // No cloud data yet, but connection works
                }
            } catch (e) {
                console.warn('[Todos] Firebase load failed, using local only', e);
            }
        };
        loadFromCloud();
    }, [userId]);

    const saveTodos = (newTodos: Todo[]) => {
        setTodos(newTodos);
        // 1. Save to localStorage immediately (fast)
        try {
            localStorage.setItem(storageKey, JSON.stringify(newTodos));
        } catch (e) {
            console.error('Failed to save personal todos locally', e);
        }

        // 2. Debounced save to Firebase (1 second)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(async () => {
            try {
                const docRef = doc(db, 'user_todos', userId);
                await setDoc(docRef, {
                    todos: JSON.parse(JSON.stringify(newTodos)),
                    userId,
                    updatedAt: new Date().toISOString()
                });
                setIsSynced(true);
            } catch (e) {
                console.error('[Todos] Firebase save failed', e);
                setIsSynced(false);
            }
        }, 1000);
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

    const startEditing = (e: React.MouseEvent, todo: Todo) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingId(todo.id);
        setEditText(todo.text);
    };

    const saveEdit = () => {
        if (editingId && editText.trim()) {
            saveTodos(todos.map(t =>
                t.id === editingId ? { ...t, text: editText.trim() } : t
            ));
        }
        setEditingId(null);
        setEditText('');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const clearCompleted = () => {
        if (todos.filter(t => t.completed).length === 0) return;
        if (window.confirm('確定要清除所有已完成的項目嗎？')) {
            saveTodos(todos.filter(t => !t.completed));
        }
    };

    const filteredTodos = todos.filter(t =>
        t.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 lg:p-8 space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto h-full flex flex-col relative">
            {/* Background elements for depth */}
            <div className="absolute top-[5%] left-[5%] w-[30%] h-[30%] rounded-full bg-orange-400/20 blur-[120px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px] -z-10 pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 px-2 lg:px-4">
                <div>
                    <h1 className="text-[28px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-stone-600 mb-1">
                        個人待辦事項
                    </h1>
                    <p className="text-stone-500 text-[11px] font-black tracking-widest uppercase">
                        記錄您的個人任務，跨裝置雲端同步。{isSynced ? <Cloud size={14} className="inline ml-1 text-green-500" /> : <CloudOff size={14} className="inline ml-1 text-stone-400" />}
                    </p>
                </div>
                <div className="bg-white/60 backdrop-blur-md px-4 py-2.5 border border-stone-200/60 rounded-2xl shadow-sm self-start sm:self-auto flex items-center gap-4">
                    <button
                        onClick={clearCompleted}
                        disabled={todos.filter(t => t.completed).length === 0}
                        className="flex items-center gap-2.5 disabled:opacity-50 hover:bg-stone-100/80 p-1.5 -m-1.5 rounded-xl transition-colors group cursor-pointer disabled:cursor-auto"
                        title="清除已完成項目"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:animate-ping disabled:animate-none"></div>
                        <span className="text-[11px] font-black tracking-widest text-stone-600 uppercase">已完成 {todos.filter(t => t.completed).length}</span>
                    </button>
                    <div className="w-px h-4 bg-stone-300"></div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-[11px] font-black tracking-widest text-stone-600 uppercase">待辦 {todos.filter(t => !t.completed).length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-200/60 overflow-hidden flex flex-col min-h-0 flex-1 relative">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500"></div>

                <div className="p-6 md:p-8 flex flex-col h-full gap-6">
                    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 shrink-0 relative z-10">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                placeholder="接下來要做什麼？..."
                                className="w-full bg-stone-50/80 border border-stone-200 rounded-2xl pl-5 pr-12 py-4 text-sm font-bold text-stone-700 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 focus:bg-white transition-all placeholder:text-stone-400 shadow-inner overflow-hidden"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 sm:py-0 rounded-2xl font-black text-sm tracking-widest flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>新增</span>
                        </button>
                    </form>

                    <div className="relative shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-orange-500" size={18} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder="搜尋待辦事項..."
                            className="w-full pl-11 pr-4 py-3 bg-stone-50/50 border border-stone-100 rounded-2xl text-[13px] font-bold text-stone-600 focus:outline-none focus:bg-white focus:ring-2 focus:ring-stone-200 transition-all placeholder:text-stone-300 group"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 overflow-y-auto no-scrollbar pb-6 flex-1 min-h-0 relative z-0">
                        {filteredTodos.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-stone-400 animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 mb-6 rounded-[2rem] bg-stone-50 flex items-center justify-center border border-stone-100 shadow-inner rotate-3">
                                    <CheckCircle2 size={40} className="text-stone-300 -rotate-3" strokeWidth={2} />
                                </div>
                                <h3 className="text-[17px] font-black text-stone-800 mb-2">
                                    {searchTerm ? '找不到相符的任務' : '目前一切都搞定了'}
                                </h3>
                                <p className="text-[11px] font-black uppercase tracking-widest text-stone-400">
                                    {searchTerm ? '試試其他關鍵字吧！' : '享受一下沒有壓力的時刻，或者新增下一個任務！'}
                                </p>
                            </div>
                        ) : (
                            filteredTodos.map(todo => (
                                <div
                                    key={todo.id}
                                    className={`flex items-center justify-between p-4 px-5 rounded-[1.25rem] border transition-all duration-300 group ${todo.completed
                                        ? 'bg-stone-50/50 border-stone-200/50 opacity-60 hover:opacity-100 shadow-none'
                                        : 'bg-white border-stone-200 hover:border-orange-300 hover:shadow-[0_8px_30px_rgb(249,115,22,0.1)] hover:-translate-y-0.5'
                                        }`}
                                >
                                    {editingId === todo.id ? (
                                        <div className="flex-1 flex items-center gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                                            <input
                                                type="text"
                                                autoFocus
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                onBlur={saveEdit}
                                                className="flex-1 bg-stone-50 border border-orange-300 rounded-xl px-4 py-2.5 text-[15px] font-bold text-stone-800 focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all"
                                            />
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onMouseDown={(e) => { e.preventDefault(); saveEdit(); }} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                                                    <Check size={18} strokeWidth={3} />
                                                </button>
                                                <button onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }} className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors">
                                                    <X size={18} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className="flex items-center gap-4 cursor-pointer flex-1 min-w-0 py-1"
                                                onClick={() => toggleTodo(todo.id)}
                                            >
                                                <div className="shrink-0 relative w-6 h-6 flex items-center justify-center">
                                                    {todo.completed ? (
                                                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-in zoom-in duration-200 flex items-center justify-center shadow-md shadow-emerald-500/20">
                                                            <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    ) : (
                                                        <Circle size={24} className="text-stone-300 group-hover:text-orange-500/50 transition-colors" strokeWidth={2} />
                                                    )}
                                                </div>
                                                <div
                                                    className="flex flex-col min-w-0 flex-1 group/text"
                                                    onDoubleClick={(e) => { e.stopPropagation(); startEditing(e, todo); }}
                                                >
                                                    <span className={`text-[15px] font-bold truncate transition-all duration-300 select-none ${todo.completed ? 'text-stone-400 line-through decoration-stone-300 decoration-2' : 'text-stone-800'
                                                        }`}>
                                                        {todo.text}
                                                    </span>
                                                    <span className="text-[10px] font-black text-stone-400/80 uppercase tracking-widest mt-1 select-none">
                                                        新增於 {formatTime(todo.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => startEditing(e, todo)}
                                                    className="p-2.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-[1rem] transition-all shadow-sm border border-transparent hover:border-blue-100 mr-1"
                                                    title="編輯"
                                                >
                                                    <Edit2 size={16} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={() => deleteTodo(todo.id)}
                                                    className="p-2.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-[1rem] transition-all shadow-sm border border-transparent hover:border-rose-100"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </>
                                    )}
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
