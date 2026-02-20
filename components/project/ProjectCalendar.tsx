import React, { useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useProject } from '../../contexts/ProjectContext';
import { CalendarDays, Plus, Trash2, X } from 'lucide-react';
import { ProjectEvent } from '../../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
    'zh-TW': zhTW,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const ProjectCalendar: React.FC = () => {
    const { project, onUpdateEvents, isReadOnly } = useProject();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date(project.startDate || new Date()));

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<ProjectEvent> | null>(null);

    const events = useMemo(() => {
        const evts: any[] = [];

        // Add phases
        if (project.phases) {
            project.phases.forEach(p => {
                evts.push({
                    id: p.id,
                    title: `[階段] ${p.name}`,
                    start: new Date(p.startDate),
                    end: new Date(p.endDate),
                    allDay: true,
                    type: 'phase'
                });
            });
        }

        // Add work assignments (dispatches)
        if (project.workAssignments) {
            project.workAssignments.forEach(w => {
                evts.push({
                    id: w.id,
                    title: `[出勤] ${w.memberName}${w.isSpiderMan ? ' (繩索作業)' : ''}`,
                    start: new Date(w.date),
                    end: new Date(w.date),
                    allDay: true,
                    type: 'dispatch'
                });
            });
        }

        // Add custom events
        if (project.events) {
            project.events.forEach(e => {
                evts.push({
                    id: e.id,
                    title: e.title,
                    start: new Date(e.start),
                    end: new Date(e.end),
                    allDay: e.allDay !== false,
                    type: 'custom',
                    description: e.description,
                    color: e.color
                });
            });
        }

        return evts;
    }, [project.phases, project.workAssignments, project.events]);

    const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
        if (isReadOnly) return;
        setEditingEvent({
            title: '',
            start: start.toISOString(),
            end: end.toISOString(),
            allDay: true,
            type: 'general',
            color: '#10b981' // emerald-500 default
        });
        setIsEventModalOpen(true);
    };

    const handleSelectEvent = (event: any) => {
        if (isReadOnly) return;
        if (event.type === 'custom') {
            setEditingEvent({
                id: event.id,
                title: event.title,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                allDay: event.allDay,
                description: event.description,
                color: event.color
            });
            setIsEventModalOpen(true);
        }
    };

    const handleSaveEvent = () => {
        if (!editingEvent?.title) return;

        const newEvent: ProjectEvent = {
            id: editingEvent.id || crypto.randomUUID(),
            title: editingEvent.title,
            start: editingEvent.start || new Date().toISOString(),
            end: editingEvent.end || new Date().toISOString(),
            allDay: editingEvent.allDay !== false,
            description: editingEvent.description,
            color: editingEvent.color || '#10b981'
        };

        let updatedEvents = [...(project.events || [])];
        if (editingEvent.id) {
            updatedEvents = updatedEvents.map(e => e.id === editingEvent.id ? newEvent : e);
        } else {
            updatedEvents.push(newEvent);
        }

        onUpdateEvents?.(updatedEvents);
        setIsEventModalOpen(false);
        setEditingEvent(null);
    };

    const handleDeleteEvent = () => {
        if (!editingEvent?.id || !window.confirm('確定要刪除此事項嗎？')) return;
        const updatedEvents = (project.events || []).filter(e => e.id !== editingEvent.id);
        onUpdateEvents?.(updatedEvents);
        setIsEventModalOpen(false);
        setEditingEvent(null);
    };

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3b82f6'; // blue-500 for phases
        if (event.type === 'dispatch') backgroundColor = '#f59e0b'; // amber-500
        if (event.type === 'custom') backgroundColor = event.color || '#10b981'; // emerald-500
        return { style: { backgroundColor, borderRadius: '6px', opacity: 0.9, border: '0', color: 'white' } };
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[600px]">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={18} className="text-indigo-600" />
                        <h3 className="font-black text-sm uppercase tracking-widest text-stone-700">專案行事曆</h3>
                    </div>
                    {!isReadOnly && (
                        <button
                            onClick={() => {
                                setEditingEvent({ title: '', start: new Date().toISOString(), end: new Date().toISOString(), allDay: true, color: '#10b981' });
                                setIsEventModalOpen(true);
                            }}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={14} /> 新增事項
                        </button>
                    )}
                </div>

                <div className="p-4 flex-1 h-[600px]">
                    <style>{`
                        .rbc-calendar { height: 100% !important; min-height: 500px; }
                        .rbc-month-view { flex: 1 1 0%; }
                        .rbc-event { font-size: 10px; font-weight: bold; }
                    `}</style>
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%', fontFamily: 'inherit' }}
                        eventPropGetter={eventStyleGetter}
                        view={view}
                        onView={(v) => setView(v)}
                        date={date}
                        onNavigate={(d) => setDate(d)}
                        selectable={!isReadOnly}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={handleSelectEvent}
                        views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                        messages={{
                            next: "下一個",
                            previous: "上一個",
                            today: "今天",
                            month: "月曆",
                            week: "週曆",
                            agenda: "清單",
                            date: "日期",
                            time: "時間",
                            event: "事項",
                            noEventsInRange: "這段時間內沒有任何排程"
                        }}
                    />
                </div>
            </div>

            {/* Event Modal */}
            {isEventModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="pl-6 pr-4 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <h3 className="font-black text-lg text-stone-800 tracking-tight">
                                {editingEvent?.id ? '編輯事項' : '新增事項'}
                            </h3>
                            <button onClick={() => setIsEventModalOpen(false)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors active:scale-95">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">事項名稱</label>
                                <input
                                    type="text"
                                    value={editingEvent?.title || ''}
                                    onChange={e => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-stone-900"
                                    placeholder="例如：客戶會勘、材料進場"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">開始時間</label>
                                    <input
                                        type="datetime-local"
                                        step="1800"
                                        value={editingEvent?.start ? new Date(new Date(editingEvent.start).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                                        onChange={e => {
                                            if (!e.target.value) return;
                                            const d = new Date(e.target.value);
                                            setEditingEvent(prev => prev ? { ...prev, start: d.toISOString(), allDay: false } : null);
                                        }}
                                        className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">結束時間</label>
                                    <input
                                        type="datetime-local"
                                        step="1800"
                                        value={editingEvent?.end ? new Date(new Date(editingEvent.end).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                                        onChange={e => {
                                            if (!e.target.value) return;
                                            const d = new Date(e.target.value);
                                            setEditingEvent(prev => prev ? { ...prev, end: d.toISOString(), allDay: false } : null);
                                        }}
                                        className="w-full border-2 border-stone-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">標籤顏色</label>
                                <div className="flex gap-2">
                                    {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditingEvent(prev => prev ? { ...prev, color } : null)}
                                            className={`w-8 h-8 rounded-full ${editingEvent?.color === color ? 'ring-2 ring-offset-2 ring-stone-800' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1 uppercase tracking-wider">備註</label>
                                <textarea
                                    value={editingEvent?.description || ''}
                                    onChange={e => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:outline-none resize-none h-24"
                                    placeholder="其他備註資訊..."
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-between">
                            {editingEvent?.id ? (
                                <button
                                    onClick={handleDeleteEvent}
                                    className="flex items-center gap-2 text-rose-500 font-bold px-4 py-2 hover:bg-rose-50 rounded-xl transition-colors"
                                >
                                    <Trash2 size={16} /> 刪除
                                </button>
                            ) : <div></div>}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEventModalOpen(false)}
                                    className="px-6 py-2 rounded-xl text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={!editingEvent?.title}
                                    className="px-6 py-2 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    儲存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectCalendar;
