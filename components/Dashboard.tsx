
import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import {
  LayoutDashboard, FolderKanban, Users, BarChart3, TrendingUp,
  AlertCircle, Clock, CheckCircle2, DollarSign, ArrowUpRight,
  ArrowDownRight, Activity, ShieldAlert, Zap, ExternalLink,
  Sparkles, Phone, MapPin, FileWarning, CalendarDays, AlertTriangle,
  Layers, Target, ArrowRight, Briefcase, Loader2, Download, X, RefreshCw, Bell,
  Plus, ListTodo, History
} from 'lucide-react';
import { Project, ProjectStatus, Lead, SystemContext } from '../types';
import DefectExportModal from './DefectExportModal';

interface DashboardProps {
  projects: Project[];
  leads?: Lead[];
  cloudError?: string | null;
  lastCloudSync?: string | null;
  isMasterTab?: boolean;
  onRetrySync?: () => void;
  onConvertLead?: (leadId: string) => void;
  onProjectClick: (projectId: string) => void;
  onStartTour?: () => void;
  currentDept?: SystemContext;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, leads = [], cloudError, lastCloudSync, isMasterTab, onRetrySync, onConvertLead, onProjectClick, onStartTour, currentDept = 'FirstDept' }) => {
  const [lastSync, setLastSync] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const generatePortfolioAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { getPortfolioAnalysis } = await import('../services/geminiService');
      // 排除測試專案
      const realProjects = projects.filter(p => !p.name.toLowerCase().includes('test') && !p.name.includes('測試'));
      const result = await getPortfolioAnalysis(realProjects);
      setPortfolioAnalysis(result.text);
      setShowAIModal(true);
    } catch (e) {
      alert('AI 診斷失敗，請稍後再試');
    } finally {
      setIsAnalyzing(false);
    }
  };

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

  const projectsWithDefects = useMemo(() => {
    return projects.filter(p =>
      !p.name.includes('測試') &&
      p.defectRecords?.some(record => record.items.some(item => item.status === 'Pending'))
    );
  }, [projects]);

  // 1. 高效過濾：在大數據量下僅在必要時重新計算
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // 排除測試專案 (濾除名稱包含「測試」或「Test」的案件)
      const isTestProject = p.name.toLowerCase().includes('test') || p.name.includes('測試');
      if (isTestProject) return false;

      if (!p.startDate) return false;
      const [pYear, pMonth] = p.startDate.split('-');
      const matchYear = selectedYear === 'all' || pYear === selectedYear;
      const matchMonth = selectedMonth === 'all' || pMonth === selectedMonth;
      return matchYear && matchMonth;
    });
  }, [projects, selectedYear, selectedMonth]);

  // 高效能統計資料單一歷遍 (Single Pass Optimization)
  const {
    stats,
    riskProjects,
    monitorStats,
    efficiencyData
  } = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalBudget = 0;
    let totalSpent = 0;
    let totalNetProfit = 0;

    const risks: any[] = [];
    let laborAtRisk = 0;

    // 用於全局平均工資比例計算 (不受單月篩選影響)
    let totalLaborCostAll = 0;
    let totalBudgetAll = 0;

    const now = new Date();

    const efficiencyList: any[] = [];

    // 一次性歷遍所有過濾後的專案核心數據，消滅多餘迴圈
    filteredProjects.forEach(p => {
      if (!p) return;

      // 1. 各狀態數量與基礎財務統計
      counts[p.status] = (counts[p.status] || 0) + 1;
      totalBudget += (p.budget || 0);
      totalSpent += (p.spent || 0);
      totalNetProfit += ((p.budget || 0) - (p.spent || 0));

      const laborCost = (p.workAssignments || []).reduce((acc, curr) => acc + curr.totalCost, 0);

      // 2. 風險檢測 (Risks)
      // 時間與進度風險 (Schedule Risk)
      if (p.startDate && p.endDate && p.status === ProjectStatus.CONSTRUCTING) {
        const start = new Date(p.startDate).getTime();
        const end = new Date(p.endDate).getTime();
        const totalDuration = end - start;
        const elapsed = now.getTime() - start;
        const timeRatio = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
        const progressGap = timeRatio - p.progress;
        if (progressGap >= 20) {
          risks.push({ ...p, riskType: 'schedule', riskValue: Math.round(progressGap) });
        }
      }

      // 報價/洽談逾期風險 (Delay Risk)
      if ((p.statusChangedAt || p.createdDate) && (p.status === ProjectStatus.NEGOTIATING || p.status === ProjectStatus.QUOTING)) {
        const statusTime = p.statusChangedAt || p.createdDate;
        const diff = now.getTime() - new Date(statusTime!).getTime();
        const delayDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (delayDays >= 5) {
          risks.push({ ...p, riskType: 'delay', riskValue: delayDays });
        }
      }

      // 預算與工資風險 (Budget & Labor Risks)
      if (p.budget > 0) {
        const laborRatio = (laborCost / p.budget) * 100;
        const spentRatio = (p.spent / p.budget) * 100;

        if (p.status === ProjectStatus.CONSTRUCTING && laborRatio > 50 && p.progress < 40) {
          risks.push({ ...p, riskType: 'labor', riskValue: Math.round(laborRatio), progress: p.progress });
        }

        if (spentRatio >= 90) {
          risks.push({ ...p, riskType: 'budget', riskValue: Math.round(spentRatio) });
        }

        // 監控數據 
        if (laborRatio > 40 && p.progress < 30) {
          laborAtRisk += 1;
        }

        // 效率取樣資料
        if (efficiencyList.length < 8) {
          efficiencyList.push({ ...p, laborRatio: Math.round(laborRatio) });
        }
      }
    });

    // 計算全局監控 (包含未過濾的所有年份數值)
    projects.forEach(p => {
      totalBudgetAll += (p.budget || 0);
      totalLaborCostAll += (p.workAssignments || []).reduce((la, lc) => la + lc.totalCost, 0);
    });

    const profitMargin = totalBudget > 0 ? ((totalNetProfit / totalBudget) * 100) : 0;
    const avgLaborRatio = totalBudgetAll > 0 ? Math.round((totalLaborCostAll / totalBudgetAll) * 100) : 0;

    risks.sort((a, b) => b.riskValue - a.riskValue);

    return {
      stats: { counts, totalBudget, totalSpent, totalNetProfit, profitMargin },
      riskProjects: risks,
      monitorStats: { laborAtRisk, scheduleAtRisk: risks.filter(r => r.riskType === 'schedule').length, avgLaborRatio },
      efficiencyData: efficiencyList
    };
  }, [filteredProjects, projects]);

  // 本月新增 vs 完工統計 (#8)
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const newThisMonth = projects.filter(p => p.createdDate?.startsWith(thisMonth) || p.startDate?.startsWith(thisMonth)).length;
    const newLastMonth = projects.filter(p => p.createdDate?.startsWith(lastMonthStr) || p.startDate?.startsWith(lastMonthStr)).length;
    const completedThisMonth = projects.filter(p =>
      (p.status === ProjectStatus.COMPLETED || p.status === ProjectStatus.CLOSED) &&
      p.endDate?.startsWith(thisMonth)
    ).length;
    const constructingCount = projects.filter(p => p.status === ProjectStatus.CONSTRUCTING).length;

    return { newThisMonth, newLastMonth, completedThisMonth, constructingCount, diff: newThisMonth - newLastMonth };
  }, [projects]);

  // 今日焦點：近期待處理 (#4)
  const todayFocus = useMemo(() => {
    const now = new Date();
    // 逾期報價
    const overdueQuotes = riskProjects.filter(r => r.riskType === 'delay').slice(0, 3);
    // 進度滯後
    const behindSchedule = riskProjects.filter(r => r.riskType === 'schedule').slice(0, 3);
    // 近期新增案件 (3天內)
    const recentProjects = projects
      .filter(p => {
        if (!p.createdDate && !p.startDate) return false;
        const d = new Date(p.createdDate || p.startDate!);
        return (now.getTime() - d.getTime()) < 3 * 24 * 60 * 60 * 1000;
      })
      .slice(0, 3);
    return { overdueQuotes, behindSchedule, recentProjects };
  }, [riskProjects, projects]);

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

  // Chart Data Preparation
  const statusData = useMemo(() => {
    return Object.entries(stats.counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const financialChartData = useMemo(() => {
    return filteredProjects
      .filter(p => p.budget > 0 && p.status !== '撤案' && p.status !== '未成交')
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 6 ? p.name.substring(0, 6) + '...' : p.name,
        budget: p.budget,
        spent: p.spent,
        progress: p.progress,
        full_name: p.name
      }));
  }, [filteredProjects]);

  const STATUS_COLORS: Record<string, string> = {
    [ProjectStatus.NEGOTIATING]: '#64748b',
    [ProjectStatus.QUOTING]: '#3b82f6',
    [ProjectStatus.QUOTED]: '#6366f1',
    [ProjectStatus.WAITING_SIGN]: '#8b5cf6',
    [ProjectStatus.SIGNED_WAITING_WORK]: '#a855f7',
    [ProjectStatus.CONSTRUCTING]: '#f97316',
    [ProjectStatus.COMPLETED]: '#10b981',
    [ProjectStatus.INSPECTION]: '#06b6d4',
    [ProjectStatus.CLOSED]: '#059669',
    [ProjectStatus.CANCELLED]: '#94a3b8',
    [ProjectStatus.LOST]: '#cbd5e1',
  };

  const formatMoney = (val: number) => {
    if (val >= 100000000) return (val / 100000000).toFixed(1) + '億';
    if (val >= 10000) return (val / 10000).toFixed(0) + '萬';
    return val.toLocaleString();
  };

  const statsCards = [
    { label: '案件總量', value: filteredProjects.length, icon: Layers, color: 'text-slate-600', bg: 'bg-slate-50', trend: monthlyTrend.diff, trendLabel: '較上月' },
    { label: '總合約金額', value: `$${formatMoney(stats.totalBudget)}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
    {
      label: '目前預估毛利',
      value: `$${formatMoney(stats.totalNetProfit)}`,
      subValue: `${stats.profitMargin.toFixed(1)}%`,
      icon: Activity,
      color: stats.totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600',
      bg: stats.totalNetProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
    },
    {
      label: '報價逾期',
      value: riskProjects.filter(r => r.riskType === 'delay').length,
      icon: FileWarning,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    { label: '施工進行中', value: stats.counts[ProjectStatus.CONSTRUCTING] || 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', trend: monthlyTrend.completedThisMonth, trendLabel: '本月完工' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-black text-stone-900 tracking-tight">
              {currentDept === 'ThirdDept' ? '傑凱工程' : '生活品質'} • 智慧指揮中心
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-stone-900 to-stone-700 text-white rounded-full shadow-lg shadow-stone-300">
              <Sparkles size={12} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Scale Optimized</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-stone-500 text-xs font-medium">
                雲端：{lastCloudSync || '未同步'} |
                狀態：{isMasterTab ? '系統主控 (Master)' : '觀察模式 (Secondary)'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-stone-100">
            <CalendarDays size={14} className="text-stone-400" />
            <select className="bg-transparent text-xs font-bold outline-none cursor-pointer" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {availableYears.map(year => <option key={year} value={year}>{year}年</option>)}
              <option value="all">全年度</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3">
            <Clock size={14} className="text-stone-400" />
            <select className="bg-transparent text-xs font-bold outline-none cursor-pointer" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value="all">全月份</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <button
            onClick={generatePortfolioAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:from-black hover:to-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI 營運診斷
          </button>
          <button
            onClick={onStartTour}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <Zap size={14} />
            快速導覽
          </button>
        </div>
      </header>

      {cloudError === '需要重新驗證' && (
        <div className="bg-amber-600 text-white p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black">雲端同步已暫停</h3>
              <p className="text-xs font-bold text-amber-100 mt-1">偵測到安全性授權過期，請點擊右側按鈕手動同步以恢復自動連線。</p>
            </div>
          </div>
          <button
            onClick={onRetrySync}
            className="w-full md:w-auto px-8 py-4 bg-white text-amber-600 rounded-2xl font-black shadow-lg hover:bg-stone-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> 立即手動同步
          </button>
        </div>
      )}

      {/* AI Portfolio Modal */}
      {showAIModal && portfolioAnalysis && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">宏觀營運診斷報告</h3>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Global Operations Diagnosis</p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-4 no-scrollbar prose prose-stone max-w-none">
              <div className="bg-slate-50 p-6 rounded-3xl border border-stone-100 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {portfolioAnalysis}
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-stone-50 flex justify-end">
              <button onClick={() => setShowAIModal(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                已閱
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {statsCards.map((stat, i) => (
          <div key={i} className="relative bg-white p-4 sm:p-5 rounded-[1.5rem] border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 hover:-translate-y-1 hover:border-stone-200 transition-all duration-300 group overflow-hidden">
            {/* Watermark Icon */}
            <div className="absolute -right-3 -top-3 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
              <stat.icon size={80} />
            </div>
            <div className="relative flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                <stat.icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-stone-900 leading-tight">{stat.value}</p>
                {(stat as any).subValue && (
                  <p className="text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1"><ArrowUpRight size={10} />{(stat as any).subValue}</p>
                )}
                {(stat as any).trend !== undefined && (
                  <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${(stat as any).trend > 0 ? 'text-emerald-500' : (stat as any).trend < 0 ? 'text-rose-500' : 'text-stone-400'}`}>
                    {(stat as any).trend > 0 ? <ArrowUpRight size={10} /> : (stat as any).trend < 0 ? <ArrowDownRight size={10} /> : null}
                    {(stat as any).trend > 0 ? '+' : ''}{(stat as any).trend} {(stat as any).trendLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Focus Section (#4) */}
      {(todayFocus.overdueQuotes.length > 0 || todayFocus.behindSchedule.length > 0 || todayFocus.recentProjects.length > 0) && (
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-[2rem] p-6 lg:p-8 text-white animate-in slide-in-from-bottom-2 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.08),transparent_50%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.06),transparent_50%)] pointer-events-none"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center">
                  <ListTodo size={16} className="text-amber-400" />
                </div>
                今日焦點
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <History size={12} /> 本月新增 {monthlyTrend.newThisMonth} 案 · 完工 {monthlyTrend.completedThisMonth} 案
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {todayFocus.overdueQuotes.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-colors duration-300 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span>
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">待跟進報價</p>
                  </div>
                  <div className="space-y-2">
                    {todayFocus.overdueQuotes.map(p => (
                      <div key={p.id} onClick={() => onProjectClick(p.id)} className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                        <span className="text-[11px] font-bold truncate flex-1">{p.name}</span>
                        <span className="text-[9px] text-rose-400 font-black shrink-0 ml-2 bg-rose-500/20 px-1.5 py-0.5 rounded">逾期{p.riskValue}天</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {todayFocus.behindSchedule.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-colors duration-300 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">進度滯後</p>
                  </div>
                  <div className="space-y-2">
                    {todayFocus.behindSchedule.map(p => (
                      <div key={p.id} onClick={() => onProjectClick(p.id)} className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                        <span className="text-[11px] font-bold truncate flex-1">{p.name}</span>
                        <span className="text-[9px] text-amber-400 font-black shrink-0 ml-2 bg-amber-500/20 px-1.5 py-0.5 rounded">滯後{p.riskValue}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {todayFocus.recentProjects.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-colors duration-300 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">近期新增</p>
                  </div>
                  <div className="space-y-2">
                    {todayFocus.recentProjects.map(p => (
                      <div key={p.id} onClick={() => onProjectClick(p.id)} className="flex items-center justify-between cursor-pointer hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors">
                        <span className="text-[11px] font-bold truncate flex-1">{p.name}</span>
                        <span className="text-[9px] text-stone-500 font-bold shrink-0 ml-2">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Defect Summary Section (#2 - compact when empty) */}
      {projectsWithDefects.length > 0 ? (
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm p-6 lg:p-8 animate-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2 border-l-4 border-rose-500 pl-3">
              <AlertTriangle size={18} className="text-rose-500" /> 缺失改善紀錄彙整 (未完成)
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-stone-50 transition-all shadow-sm active:scale-95"
              >
                <Download size={12} /> 批量匯出報告
              </button>
              <span className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black uppercase tracking-wider self-start sm:self-auto border border-rose-100">
                共有 {projectsWithDefects.length} 案有待改進項目
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projectsWithDefects.slice(0, 8).map(p => {
              const totalPending = p.defectRecords?.reduce((acc, r) => acc + r.items.filter(i => i.status === 'Pending').length, 0) || 0;
              return (
                <div key={p.id} onClick={() => onProjectClick(p.id)} className="cursor-pointer bg-stone-50 hover:bg-white hover:shadow-lg hover:-translate-y-1 hover:border-rose-200 border border-stone-100 rounded-2xl p-5 transition-all group duration-300">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h4 className="font-black text-stone-800 text-xs line-clamp-1 flex-1" title={p.name}>{p.name}</h4>
                    <span className="bg-rose-500 text-white shadow-sm text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                      <AlertTriangle size={10} /> {totalPending}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-stone-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Users size={10} /> {p.quotationManager || p.engineeringManager || '未指定'}</span>
                    <span className="group-hover:translate-x-1 group-hover:text-rose-500 transition-all flex items-center gap-1">前往改善 <ArrowRight size={10} /></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span className="font-bold text-xs text-emerald-600">所有案件皆無待改善缺失，品質良好！</span>
          </div>
          <button onClick={() => setIsExportModalOpen(true)} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-700 transition-colors">
            匯出報告
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col hover:shadow-xl hover:shadow-stone-100/50 transition-all duration-300">
          <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-indigo-300 rounded-full"></div>
            案件狀態分佈
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 'bold', padding: '12px 16px' }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Overview Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col hover:shadow-xl hover:shadow-stone-100/50 transition-all duration-300">
          <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-6 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-emerald-300 rounded-full"></div>
            重點案件預算執行概況 (Top 5)
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialChartData} barSize={20}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 'bold', fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis
                  fontSize={10}
                  tick={{ fontWeight: 'bold', fill: '#78716c' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => formatMoney(val)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(250,250,249,0.6)' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                  labelStyle={{ fontSize: '12px', fontWeight: '900', color: '#1c1917', marginBottom: '8px' }}
                  formatter={(value: number, name: string, props: any) => {
                    const progress = props?.payload?.progress;
                    const suffix = progress !== undefined ? ` (進度 ${progress}%)` : '';
                    return [`$${value.toLocaleString()}${suffix}`, ''];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="budget" name="預算金額" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                <Bar dataKey="spent" name="已支出" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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
                  {riskProjects.map(p => (
                    <div key={`${p.id}-${p.riskType}`} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 hover:border-stone-200 transition-all duration-300 group relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${p.riskType === 'delay' ? 'bg-gradient-to-b from-rose-400 to-rose-600' : p.riskType === 'labor' ? 'bg-gradient-to-b from-orange-400 to-orange-600' : p.riskType === 'schedule' ? 'bg-gradient-to-b from-amber-400 to-amber-600' : 'bg-gradient-to-b from-rose-400 to-rose-600'}`}></div>
                      <div className="space-y-1 pl-2">
                        <p className="text-xs font-black text-stone-900 group-hover:text-stone-700">{p.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-stone-400 uppercase">ID: {p.id}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${p.riskType === 'delay' ? 'text-rose-500 bg-rose-50 border-rose-100' :
                            p.riskType === 'labor' ? 'text-orange-500 bg-orange-50 border-orange-100' :
                              p.riskType === 'schedule' ? 'text-amber-500 bg-amber-50 border-amber-100' :
                                'text-rose-500 bg-rose-50 border-rose-100'
                            }`}>
                            {p.riskType === 'delay' ? `逾期 ${p.riskValue} 天` :
                              p.riskType === 'labor' ? `工資佔比 ${p.riskValue}%` :
                                p.riskType === 'schedule' ? `進度滯後 ${p.riskValue}%` :
                                  `預算執行 ${p.riskValue}%`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div className="hidden sm:block">
                          <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter mb-0.5">負責人</p>
                          <p className="text-[10px] font-black text-stone-700">{p.quotationManager || p.manager || '未指定'}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const msg = `【案件風險提醒】\n專案：${p.name}\n狀態：${p.riskType === 'delay' ? `報價已逾期 ${p.riskValue} 天尚未處理` : p.riskType === 'labor' ? `工資佔比已達 ${p.riskValue}% (超標)` : p.riskType === 'schedule' ? `進度時效已滯後 ${p.riskValue}%` : `預算執行已達 ${p.riskValue}% (即將超支)`}\n再請負責人協助登入系統查詢！`;
                              navigator.clipboard.writeText(msg).then(() => alert('已複製提醒文案，可直接貼上至 Line 通知負責人！'));
                            }}
                            className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 hover:scale-110 transition-all shadow-sm"
                            title="一鍵複製提醒文案"
                          >
                            <Bell size={12} />
                          </button>
                          <button onClick={() => onProjectClick(p.id)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-400 hover:scale-110 transition-all shadow-sm">
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {riskProjects.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center text-stone-300 gap-3">
                      <CheckCircle2 size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">目前暫無異常案件</p>
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

          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-100/50 transition-all duration-300">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 mb-4 sm:mb-6 lg:mb-8 uppercase tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-orange-300 rounded-full"></div>
              全案場狀態分佈矩陣
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {Object.values(ProjectStatus).map((status) => {
                const count = stats.counts[status] || 0;
                const isActive = count > 0;
                return (
                  <div key={status} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[70px] sm:min-h-[80px] cursor-default group ${isActive ? 'bg-stone-50 border-stone-100 hover:border-orange-300 hover:bg-orange-50/50 hover:-translate-y-0.5 hover:shadow-lg' : 'bg-stone-50/50 border-stone-50'}`}>
                    <span className={`text-base sm:text-lg lg:text-xl font-black leading-tight ${isActive ? 'text-stone-900 group-hover:text-orange-600 transition-colors' : 'text-stone-300'}`}>{count}</span>
                    <span className="text-[8px] sm:text-[9px] font-black text-stone-400 uppercase tracking-tighter mt-1 leading-tight">{status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Section: Labor Efficiency & Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-8">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-emerald-600" /> 人力成本效率分佈
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="name" fontSize={9} tick={{ fontWeight: 'bold', fill: '#a8a29e' }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={9} tick={{ fontWeight: 'bold', fill: '#a8a29e' }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#fafaf9' }}
                    />
                    <Bar dataKey="laborRatio" name="工資佔預算比" radius={[4, 4, 0, 0]}>
                      {efficiencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.laborRatio > 40 ? '#f43f5e' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-[9px] font-bold text-stone-400 text-center uppercase tracking-widest leading-loose">
                紅條代表工資佔比過高 (&gt;40%)，可能存在工率低下或點工浪費風險
              </p>
            </div>

            <div className="bg-stone-900 rounded-[2rem] shadow-xl p-8 text-white">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
                <Zap size={18} className="text-amber-400" /> 系統智慧監控摘要
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">工率風險預警</p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      共有 {monitorStats.laborAtRisk} 案發生「工資超前、進度落後」現象。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">進度時效檢測</p>
                    <p className="text-[10px] text-stone-400 mt-1">
                      目前有 {monitorStats.scheduleAtRisk} 案時間消耗與進度不匹配。
                    </p>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[11px] font-black text-emerald-400 uppercase flex items-center gap-2">
                      <CheckCircle2 size={14} /> 營運用工效率建議
                    </p>
                    <p className="text-[10px] text-emerald-500/80 mt-2 font-bold leading-relaxed">
                      目前平均工資佔比為 {monitorStats.avgLaborRatio}%。建議針對高工資佔比案件進行工序優化。
                    </p>
                  </div>
                </div>
              </div>
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

          <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(249,115,22,0.1),transparent_50%)] pointer-events-none"></div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <ShieldAlert size={20} className="text-orange-400" />
                </div>
                營運效能分析
              </h3>
              <div className="space-y-4">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/[0.08] transition-colors duration-300">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-2">預算消化率</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black">{stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0}<span className="text-lg text-stone-500">%</span></p>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000" style={{ width: `${stats.totalBudget > 0 ? Math.min(Math.round((stats.totalSpent / stats.totalBudget) * 100), 100) : 0}%` }}></div>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 font-medium">當前選取範圍內總合約金額之執行狀況。</p>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/[0.08] transition-colors duration-300">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">管理負載度</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black">{Math.ceil(filteredProjects.length / 50)}<span className="text-lg text-stone-500"> 案/人</span></p>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 font-medium">基於五十人團隊之平均分配量。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExportModalOpen && (
        <DefectExportModal
          projects={projects}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;

