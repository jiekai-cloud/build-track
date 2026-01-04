
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import {
  LayoutDashboard, FolderKanban, Users, BarChart3, TrendingUp,
  AlertCircle, Clock, CheckCircle2, DollarSign, ArrowUpRight,
  ArrowDownRight, Activity, ShieldAlert, Zap, ExternalLink,
  Sparkles, Phone, MapPin, FileWarning, CalendarDays, AlertTriangle,
  Layers, Target, ArrowRight, Briefcase
} from 'lucide-react';
import { Project, ProjectStatus, Lead } from '../types';

interface DashboardProps {
  projects: Project[];
  leads?: Lead[];
  onConvertLead?: (leadId: string) => void;
  onProjectClick: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, leads = [], onConvertLead, onProjectClick }) => {
  const [lastSync, setLastSync] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableYears = useMemo(() => {
    const years = projects
      .map(p => p.startDate ? p.startDate.split('-')[0] : null)
      .filter(Boolean);
    const uniqueYears = (Array.from(new Set(years)) as string[]).sort((a, b) => b.localeCompare(a));
    return uniqueYears;
  }, [projects]);

  const months = [
    { value: '01', label: '1月' }, { value: '02', label: '2月' }, { value: '03', label: '3月' },
    { value: '04', label: '4月' }, { value: '05', label: '5月' }, { value: '06', label: '6月' },
    { value: '07', label: '7月' }, { value: '08', label: '8月' }, { value: '09', label: '9月' },
    { value: '10', label: '10月' }, { value: '11', label: '11月' }, { value: '12', label: '12月' },
  ];

  // 1. 高效過濾：在大數據量下僅在必要時重新計算
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (!p.startDate) return false;
      const [pYear, pMonth] = p.startDate.split('-');
      const matchYear = selectedYear === 'all' || pYear === selectedYear;
      const matchMonth = selectedMonth === 'all' || pMonth === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [projects, selectedYear, selectedMonth]);

  // 2. 統計數據聚合
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalBudget = 0;
    let totalSpent = 0;

    filteredProjects.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
      totalBudget += p.budget;
      totalSpent += p.spent;
    });

    return { counts, totalBudget, totalSpent };
  }, [filteredProjects]);

  // 3. 異常檢測：抓取滯留與「預算超支」案件
  const riskProjects = useMemo(() => {
    const now = new Date();

    const timeRisks = filteredProjects
      .filter(p => (p.statusChangedAt || p.createdDate) && (p.status === ProjectStatus.NEGOTIATING || p.status === ProjectStatus.QUOTING))
      .map(p => {
        const statusTime = p.statusChangedAt || p.createdDate;
        const diff = now.getTime() - new Date(statusTime!).getTime();
        return { ...p, riskType: 'delay', riskValue: Math.floor(diff / (1000 * 60 * 60 * 24)) };
      })
      .filter(p => p.riskValue >= 5);

    // 財務風險
    const financialRisks = filteredProjects
      .filter(p => p.budget > 0)
      .map(p => {
        const ratio = p.spent / p.budget;
        return { ...p, riskType: 'budget', riskValue: Math.round(ratio * 100) };
      })
      .filter(p => p.riskValue >= 80);

    return [...timeRisks, ...financialRisks]
      .sort((a, b) => b.riskValue - a.riskValue);
  }, [filteredProjects]);

  const overdueByManager = useMemo(() => {
    const overdueOnes = riskProjects.filter(r => r.riskType === 'delay');
    const counts: Record<string, number> = {};
    overdueOnes.forEach(p => {
      const manager = p.quotationManager || '未指定';
      counts[manager] = (counts[manager] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [riskProjects]);

  const statsCards = [
    { label: '案件總量', value: filteredProjects.length, icon: Layers, color: 'text-slate-600', bg: 'bg-slate-50' },
    {
      label: '報價逾期',
      value: riskProjects.filter(r => r.riskType === 'delay').length,
      icon: FileWarning,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    { label: '施工進行中', value: stats.counts[ProjectStatus.CONSTRUCTING] || 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '執行週轉率', value: `${filteredProjects.length > 0 ? Math.round(((stats.counts[ProjectStatus.COMPLETED] || 0) / filteredProjects.length) * 100) : 0}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-black text-stone-900 tracking-tight">生活品質 • 智慧指揮中心</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-white rounded-full">
              <Sparkles size={12} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Scale Optimized</span>
            </div>
          </div>
          <p className="text-stone-500 text-xs font-medium">數據規模：{projects.length} 案場 | 最後運算：{lastSync.toLocaleTimeString()}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-stone-100">
            <CalendarDays size={14} className="text-stone-400" />
            <select className="bg-transparent text-xs font-bold outline-none cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">全年度</option>
              {availableYears.map(year => <option key={year} value={year}>{year}年</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 px-3">
            <Clock size={14} className="text-stone-400" />
            <select className="bg-transparent text-xs font-bold outline-none cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="all">全月份</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statsCards.map((stat, i) => (
          <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-lg hover:border-stone-200 transition-all group">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-stone-900 leading-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">

          {/* 報價逾期績效報告 (New Section) */}
          <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="px-8 py-6 border-b border-stone-50 flex items-center justify-between bg-stone-50/30">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                <FileWarning size={18} className="text-rose-600" /> 報價逾期追蹤與人員績效
              </h3>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 uppercase">
                當前共 {riskProjects.filter(r => r.riskType === 'delay').length} 案逾期
              </span>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Overdue List */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">逾期案件清單</h4>
                <div className="space-y-2">
                  {riskProjects.filter(r => r.riskType === 'delay').map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-stone-100/50 transition-all group">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-stone-900">{p.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-stone-400 uppercase">ID: {p.id}</span>
                          <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase flex items-center gap-1">
                            逾期 {p.riskValue} 天
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div className="hidden sm:block">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter mb-0.5">負責人</p>
                          <p className="text-[10px] font-black text-stone-700">{p.quotationManager || '未指定'}</p>
                        </div>
                        <button onClick={() => onProjectClick(p.id)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-400 transition-all shadow-sm">
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {riskProjects.filter(r => r.riskType === 'delay').length === 0 && (
                    <div className="py-12 border-2 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center text-stone-300 gap-3">
                      <CheckCircle2 size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">目前暫無逾期報價</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Manager Ranking */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">負責人逾期統計</h4>
                <div className="bg-stone-900 rounded-3xl p-6 text-white space-y-4">
                  {overdueByManager.map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-rose-500 text-white' : 'bg-white/10 text-stone-400'}`}>
                          {i + 1}
                        </span>
                        <span className="text-[11px] font-black">{m.name}</span>
                      </div>
                      <span className="text-[11px] font-black text-rose-400">{m.count} 案</span>
                    </div>
                  ))}
                  {overdueByManager.length === 0 && (
                    <p className="text-[10px] text-stone-500 font-bold text-center py-4">無數據可統計</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-stone-100 shadow-sm">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 mb-4 sm:mb-6 lg:mb-8 uppercase tracking-widest border-l-4 border-orange-500 pl-3 sm:pl-4">全案場狀態分佈矩陣</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {Object.values(ProjectStatus).map((status) => (
                <div key={status} className="bg-stone-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center text-center min-h-[70px] sm:min-h-[80px]">
                  <span className="text-base sm:text-lg lg:text-xl font-black text-stone-900">{stats.counts[status] || 0}</span>
                  <span className="text-[8px] sm:text-[9px] font-black text-stone-400 uppercase tracking-tighter mt-1 leading-tight">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右側：會勘線索與異常預警 */}
        <div className="xl:col-span-1 space-y-6">
          {/* 會勘線索 (Tiiny Web App 串接) */}
          <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="px-6 py-5 border-b border-stone-100 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-600" />
                <h3 className="font-black text-[10px] uppercase tracking-widest text-stone-900">最新會勘線索 (WEB)</h3>
              </div>
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg text-[8px] font-black animate-pulse">LIVE</span>
            </div>
            <div className="p-4 space-y-3">
              {leads.filter(l => l.status === 'new').length > 0 ? leads.filter(l => l.status === 'new').map(lead => (
                <div key={lead.id} className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100 hover:border-indigo-300 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-black text-stone-900">{lead.customerName}</p>
                    <span className="text-[8px] font-bold text-stone-400">{lead.timestamp}</span>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                      <Phone size={10} /> <a href={`tel:${lead.phone}`} className="hover:text-indigo-600 hover:underline transition-colors">{lead.phone}</a>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                      <MapPin size={10} /> {lead.address}
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-100/50 p-2 rounded-lg leading-relaxed line-clamp-2">
                      AI 診斷：{lead.diagnosis}
                    </div>
                  </div>
                  <button
                    onClick={() => onConvertLead?.(lead.id)}
                    className="w-full bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 group-hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    轉為專案洽談 <ArrowUpRight size={12} />
                  </button>
                </div>
              )) : (
                <div className="py-12 flex flex-col items-center justify-center text-stone-300 opacity-50 gap-2">
                  <Zap size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest">目前無新線索</p>
                </div>
              )}
              {leads.filter(l => l.status === 'new').length > 0 && (
                <p className="text-[9px] text-center text-stone-400 font-bold mt-2 cursor-pointer hover:text-indigo-600">查看所有外部線索 →</p>
              )}
            </div>
          </div>

          <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-500" /> 營運效能分析
              </h3>
              <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-2">預算消化率</p>
                  <p className="text-2xl font-black">{stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0}%</p>
                  <p className="text-[10px] text-stone-400 mt-2 font-medium">當前選取範圍內總合約金額之執行狀況。</p>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">管理負載度</p>
                  <p className="text-2xl font-black">{Math.ceil(filteredProjects.length / 50)} 案/人</p>
                  <p className="text-[10px] text-stone-400 mt-2 font-medium">基於五十人團隊之平均分配量。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
