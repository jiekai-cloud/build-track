
import React from 'react';
import { FileText, X, Sparkles, DownloadCloud } from 'lucide-react';
import { Project } from '../../types';
import { analyzeProjectFinancials } from '../../services/geminiService';

interface ProjectReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    currentSpent: number;
    margin: number;
    totalLaborCost: number;
    totalExpenseCost: number;
}

const ProjectReportModal: React.FC<ProjectReportModalProps> = ({
    isOpen, onClose, project, currentSpent, margin, totalLaborCost, totalExpenseCost
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">專案執行績效報告</h2>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{project.name} | {project.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200 hover:text-stone-900 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                    {/* Basic Info & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">目前進度</p>
                            <p className="text-3xl font-black text-blue-600">{project.progress}%</p>
                            <div className="mt-4 h-2 bg-stone-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
                            </div>
                        </div>
                        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">案件狀態</p>
                            <p className="text-2xl font-black text-slate-900">{project.status}</p>
                            <p className="text-[10px] text-stone-400 font-bold mt-2">最後更新: {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '尚未更新'}</p>
                        </div>
                        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">合約日期</p>
                            <p className="text-lg font-black text-slate-900">{project.startDate} 至</p>
                            <p className="text-lg font-black text-slate-900">{project.endDate}</p>
                        </div>
                    </div>

                    {/* Financial Performance */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-orange-500 pl-4">財務損益分析 (Financial Performance)</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Budget Chart Simulation */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase">預算執行狀況</p>
                                        <p className="text-2xl font-black text-slate-900">${(currentSpent || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-stone-400 uppercase">總預算</p>
                                        <p className="text-lg font-black text-stone-400">${(project.budget || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                                    <div
                                        className={`h-full transition-all duration-1000 ${currentSpent > project.budget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, (currentSpent / project.budget) * 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[9px] font-black text-stone-400 text-center uppercase tracking-widest">
                                    {currentSpent > project.budget ? '⚠️ 已超出預算' : `預算執行率: ${Math.round((currentSpent / project.budget) * 100)}%`}
                                </p>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase">預估毛利</p>
                                        {/* Profit Health Indicator */}
                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${(margin / (project.budget || 1)) > 0.3 ? 'bg-emerald-500 text-white' :
                                            (margin / (project.budget || 1)) > 0.15 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                                            }`}>
                                            <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
                                            {(margin / (project.budget || 1)) > 0.3 ? 'Safe' : (margin / (project.budget || 1)) > 0.15 ? 'Caution' : 'Critical'}
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-emerald-700">${(margin || 0).toLocaleString()}</p>
                                </div>
                                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">利潤率</p>
                                    <p className="text-xl font-black text-blue-700">{project.budget > 0 ? Math.round((margin / project.budget) * 100) : 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b pb-2">支出構成明細 (Expense Breakdown)</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-stone-600">
                                    <span>人工成本 (派工)</span>
                                    <span className="font-black text-stone-900">${(totalLaborCost || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-stone-600">
                                    <span>材料及其他支出</span>
                                    <span className="font-black text-stone-900">${(totalExpenseCost || 0).toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center text-sm font-black text-stone-900">
                                    <span>總支出</span>
                                    <span>${(currentSpent || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b pb-2">施工項次統計 (Phase Status)</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold text-stone-600">
                                    <span>總施工項目</span>
                                    <span className="font-black text-stone-900">{project.phases?.length || 0} 項</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-stone-600">
                                    <span>已完工項目</span>
                                    <span className="font-black text-emerald-600">{project.phases?.filter(p => p.status === 'Completed').length || 0} 項</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-bold text-stone-600">
                                    <span>進行中項目</span>
                                    <span className="font-black text-blue-600">{project.phases?.filter(p => p.status === 'Current').length || 0} 項</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Advice Section (AI Integrated Style) */}
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="relative z-10 flex items-start gap-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                                <Sparkles size={24} />
                            </div>
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black tracking-tight">AI 專案診斷建議</h4>
                                    <button
                                        onClick={async () => {
                                            const btn = document.getElementById('ai-analyze-btn');
                                            if (btn) btn.innerHTML = '分析中...';
                                            try {
                                                const res = await analyzeProjectFinancials(project);
                                                const adviceP = document.getElementById('ai-advice-text');
                                                if (adviceP) adviceP.innerHTML = res.text;
                                            } catch (e) {
                                                alert('分析失敗');
                                            } finally {
                                                if (btn) btn.innerHTML = '重新診斷';
                                            }
                                        }}
                                        id="ai-analyze-btn"
                                        className="text-[9px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-all"
                                    >
                                        執行深度診斷
                                    </button>
                                </div>
                                <div id="ai-advice-text" className="text-xs text-stone-300 leading-relaxed prose prose-invert prose-xs max-w-none">
                                    根據目前的進度為 {project.progress}%，與預算執行率 {project.budget > 0 ? Math.round((currentSpent / project.budget) * 100) : 0}% 相比，
                                    {currentSpent > project.budget ? '支出已超過預算，建議立即檢查「材料支出」與「委託工程」是否有異常。' :
                                        (margin / (project.budget || 1)) < 0.2 ? '目前毛利稍微偏低，請留意後續工資成本的控管。' :
                                            '目前案場營運狀況良好，資金執行率與進度匹配。'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-10 py-8 border-t border-stone-100 flex items-center justify-end gap-4 bg-stone-50/30">
                    <button
                        onClick={() => window.print()}
                        className="px-6 py-3 bg-white border border-stone-200 text-stone-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center gap-2"
                    >
                        <DownloadCloud size={14} /> 列印報告
                    </button>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                    >
                        關閉報告
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectReportModal;
