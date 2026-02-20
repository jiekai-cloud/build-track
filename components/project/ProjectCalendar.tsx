import React, { useState, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useProject } from '../../contexts/ProjectContext';
import { CalendarDays } from 'lucide-react';
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
    const { project } = useProject();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date(project.startDate || new Date()));

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

        return evts;
    }, [project.phases, project.workAssignments]);

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3b82f6'; // blue-500 for phases
        if (event.type === 'dispatch') backgroundColor = '#f59e0b'; // amber-500
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
        </div>
    );
};

export default ProjectCalendar;
