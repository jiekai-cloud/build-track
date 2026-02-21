import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, Event as RBCEvent, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Clock, User, HardHat, CheckCircle2, MapPin, Plus, Loader2, RefreshCw } from 'lucide-react';
import { Project, ApprovalRequest, TeamMember, Lead, SystemCalendarEvent, User as UserType } from '../types';
import { googleCalendarService } from '../services/googleCalendarService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTaiwanHolidays } from '../hooks/useTaiwanHolidays';
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

interface CalendarViewProps {
    projects: Project[];
    approvalRequests: ApprovalRequest[];
    teamMembers: TeamMember[];
    leads?: Lead[];
    calendarEvents?: SystemCalendarEvent[];
    setCalendarEvents?: React.Dispatch<React.SetStateAction<SystemCalendarEvent[]>>;
    user: UserType;
    isCloudConnected: boolean;
    onUpdateProject?: (id: string, updates: Partial<Project>) => void;
    onDeleteProject?: (id: string) => void;
    onEditProjectClick?: (project: Project) => void;
}

interface CustomEvent extends RBCEvent {
    id: string;
    type: 'project' | 'payment' | 'leave' | 'visit' | 'custom' | 'dispatch';
    raw?: any;
    color: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, approvalRequests, teamMembers, leads = [], calendarEvents = [], setCalendarEvents, user, isCloudConnected, onUpdateProject, onDeleteProject, onEditProjectClick }) => {
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const holidays = useTaiwanHolidays(date.getFullYear());

    const [filter, setFilter] = useState({
        projects: true,
        payments: true,
        leaves: true,
        visits: true,
        dispatches: true,
        custom: true,
        hiddenProjects: false
    });

    const [onlyMyEvents, setOnlyMyEvents] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);

    // Create Event Form
    const [newEvent, setNewEvent] = useState<Partial<SystemCalendarEvent>>({ title: '', startDate: '', endDate: '', type: 'meeting', description: '', linkedProjectId: '' });
    const [isSaving, setIsSaving] = useState(false);

    const events: CustomEvent[] = useMemo(() => {
        const _events: CustomEvent[] = [];

        // 1. Projects (Spanning Events)
        if (filter.projects) {
            projects.forEach(p => {
                if (!p.startDate) return;

                // My view filter
                if (onlyMyEvents && p.manager !== user.name && p.quotationManager !== user.name && p.engineeringManager !== user.name) {
                    return;
                }

                if (p.hideInCalendar && !filter.hiddenProjects) return;

                const start = new Date(p.startDate);
                let end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

                // End date adjustment for all-day spanning
                end.setHours(23, 59, 59);

                _events.push({
                    id: `p - ${p.id} `,
                    title: `[專案🚧] ${p.id} ${p.name}`,
                    start: start,
                    end: end,
                    allDay: true,
                    type: 'project',
                    color: 'bg-emerald-500',
                    raw: p
                });
            });
        }

        // 1.5 Project Payments & Inspection (Reminders)
        if (filter.payments) {
            projects.forEach(p => {
                if (onlyMyEvents && p.manager !== user.name && p.quotationManager !== user.name && p.engineeringManager !== user.name) return;

                if (p.payments) {
                    p.payments.filter(pm => pm.date).forEach(pm => {
                        const d = new Date(pm.date);
                        _events.push({
                            id: `pm - ${pm.id} `,
                            title: `💰請款: ${p.name} (${pm.label})`,
                            start: d,
                            end: d,
                            allDay: true,
                            type: 'payment',
                            color: pm.status === 'paid' ? 'bg-amber-400' : 'bg-red-500',
                            raw: pm
                        });
                    });
                }
            });
        }

        // 2. Dispatches (Team Work Assignments)
        if (filter.dispatches) {
            projects.forEach(p => {
                if (p.workAssignments) {
                    p.workAssignments.forEach(wa => {
                        if (onlyMyEvents && wa.memberId !== user.id && wa.memberName !== user.name) return;

                        const d = new Date(wa.date);
                        _events.push({
                            id: `wa - ${wa.id} -${d.getTime()} `,
                            title: `👷派工: ${wa.memberName} - ${p.name} `,
                            start: d,
                            end: d,
                            allDay: true,
                            type: 'dispatch',
                            color: 'bg-indigo-500',
                            raw: { wa, project: p }
                        });
                    });
                }
            });
        }

        // 3. Leaves (Approved only)
        if (filter.leaves) {
            approvalRequests
                .filter(req => req.status === 'approved' && req.templateId === 'TPL-LEAVE')
                .forEach(req => {
                    const content = req.formData || {};
                    if (!content.startDate || !content.endDate) return;

                    const member = teamMembers.find(m => m.id === req.requesterId);
                    if (onlyMyEvents && req.requesterId !== user.id) return;

                    const name = member ? member.name : req.requesterName;

                    _events.push({
                        id: `leave - ${req.id} `,
                        title: `🏖️${content.type || '請假'}: ${name} `,
                        start: new Date(content.startDate),
                        end: new Date(content.endDate),
                        allDay: true,
                        type: 'leave',
                        color: 'bg-amber-500',
                        raw: req
                    });
                });
        }

        // 4. Site Visits (Leads)
        if (filter.visits && leads) {
            leads.forEach(lead => {
                if (!lead.timestamp) return;
                const d = new Date(lead.timestamp);
                if (isNaN(d.getTime())) return;

                // Leaves are generally unassigned until converted, but could filter by creator if tracked

                _events.push({
                    id: `lead - ${lead.id} `,
                    title: `📍會勘: ${lead.customerName} `,
                    start: d,
                    end: new Date(d.getTime() + 60 * 60 * 1000), // 1 hour duration
                    allDay: false,
                    type: 'visit',
                    color: 'bg-purple-500',
                    raw: lead
                });
            });
        }

        // 5. Custom Events
        if (filter.custom && calendarEvents) {
            calendarEvents.forEach(cev => {
                if (onlyMyEvents && cev.createdBy !== user.id) return;

                _events.push({
                    id: `custom - ${cev.id} `,
                    title: `📅 ${cev.title} `,
                    start: new Date(cev.startDate),
                    end: new Date(cev.endDate),
                    allDay: false, // Could be true based on duration or explicit flag
                    type: 'custom',
                    color: 'bg-sky-500',
                    raw: cev
                });
            });
        }

        return _events;
    }, [projects, approvalRequests, teamMembers, leads, calendarEvents, filter, onlyMyEvents, user]);

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        // Pre-fill modal
        let formattedStr = slotInfo.start.toLocaleDateString('sv-SE');
        let formattedEndStr = slotInfo.end.toLocaleDateString('sv-SE');

        // If selecting all day, default to current time for datetime-local
        if (slotInfo.start.getHours() === 0 && slotInfo.end.getHours() === 0) {
            const now = new Date();
            formattedStr = `${formattedStr}T${now.toTimeString().substring(0, 5)} `;
            formattedEndStr = `${formattedEndStr}T${now.toTimeString().substring(0, 5)} `;
        } else {
            formattedStr = `${formattedStr}T${slotInfo.start.toTimeString().substring(0, 5)} `;
            formattedEndStr = `${formattedEndStr}T${slotInfo.end.toTimeString().substring(0, 5)} `;
        }

        setNewEvent({ ...newEvent, title: '', startDate: formattedStr, endDate: formattedEndStr });
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleSelectEvent = (event: CustomEvent) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveCustomEvent = async () => {
        if (!newEvent.title || !newEvent.startDate) return alert('請填寫標題與時間');
        setIsSaving(true);

        try {
            const ev: SystemCalendarEvent = {
                id: `evt - ${Date.now()} `,
                title: newEvent.title,
                startDate: new Date(newEvent.startDate as string).toISOString(),
                endDate: new Date(newEvent.endDate as string || newEvent.startDate as string).toISOString(),
                type: newEvent.type || 'meeting',
                description: newEvent.description,
                linkedProjectId: newEvent.linkedProjectId,
                createdAt: new Date().toISOString(),
                createdBy: user.id || 'unknown',
                updatedAt: new Date().toISOString()
            };

            // Attempt Google Calendar Sync
            if (isCloudConnected) {
                const gId = await googleCalendarService.syncEventToGoogle(ev);
                if (gId) ev.googleEventId = gId;
            }

            if (setCalendarEvents) {
                setCalendarEvents((prev: SystemCalendarEvent[]) => [...prev, ev]);
            }

            setIsModalOpen(false);
            setNewEvent({ title: '', startDate: '', endDate: '', type: 'meeting', description: '', linkedProjectId: '' });
        } catch (e) {
            console.error('Error saving event', e);
            alert('儲存失敗');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteEvent = async (id: string, googleEventId?: string) => {
        if (!confirm('確定要刪除此自訂行程？')) return;
        setIsSaving(true);
        try {
            if (googleEventId && isCloudConnected) {
                await googleCalendarService.deleteEventFromGoogle(googleEventId);
            }
            if (setCalendarEvents) {
                setCalendarEvents((prev: SystemCalendarEvent[]) => prev.filter(e => e.id !== id));
            }
            setIsModalOpen(false);
        } catch (e) {
            console.error('Delete Event Error', e);
        } finally {
            setIsSaving(false);
        }
    };

    const eventStyleGetter = (event: CustomEvent) => {
        const colorClassMap: Record<string, string> = {
            'bg-emerald-500': '#10b981',
            'bg-rose-500': '#f43f5e',
            'bg-amber-400': '#fbbf24',
            'bg-amber-500': '#f59e0b',
            'bg-red-500': '#ef4444',
            'bg-indigo-500': '#6366f1',
            'bg-purple-500': '#a855f7',
            'bg-sky-500': '#0ea5e9'
        };

        const hex = colorClassMap[event.color] || '#3b82f6';

        return {
            style: {
                backgroundColor: hex,
                borderColor: hex,
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                opacity: 0.9,
                fontWeight: 'bold',
                fontSize: '0.75rem',
                padding: '2px 6px',
                display: 'block'
            }
        };
    };

    const customComponents = useMemo(() => ({
        month: {
            dateHeader: ({ date: d, label }: any) => {
                const dateStr = format(d, 'yyyyMMdd');
                const holidayInfo = holidays[dateStr];
                const isHoliday = holidayInfo?.isHoliday;

                return (
                    <span
                        title={holidayInfo?.description || ''}
                        className={`cursor-default font-bold ${isHoliday ? 'text-red-500' : 'text-stone-700'}`}
                        style={{ padding: '2px 4px' }}
                    >
                        {isHoliday && holidayInfo?.description ? <span className="text-[10px] mr-1 opacity-80">{holidayInfo.description}</span> : null}
                        {label}
                    </span>
                );
            }
        }
    }), [holidays]);

    return (
        <div className="h-full flex flex-col gap-4 p-4 lg:p-6 bg-[#fafaf9] overflow-hidden">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-stone-800 flex items-center gap-3">
                        <CalendarIcon className="text-orange-500" size={32} />
                        行事曆
                        {isCloudConnected && (
                            <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 ml-2 shadow-sm">
                                <RefreshCw size={10} /> Google日曆同步中
                            </span>
                        )}
                    </h1>
                    <p className="text-stone-500 mt-1 text-sm">管理專案行程、人力派工與個人日程</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:gap-4 w-full lg:w-auto">
                    <button
                        onClick={() => {
                            const now = new Date();
                            const ds = now.toLocaleDateString('sv-SE') + 'T' + now.toTimeString().substring(0, 5);
                            setNewEvent({ ...newEvent, title: '', startDate: ds, endDate: ds });
                            setSelectedEvent(null);
                            setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs lg:text-sm flex items-center gap-2 shadow-lg shadow-orange-600/20 transition-all flex-1 lg:flex-none justify-center"
                    >
                        <Plus size={16} /> 新增行程
                    </button>

                    <button
                        onClick={() => setOnlyMyEvents(!onlyMyEvents)}
                        className={`px - 4 py - 2 rounded - xl font - bold text - xs lg: text - sm border transition - all flex - 1 lg: flex - none justify - center flex items - center gap - 2 ${onlyMyEvents ? 'bg-stone-900 border-stone-800 text-white shadow-xl' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'} `}
                    >
                        <User size={16} /> 只看我
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-stone-200 shrink-0">
                <Filter size={16} className="text-stone-400 ml-2 hidden lg:block" />

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-700">
                    <input type="checkbox" checked={filter.projects} onChange={e => setFilter(prev => ({ ...prev, projects: e.target.checked }))} className="rounded text-emerald-500 focus:ring-emerald-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> <span className="font-bold">工程期間</span>
                </label>

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-700">
                    <input type="checkbox" checked={filter.dispatches} onChange={e => setFilter(prev => ({ ...prev, dispatches: e.target.checked }))} className="rounded text-indigo-500 focus:ring-indigo-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> <span className="font-bold">派工派遣</span>
                </label>

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-700">
                    <input type="checkbox" checked={filter.payments} onChange={e => setFilter(prev => ({ ...prev, payments: e.target.checked }))} className="rounded text-red-500 focus:ring-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> <span className="font-bold">請款提醒</span>
                </label>

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-700">
                    <input type="checkbox" checked={filter.leaves} onChange={e => setFilter(prev => ({ ...prev, leaves: e.target.checked }))} className="rounded text-amber-500 focus:ring-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> <span className="font-bold">團隊休假</span>
                </label>

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-700">
                    <input type="checkbox" checked={filter.visits} onChange={e => setFilter(prev => ({ ...prev, visits: e.target.checked }))} className="rounded text-purple-500 focus:ring-purple-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> <span className="font-bold">待確認會勘</span>
                </label>

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-700">
                    <input type="checkbox" checked={filter.custom} onChange={e => setFilter(prev => ({ ...prev, custom: e.target.checked }))} className="rounded text-sky-500 focus:ring-sky-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div> <span className="font-bold">自訂行程</span>
                </label>

                <div className="w-px h-6 bg-stone-200 mx-2 hidden lg:block"></div>

                <label className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer text-xs lg:text-sm transition-all text-stone-500">
                    <input type="checkbox" checked={filter.hiddenProjects} onChange={e => setFilter(prev => ({ ...prev, hiddenProjects: e.target.checked }))} className="rounded text-stone-400 focus:ring-stone-400" />
                    <span className="font-bold">顯示已隱藏的專案</span>
                </label>
            </div>

            {/* Calendar Main Grid */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-4 border border-stone-100 overflow-hidden min-h-[600px] flex flex-col"
                style={{
                    // Inline override for react-big-calendar to blend in seamlessly
                    '--rbc-font': 'inherit',
                } as any}>
                <style>{`
                  .rbc-calendar { height: 100% !important; min-height: 500px; }
                  .rbc-month-view { flex: 1 1 0%; }
                `}</style>
                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', fontFamily: 'inherit' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    components={customComponents}
                    view={view}
                    onView={(newView) => setView(newView)}
                    date={date}
                    onNavigate={(newDate) => setDate(newDate)}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    messages={{
                        next: "下一個",
                        previous: "上一個",
                        today: "今天",
                        month: "月曆",
                        week: "週曆",
                        day: "日曆",
                        agenda: "清單",
                        date: "日期",
                        time: "時間",
                        event: "行程事項",
                        noEventsInRange: "這段時間內沒有任何行程"
                    }}
                />
            </div>

            {/* Event Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        {selectedEvent && selectedEvent.type !== 'custom' ? (
                            // View Only Mode (for non-custom events)
                            <div className="flex flex-col">
                                <div className={`p - 6 ${selectedEvent.color.replace('bg-', 'bg-').replace('-500', '-600')} text - white`}>
                                    <h3 className="text-xl font-black">{selectedEvent.title}</h3>
                                    <p className="opacity-90 text-sm mt-1">{selectedEvent.start.toLocaleString()} - {selectedEvent.end.toLocaleString()}</p>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-4">
                                    <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-sm text-stone-700 font-medium">
                                        <p><strong>類型類別：</strong> {selectedEvent.type.toUpperCase()}</p>
                                        <p><strong>資料識別碼：</strong> {selectedEvent.id}</p>
                                        {selectedEvent.type === 'project' && selectedEvent.raw?.client && (
                                            <p><strong>業主客戶：</strong> {selectedEvent.raw.client}</p>
                                        )}
                                        {selectedEvent.raw?.description && (
                                            <p className="pt-2 border-t border-stone-200">{selectedEvent.raw.description}</p>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-stone-200">
                                        <div className="flex gap-2">
                                            {selectedEvent.type === 'project' && onUpdateProject && (
                                                <button
                                                    onClick={() => {
                                                        const p = selectedEvent.raw as Project;
                                                        onUpdateProject(p.id, { hideInCalendar: !p.hideInCalendar });
                                                        setIsModalOpen(false);
                                                    }}
                                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${selectedEvent.raw?.hideInCalendar ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                                                >
                                                    {selectedEvent.raw?.hideInCalendar ? '取消隱藏' : '從行事曆隱藏'}
                                                </button>
                                            )}
                                            {selectedEvent.type === 'project' && onEditProjectClick && (
                                                <button
                                                    onClick={() => {
                                                        onEditProjectClick(selectedEvent.raw as Project);
                                                        setIsModalOpen(false);
                                                    }}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    編輯專案
                                                </button>
                                            )}
                                            {selectedEvent.type === 'project' && onDeleteProject && (
                                                <button
                                                    onClick={() => {
                                                        onDeleteProject(selectedEvent.raw.id);
                                                        setIsModalOpen(false);
                                                    }}
                                                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    刪除專案
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-all">關閉</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Edit/Create Mode (for Custom Events)
                            <div className="flex flex-col">
                                <div className="p-6 bg-stone-900 text-white flex justify-between items-center">
                                    <h3 className="text-xl font-black">{selectedEvent ? '查看自訂行程' : '新增自訂行程'}</h3>
                                </div>

                                <div className="p-6 overflow-y-auto space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-stone-500 uppercase">行程標題 <span className="text-red-500">*</span></label>
                                        <input
                                            value={selectedEvent ? selectedEvent.raw.title : newEvent.title}
                                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                            disabled={!!selectedEvent}
                                            className="w-full border border-stone-200 rounded-xl px-4 py-3 font-bold focus:ring-2 disabled:bg-stone-50"
                                            placeholder="請輸入行程主旨"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-stone-500 uppercase">開始時間</label>
                                            <input
                                                type="datetime-local"
                                                value={selectedEvent ? new Date(selectedEvent.raw.startDate).toLocaleString('sv-SE').replace(' ', 'T') : newEvent.startDate}
                                                onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
                                                disabled={!!selectedEvent}
                                                className="w-full border border-stone-200 rounded-xl px-3 py-3 font-medium text-sm disabled:bg-stone-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-stone-500 uppercase">結束時間</label>
                                            <input
                                                type="datetime-local"
                                                value={selectedEvent ? new Date(selectedEvent.raw.endDate).toLocaleString('sv-SE').replace(' ', 'T') : newEvent.endDate}
                                                onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })}
                                                disabled={!!selectedEvent}
                                                className="w-full border border-stone-200 rounded-xl px-3 py-3 font-medium text-sm disabled:bg-stone-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-stone-500 uppercase">行程分類</label>
                                        <select
                                            value={selectedEvent ? selectedEvent.raw.type : newEvent.type}
                                            onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                            disabled={!!selectedEvent}
                                            className="w-full border border-stone-200 rounded-xl px-4 py-3 font-bold disabled:bg-stone-50"
                                        >
                                            <option value="meeting">內部會議</option>
                                            <option value="visit">外出會勘</option>
                                            <option value="inspection">查驗</option>
                                            <option value="milestone">重要里程碑</option>
                                            <option value="other">其他</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-stone-500 uppercase">關聯專案 (可選)</label>
                                        <select
                                            value={selectedEvent ? selectedEvent.raw.linkedProjectId || '' : newEvent.linkedProjectId || ''}
                                            onChange={e => setNewEvent({ ...newEvent, linkedProjectId: e.target.value })}
                                            disabled={!!selectedEvent}
                                            className="w-full border border-stone-200 rounded-xl px-4 py-3 font-bold disabled:bg-stone-50"
                                        >
                                            <option value="">-- 無關聯專案 --</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {isCloudConnected && !selectedEvent && (
                                        <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="w-5 h-5" />
                                            <span className="text-xs font-bold leading-tight">此行程儲存後，將會自動雙向同步至您的 Google 行事曆。</span>
                                        </div>
                                    )}

                                </div>

                                <div className="p-4 border-t border-stone-100 flex items-center justify-between gap-3 bg-stone-50">
                                    {selectedEvent ? (
                                        <>
                                            {selectedEvent.raw.createdBy === user.id ? (
                                                <button disabled={isSaving} onClick={() => handleDeleteEvent(selectedEvent.raw.id, selectedEvent.raw.googleEventId)} className="text-sm font-bold text-red-500 hover:text-red-700 py-2.5 px-4 rounded-xl hover:bg-red-50 transition-colors">刪除</button>
                                            ) : (
                                                <div></div>
                                            )}
                                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold rounded-xl transition-all shadow-sm">關閉</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 font-bold rounded-xl transition-all shadow-sm">取消</button>
                                            <button disabled={isSaving} onClick={handleSaveCustomEvent} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2">
                                                {isSaving && <Loader2 size={16} className="animate-spin" />} 儲存行程
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
