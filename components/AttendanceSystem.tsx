
import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock, Calendar, DollarSign, UserCheck, Users,
    ChevronRight, Download, Printer, Plus, Edit2,
    MoreVertical, CheckCircle, XCircle, AlertCircle,
    Search, Filter, Calculator, FileText, Briefcase
} from 'lucide-react';
import { TeamMember, AttendanceRecord, PayrollRecord, Project } from '../types';

interface AttendanceSystemProps {
    currentUser: any;
    teamMembers: TeamMember[];
    attendanceRecords: AttendanceRecord[];
    onClockIn: (notes?: string) => void;
    onClockOut: (notes?: string) => void;
    onUpdateAttendance: (record: AttendanceRecord) => void;
    onGeneratePayroll: (month: string) => void;
    payrollRecords: PayrollRecord[];
    onUpdatePayroll: (record: PayrollRecord) => void;
}

const AttendanceSystem: React.FC<AttendanceSystemProps> = ({
    currentUser, teamMembers, attendanceRecords,
    onClockIn, onClockOut, onUpdateAttendance,
    onGeneratePayroll, payrollRecords, onUpdatePayroll
}) => {
    const [activeTab, setActiveTab] = useState<'attendance' | 'payroll'>('attendance');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [currentTime, setCurrentTime] = useState(new Date());

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper: Get today's record for current user
    const todayStr = new Date().toISOString().split('T')[0];
    const myTodayRecord = attendanceRecords.find(r => r.userId === currentUser?.employeeId && r.date === todayStr);

    const isClockedIn = !!myTodayRecord?.checkInTime && !myTodayRecord?.checkOutTime;
    const isClockedOut = !!myTodayRecord?.checkOutTime;

    // Filter Records for View
    const filteredAttendance = useMemo(() => {
        return attendanceRecords.filter(r => r.date.startsWith(selectedMonth));
    }, [attendanceRecords, selectedMonth]);

    const filteredPayroll = useMemo(() => {
        return payrollRecords.filter(p => p.month === selectedMonth);
    }, [payrollRecords, selectedMonth]);

    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                        <Briefcase className="text-stone-800" />
                        人資管理系統
                    </h1>
                    <p className="text-stone-500 text-sm font-medium mt-1">考勤打卡與薪資結算中心</p>
                </div>

                <div className="bg-stone-100 p-1.5 rounded-2xl flex gap-1">
                    {[
                        { id: 'attendance', label: '考勤打卡', icon: Clock },
                        { id: 'payroll', label: '薪資計算', icon: DollarSign },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Attendance View */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Personal Clock-in Panel */}
                    <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all"></div>

                        <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-8 z-10">現在時間</h3>

                        <div className="text-6xl font-black tracking-tighter mb-2 z-10 tabular-nums">
                            {currentTime.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                            <span className="text-xl text-stone-500 ml-2 font-bold">{currentTime.getSeconds().toString().padStart(2, '0')}</span>
                        </div>
                        <p className="text-orange-400 font-bold mb-10 z-10">{currentTime.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>

                        <div className="w-full max-w-[200px] aspect-square rounded-full border-4 border-stone-800 p-2 mb-8 relative z-10">
                            <button
                                onClick={() => {
                                    if (isClockedOut) {
                                        alert('您今日已完成打卡 (已簽退)');
                                        return;
                                    }
                                    if (isClockedIn) onClockOut();
                                    else onClockIn();
                                }}
                                disabled={isClockedOut}
                                className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all active:scale-95 shadow-lg ${isClockedOut ? 'bg-stone-800 text-stone-500 cursor-not-allowed' :
                                        isClockedIn ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50' :
                                            'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-900/50'
                                    }`}
                            >
                                {isClockedOut ? (
                                    <>
                                        <CheckCircle size={32} className="mb-2" />
                                        <span className="text-xs font-black">今日已結束</span>
                                    </>
                                ) : isClockedIn ? (
                                    <>
                                        <LogOutIcon size={32} className="mb-2" />
                                        <span className="text-xs font-black">下班簽退</span>
                                    </>
                                ) : (
                                    <>
                                        <FingerprintIcon size={32} className="mb-2" />
                                        <span className="text-xs font-black">上班簽到</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {myTodayRecord && (
                            <div className="flex justify-between w-full px-4 text-xs font-bold text-stone-400 z-10">
                                <div>
                                    <p className="uppercase text-[10px] text-stone-600 mb-1">上班時間</p>
                                    <p className="text-white">{myTodayRecord.checkInTime ? new Date(myTodayRecord.checkInTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="uppercase text-[10px] text-stone-600 mb-1">下班時間</p>
                                    <p className="text-white">{myTodayRecord.checkOutTime ? new Date(myTodayRecord.checkOutTime).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Team Status Table */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-stone-900 text-lg flex items-center gap-2">
                                <Users className="text-orange-500" />
                                團隊考勤狀況
                            </h3>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-stone-200"
                            />
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-stone-100 text-left">
                                        <th className="pb-4 pl-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">日期</th>
                                        <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">人員</th>
                                        <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">上班</th>
                                        <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">下班</th>
                                        <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">工時</th>
                                        <th className="pb-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">狀態</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredAttendance.length > 0 ? filteredAttendance.map(record => {
                                        const workHours = record.checkInTime && record.checkOutTime
                                            ? ((new Date(record.checkOutTime).getTime() - new Date(record.checkInTime).getTime()) / (1000 * 60 * 60)).toFixed(1)
                                            : '-';

                                        return (
                                            <tr key={record.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors group">
                                                <td className="py-4 pl-4 font-bold text-stone-500">{record.date}</td>
                                                <td className="py-4 font-black text-stone-900">{record.userName}</td>
                                                <td className="py-4 font-medium text-stone-600">
                                                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="py-4 font-medium text-stone-600">
                                                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="py-4 font-bold text-stone-900">{workHours}h</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                                            record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-stone-100 text-stone-500'
                                                        }`}>
                                                        {record.status === 'Present' ? '準時' :
                                                            record.status === 'Late' ? '遲到' :
                                                                record.status === 'Absent' ? '缺勤' : record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-stone-400 font-bold">目前尚無考勤紀錄</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Payroll View */}
            {activeTab === 'payroll' && (
                <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm p-8 animate-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-bold text-lg outline-none focus:ring-2 focus:ring-stone-200"
                            />
                            <button
                                onClick={() => onGeneratePayroll(selectedMonth)}
                                className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-stone-200"
                            >
                                <Calculator size={16} />
                                一鍵試算本月薪資
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button className="p-3 hover:bg-stone-50 rounded-xl text-stone-400 hover:text-stone-900 transition-all">
                                <Printer size={20} />
                            </button>
                            <button className="p-3 hover:bg-stone-50 rounded-xl text-stone-400 hover:text-stone-900 transition-all">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="bg-stone-50 border-y border-stone-100">
                                    <th className="py-4 pl-6 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest rounded-l-2xl">員工姓名</th>
                                    <th className="py-4 text-left text-[10px] font-black text-stone-400 uppercase tracking-widest">計薪方式</th>
                                    <th className="py-4 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">底薪/時薪</th>
                                    <th className="py-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">出勤天數</th>
                                    <th className="py-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">工時小計</th>
                                    <th className="py-4 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">加班費</th>
                                    <th className="py-4 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest">津貼/扣款</th>
                                    <th className="py-4 pr-6 text-right text-[10px] font-black text-stone-400 uppercase tracking-widest rounded-r-2xl">實發金額</th>
                                    <th className="py-4 text-center text-[10px] font-black text-stone-400 uppercase tracking-widest">狀態</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {filteredPayroll.map(record => {
                                    const member = teamMembers.find(m => m.employeeId === record.userId);
                                    return (
                                        <tr key={record.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="py-5 pl-6 font-black text-stone-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                                    {member?.avatar ? <img src={member.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-300"></div>}
                                                </div>
                                                {record.userName}
                                            </td>
                                            <td className="py-5">
                                                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-md">
                                                    {member?.salaryType === 'Hourly' ? '時薪制' : member?.salaryType === 'Daily' ? '日薪制' : '月薪制'}
                                                </span>
                                            </td>
                                            <td className="py-5 text-right font-medium text-stone-600">
                                                ${record.baseSalary.toLocaleString()}
                                            </td>
                                            <td className="py-5 text-center font-bold text-stone-800">
                                                {record.workDays} 天
                                            </td>
                                            <td className="py-5 text-center font-bold text-stone-800">
                                                {record.workHours} hr
                                            </td>
                                            <td className="py-5 text-right font-medium text-emerald-600">
                                                +${record.overtimePay.toLocaleString()}
                                            </td>
                                            <td className="py-5 text-right font-medium text-stone-600">
                                                <span className="text-emerald-600 mr-2">+${record.allowance}</span>
                                                <span className="text-rose-500">-${record.deduction}</span>
                                            </td>
                                            <td className="py-5 pr-6 text-right">
                                                <span className="text-lg font-black text-stone-900 border-b-2 border-orange-200 pb-0.5">
                                                    ${record.totalAmount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-5 text-center">
                                                {record.status === 'Paid' ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                                        <CheckCircle size={12} /> 已發放
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => onUpdatePayroll({ ...record, status: 'Paid' })}
                                                        className="inline-flex items-center gap-1 text-[10px] font-black text-stone-400 bg-stone-100 hover:bg-stone-900 hover:text-white px-2 py-1 rounded-full uppercase tracking-wider transition-colors"
                                                    >
                                                        待確認
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredPayroll.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-stone-400">
                                                <FileText size={48} className="opacity-20" />
                                                <p className="font-bold">本月份尚未產生薪資單</p>
                                                <button
                                                    onClick={() => onGeneratePayroll(selectedMonth)}
                                                    className="text-orange-500 hover:underline font-bold text-sm"
                                                >
                                                    立即試算生成
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Icons wrapper to avoid import errors if not available instantly
const FingerprintIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6" /><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" /><path d="M8.65 22c.21-.66.45-1.32.57-2" /><path d="M9 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3" /><path d="M14.7 22c-.22-.66-.46-1.32-.58-2" /><path d="M16.24 7a6 6 0 0 1 3.8 5.67c0 1.62-.32 3.22-.65 4.88" /><path d="M19.5 19.5c-.27.84-.73 1.63-1.07 1.93" /><path d="M21.54 15H21.5" /><path d="M18.8 5c.67.67 1.2 1.5 1.7 2.6" /><path d="M13.6 3c1.3 0 2.6.4 3.8 1.2" /><path d="M6.6 3c1.3 0 2.6.4 3.8 1.2" /></svg>
);

const LogOutIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
);

export default AttendanceSystem;
