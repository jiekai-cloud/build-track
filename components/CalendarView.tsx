import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Clock, User, HardHat, CheckCircle2, MapPin } from 'lucide-react';
import { Project, ApprovalRequest, TeamMember, Lead } from '../types';

interface CalendarViewProps {
    projects: Project[];
    approvalRequests: ApprovalRequest[];
    teamMembers: TeamMember[];
    leads?: Lead[];
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'project_start' | 'project_end' | 'project_ongoing' | 'leave' | 'visit';
    color: string;
    data: any;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, approvalRequests, teamMembers, leads = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filter, setFilter] = useState({
        projects: true,
        leaves: true,
        visits: true
    });

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const events = useMemo(() => {
        const allEvents: CalendarEvent[] = [];

        // 1. Projects
        if (filter.projects) {
            projects.forEach(p => {
                if (!p.startDate) return;
                const start = new Date(p.startDate);
                const end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days if no end

                // Project Start
                allEvents.push({
                    id: `p-start-${p.id}`,
                    title: `開工: ${p.name}`,
                    start: start,
                    end: start,
                    type: 'project_start',
                    color: 'bg-emerald-500',
                    data: p
                });

                // Project End
                if (p.endDate) {
                    allEvents.push({
                        id: `p-end-${p.id}`,
                        title: `完工: ${p.name}`,
                        start: end,
                        end: end,
                        type: 'project_end',
                        color: 'bg-rose-500',
                        data: p
                    });
                }
            });
        }

        // 2. Leaves (Approved only)
        if (filter.leaves) {
            approvalRequests
                .filter(req => req.status === 'Approved' && req.templateId === 'TPL-LEAVE')
                .forEach(req => {
                    const content = req.content as any;
                    if (!content.startDate || !content.endDate) return;

                    const member = teamMembers.find(m => m.id === req.applicantId);
                    const name = member ? member.name : req.applicantId;

                    allEvents.push({
                        id: `leave-${req.id}`,
                        title: `${content['假別'] || '請假'}: ${name}`,
                        start: new Date(content.startDate),
                        end: new Date(content.endDate),
                        type: 'leave',
                        color: 'bg-amber-500',
                        data: req
                    });
                });
        }

        // 3. Site Visits (Leads)
        if (filter.visits && leads) {
            leads.forEach(lead => {
                // timestamp format check
                if (!lead.timestamp) return;

                const date = new Date(lead.timestamp);
                if (isNaN(date.getTime())) return;

                allEvents.push({
                    id: `lead-${lead.id}`,
                    title: `會勘: ${lead.customerName}`,
                    start: date,
                    end: date,
                    type: 'visit',
                    color: 'bg-purple-500',
                    data: lead
                });
            });
        }

        return allEvents;
    }, [projects, approvalRequests, teamMembers, leads, filter]);

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const blanks = Array(firstDay).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const allCells = [...blanks, ...days];

        return (
            <div className="grid grid-cols-7 gap-1 bg-stone-200 p-1 rounded-xl">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <div key={d} className="h-10 flex items-center justify-center font-bold text-stone-500">{d}</div>
                ))}
                {allCells.map((day, index) => {
                    if (!day) return <div key={`blank-${index}`} className="h-32 bg-stone-100/50 rounded-lg"></div>;

                    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = events.filter(e => {
                        const startStr = e.start.toISOString().split('T')[0];
                        const endStr = e.end.toISOString().split('T')[0];
                        return dateStr >= startStr && dateStr <= endStr;
                    });

                    const isToday = new Date().toISOString().split('T')[0] === dateStr;

                    return (
                        <div key={day} className={`h-32 bg-white rounded-lg p-2 border transition-all hover:shadow-md overflow-y-auto no-scrollbar ${isToday ? 'border-orange-500 ring-2 ring-orange-100' : 'border-stone-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-bold ${isToday ? 'bg-orange-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-stone-700'}`}>
                                    {day}
                                </span>
                                {dayEvents.length > 0 && <span className="text-[10px] bg-stone-100 px-1.5 rounded-full text-stone-500">{dayEvents.length}</span>}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.map(e => (
                                    <div key={e.id} className={`text-[10px] px-1.5 py-1 rounded truncate text-white cursor-pointer hover:opacity-80 shadow-sm ${e.color}`}>
                                        {e.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
        <div className="h-full flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-stone-800 flex items-center gap-3">
                        <CalendarIcon className="text-orange-500" size={32} />
                        行事曆
                    </h1>
                    <p className="text-stone-500 mt-1">管理專案日程、團隊休假與會刊安排</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-xl shadow-sm border border-stone-200 p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"><ChevronLeft size={20} /></button>
                        <div className="px-4 flex items-center font-bold text-lg text-stone-800 min-w-[140px] justify-center">
                            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"><ChevronRight size={20} /></button>
                    </div>

                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-900 transition-colors shadow-lg shadow-stone-900/20"
                    >
                        今天
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-stone-100 w-fit">
                <Filter size={16} className="text-stone-400 ml-2" />
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input type="checkbox" checked={filter.projects} onChange={e => setFilter(prev => ({ ...prev, projects: e.target.checked }))} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm font-bold text-stone-600">專案日程</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input type="checkbox" checked={filter.leaves} onChange={e => setFilter(prev => ({ ...prev, leaves: e.target.checked }))} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm font-bold text-stone-600">請假紀錄</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                </label>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-stone-50 cursor-pointer">
                    <input type="checkbox" checked={filter.visits} onChange={e => setFilter(prev => ({ ...prev, visits: e.target.checked }))} className="rounded text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm font-bold text-stone-600">會勘安排</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                </label>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-6 border border-white overflow-hidden flex flex-col">
                {renderCalendar()}

                {/* Legend */}
                <div className="mt-4 flex gap-6 text-xs text-stone-500 px-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div> 專案開工</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500"></div> 專案完工</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500"></div> 人員休假</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500"></div> 會勘/潛在客戶</div>
                </div>
            </div>
        </div>
    );
};
