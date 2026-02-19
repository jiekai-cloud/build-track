import React, { useState, useMemo, useRef } from 'react';
import {
    Activity, DollarSign, HardHat, ChevronDown, Pencil, Trash2, Building2, ShoppingBag, Wallet, Users, Receipt, Loader2, FileText, Camera, Sparkles, X, Check
} from 'lucide-react';
import { Expense, WorkAssignment, PaymentStage } from '../../types';
import { analyzeProjectFinancials, analyzeQuotationItems, scanReceipt } from '../../services/geminiService';
import { useProject } from '../../contexts/ProjectContext';

const ProjectFinancials: React.FC = () => {
    const { project, isReadOnly, onUpdateExpenses, onUpdateWorkAssignments, onUpdatePayments } = useProject();
    const [isAnalyzingFinancials, setIsAnalyzingFinancials] = useState(false);
    const [financialAnalysis, setFinancialAnalysis] = useState<string | null>(null);
    const [isLaborDetailsExpanded, setIsLaborDetailsExpanded] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<WorkAssignment | null>(null);
    const [expandedExpenseCategory, setExpandedExpenseCategory] = useState<string | null>(null);
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [isScanningReceipt, setIsScanningReceipt] = useState(false);
    const [isAnalyzingQuotation, setIsAnalyzingQuotation] = useState(false);

    const quotationInputRef = useRef<HTMLInputElement>(null);
    const receiptInputRef = useRef<HTMLInputElement>(null);

    const [expenseFormData, setExpenseFormData] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: '委託工程',
        status: '已核銷',
        name: '',
        amount: 0,
        supplier: ''
    });

    const assignments = project.workAssignments || [];
    const expenses = project.expenses || [];
    const totalLaborCost = assignments.reduce((acc, curr) => acc + curr.totalCost, 0);
    const totalExpenseCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const currentSpent = totalLaborCost + totalExpenseCost;

    const profit = useMemo(() => {
        const introducerFee = (project.introducerFeeRequired && project.introducerFeeAmount) ? project.introducerFeeAmount : 0;
        const totalSpent = currentSpent + introducerFee;
        return project.budget - totalSpent;
    }, [project.budget, currentSpent, project.introducerFeeRequired, project.introducerFeeAmount]);

    const totalReceived = (project.payments || [])
        .filter(p => p.status === 'paid')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);


    const handleDeleteAssignment = (assignmentId: string) => {
        if (window.confirm('確定要刪除這筆派工紀錄嗎？此動作無法復原。')) {
            const newAssignments = assignments.filter(a => a.id !== assignmentId);
            onUpdateWorkAssignments(newAssignments);
        }
    };

    const handleSaveAssignment = (updated: WorkAssignment) => {
        const newAssignments = assignments.map(a =>
            a.id === updated.id ? { ...updated, totalCost: Number(updated.wagePerDay) * Number(updated.days) } : a
        );
        onUpdateWorkAssignments(newAssignments);
        setEditingAssignment(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={48} className="text-blue-900" />
                    </div>
                    <p className="text-[9px] font-black text-stone-400 uppercase mb-2 tracking-widest">預算執行率</p>
                    <p className="text-2xl font-black text-stone-900">{((currentSpent / project.budget) * 100).toFixed(1)}%</p>
                    <div className="w-full bg-stone-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${(currentSpent / project.budget) > 1 ? 'bg-rose-500' :
                                (currentSpent / project.budget) > 0.8 ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                            style={{ width: `${Math.min((currentSpent / project.budget) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* AI Analysis & Financial Overview Section */}
            <div className="space-y-6 mb-6">
                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h3 className="text-xl font-black text-white mb-2">專案財務總覽</h3>
                            <p className="text-stone-400 text-sm font-medium">即時追蹤預算執行率與自動化成本分析。</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    setIsAnalyzingFinancials(true);
                                    try {
                                        const result = await analyzeProjectFinancials(project);
                                        setFinancialAnalysis(result.text || '無法生成報告');
                                    } catch (e) {
                                        alert('分析失敗，請稍後再試');
                                    } finally {
                                        setIsAnalyzingFinancials(false);
                                    }
                                }}
                                disabled={isAnalyzingFinancials}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-900/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isAnalyzingFinancials ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                AI 財務診斷
                            </button>
                            {!isReadOnly && <button className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"><Pencil size={18} /></button>}
                        </div>
                    </div>
                </div>

                {financialAnalysis && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shrink-0">
                                <Activity size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-indigo-900 text-sm uppercase tracking-wider mb-3">AI 財務營運預測報告</h4>
                                <div className="prose prose-sm prose-indigo max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                    {financialAnalysis}
                                </div>
                            </div>
                            <button onClick={() => setFinancialAnalysis(null)} className="text-indigo-300 hover:text-indigo-500"><X size={20} /></button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign size={20} /></div>
                            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">BUDGET</span>
                        </div>
                        <p className="text-2xl font-black text-stone-900 tracking-tight">NT$ {(project.budget || 0).toLocaleString()}</p>
                        <p className="text-[11px] font-bold text-stone-400 mt-1">專案總預算</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><HardHat size={20} /></div>
                            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">LABOR COST</span>
                        </div>
                        <p className="text-2xl font-black text-stone-900 tracking-tight">
                            NT$ {((project.workAssignments || []).reduce((acc, curr) => acc + (curr?.totalCost || 0), 0) || 0).toLocaleString()}
                        </p>
                        <p className="text-[11px] font-bold text-stone-400 mt-1">累積施工成本 (自動計算)</p>


                        {/* 派工明細表 - 可折疊 */}
                        {(project.workAssignments || []).length > 0 && (
                            <>
                                <button
                                    onClick={() => setIsLaborDetailsExpanded(!isLaborDetailsExpanded)}
                                    className="w-full mt-4 pt-4 border-t border-stone-100 flex items-center justify-between hover:bg-stone-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
                                >
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                        派工明細 ({(project.workAssignments || []).length} 筆)
                                    </p>
                                    <ChevronDown
                                        size={16}
                                        className={`text-stone-400 transition-transform ${isLaborDetailsExpanded ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {isLaborDetailsExpanded && (
                                    <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar mt-3 animate-in slide-in-from-top-2 duration-200">
                                        {(project.workAssignments || []).map((assignment, idx) => (
                                            <div key={assignment.id || idx} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-black text-stone-900 truncate">{assignment.memberName}</p>
                                                        {assignment.isSpiderMan && (
                                                            <span className="text-[7px] font-black text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100 flex-shrink-0">🕷️</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] text-stone-400 font-medium">{assignment.date}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <p className="text-xs font-black text-stone-900">NT$ {(assignment.totalCost || 0).toLocaleString()}</p>
                                                    <p className="text-[8px] text-stone-400 font-medium">{assignment.wagePerDay}元 × {assignment.days}天</p>
                                                </div>
                                                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-stone-100">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingAssignment(assignment); }}
                                                        className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="編輯"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id); }}
                                                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="刪除"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {[
                        { label: '委託工程 (分包)', key: '委託工程', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                        { label: '機具材料', key: '機具材料', icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                        { label: '零用金雜支', key: '零用金', icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
                    ].map(cat => {
                        const catExpenses = (project.expenses || []).filter(e => e.category === cat.key);
                        const amount = catExpenses.reduce((acc, curr) => acc + (curr?.amount || 0), 0);
                        const Icon = cat.icon;
                        const isExpanded = expandedExpenseCategory === cat.key;

                        return (
                            <div key={cat.label} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all duration-300 ${isExpanded ? `${cat.border} ring-2 ring-blue-500/10` : 'border-stone-100'}`}>
                                <div className="flex justify-between items-start mb-4 cursor-pointer" onClick={() => setExpandedExpenseCategory(isExpanded ? null : cat.key)}>
                                    <div className={`p-3 ${cat.bg} ${cat.color} rounded-2xl`}><Icon size={20} /></div>
                                    <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-1">
                                        EXPENSE {isExpanded ? <ChevronDown size={12} className="rotate-180" /> : <ChevronDown size={12} />}
                                    </span>
                                </div>
                                <div className="cursor-pointer" onClick={() => setExpandedExpenseCategory(isExpanded ? null : cat.key)}>
                                    <p className="text-2xl font-black text-stone-900 tracking-tight">NT$ {(amount || 0).toLocaleString()}</p>
                                    <p className="text-[11px] font-bold text-stone-400 mt-1">{cat.label} <span className="text-[9px] ml-1 opacity-50">({catExpenses.length} 筆)</span></p>
                                </div>

                                {/* 明細展開 */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-dashed border-stone-200 animate-in slide-in-from-top-2">
                                        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                            {catExpenses.length > 0 ? (
                                                catExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp, idx) => (
                                                    <div key={exp.id || idx} className="flex flex-col gap-1 p-2 rounded-lg hover:bg-stone-50 transition-colors">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-black text-stone-700 truncate max-w-[60%]">{exp.name}</span>
                                                            <span className="text-[10px] font-black text-stone-900">NT$ {exp.amount.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-[9px] text-stone-400">
                                                            <span>{exp.date} {exp.supplier ? `· ${exp.supplier}` : ''}</span>
                                                            {!isReadOnly && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm('確定刪除此筆支出？')) {
                                                                            const newExpenses = (project.expenses || []).filter(e => e.id !== exp.id);
                                                                            const newExpTotal = newExpenses.reduce((sum, e) => sum + e.amount, 0);
                                                                            const currentLabor = (project.workAssignments || []).reduce((acc, curr) => acc + curr.totalCost, 0);
                                                                            onUpdateExpenses(newExpenses, newExpTotal + currentLabor);
                                                                        }
                                                                    }}
                                                                    className="hover:text-rose-500"
                                                                >
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-2 text-[10px] text-stone-300">尚無明細資料</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setExpenseFormData({ ...expenseFormData, category: cat.key as any });
                                                setIsAddingExpense(true);
                                            }}
                                            className="w-full mt-2 py-2 text-[10px] font-bold text-stone-400 border border-dashed border-stone-200 rounded-xl hover:bg-stone-50 hover:text-stone-600 transition-colors"
                                        >
                                            + 新增{cat.label.split(' ')[0]}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className={`p-6 rounded-3xl border shadow-sm ${profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${profit >= 0 ? 'bg-white text-emerald-600' : 'bg-white text-rose-600'}`}>
                                <Activity size={20} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>NET PROFIT</span>
                        </div>
                        <p className={`text-2xl font-black tracking-tight ${profit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                            NT$ {(Math.abs(profit) || 0).toLocaleString()}
                        </p>
                        <p className={`text-[11px] font-bold mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {profit >= 0 ? '目前預估毛利' : '目前預估虧損'}
                        </p>
                        {/* 毛利率 */}
                        <div className="mt-3 pt-3 border-t border-white/50">
                            <p className="text-[9px] font-black text-emerald-900/40 uppercase tracking-widest mb-1">PROFIT MARGIN</p>
                            <p className={`text-xl font-black ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {project.budget > 0 ? ((profit / project.budget) * 100).toFixed(1) : '0.0'}%
                            </p>
                        </div>
                    </div>

                    {/* 介紹費卡片 */}
                    {project.introducerFeeRequired && project.introducerFeeAmount && (
                        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Users size={20} />
                                </div>
                                <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">REFERRAL FEE</span>
                            </div>
                            <p className="text-2xl font-black text-stone-900 tracking-tight">
                                NT$ {(project.introducerFeeAmount || 0).toLocaleString()}
                            </p>
                            <p className="text-[11px] font-bold text-stone-400 mt-1">介紹人：{project.introducer || '未填寫'}</p>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-stone-100 text-stone-600 rounded-2xl">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">RECEIVED</span>
                        </div>
                        <p className="text-2xl font-black text-stone-900 tracking-tight">
                            NT$ {totalReceived.toLocaleString()}
                        </p>
                        <p className="text-[11px] font-bold text-stone-400 mt-1">目前已收款總額</p>
                    </div>
                </div>

                {/* 收款階段管理 */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden min-h-[300px]">
                    <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign size={14} className="text-emerald-600" /> 應收款與收款階段
                        </h4>
                        {!isReadOnly && (
                            <button
                                onClick={() => {
                                    const label = prompt('階段名稱 (例如：訂金、期中款)');
                                    const amountStr = prompt('金額 (數字)');
                                    if (label && amountStr) {
                                        const newPayment: PaymentStage = {
                                            id: Date.now().toString(),
                                            label,
                                            amount: parseInt(amountStr),
                                            status: 'pending',
                                            date: new Date().toISOString().split('T')[0],
                                            notes: ''
                                        };
                                        onUpdatePayments([...(project.payments || []), newPayment]);
                                    }
                                }}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all active:scale-95"
                            >
                                + 新增收款階段
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50/50">
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">階段名稱</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">預計收款日</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">金額</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">狀態</th>
                                    {!isReadOnly && <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">操作</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {(project.payments || []).length > 0 ? (project.payments || []).map((p) => (
                                    <tr key={p.id} className="hover:bg-stone-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-black text-stone-900">
                                            <input
                                                type="text"
                                                value={p.label}
                                                disabled={isReadOnly}
                                                onChange={(e) => {
                                                    const newLabel = e.target.value;
                                                    onUpdatePayments((project.payments || []).map(pay => pay.id === p.id ? { ...pay, label: newLabel } : pay));
                                                }}
                                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-200 rounded px-1 -ml-1 w-full"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-stone-500">
                                            <input
                                                type="date"
                                                value={p.date}
                                                disabled={isReadOnly}
                                                onChange={(e) => {
                                                    const newDate = e.target.value;
                                                    onUpdatePayments((project.payments || []).map(pay => pay.id === p.id ? { ...pay, date: newDate } : pay));
                                                }}
                                                className="bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-200 rounded px-1 -ml-1 text-stone-500 w-[110px]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-stone-900 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="text-stone-400">NT$</span>
                                                <input
                                                    type="number"
                                                    value={p.amount}
                                                    disabled={isReadOnly}
                                                    onChange={(e) => {
                                                        const newAmount = parseInt(e.target.value) || 0;
                                                        onUpdatePayments((project.payments || []).map(pay => pay.id === p.id ? { ...pay, amount: newAmount } : pay));
                                                    }}
                                                    className="bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-200 rounded px-1 text-right w-[80px]"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    const nextStatus = p.status === 'paid' ? 'pending' : 'paid';
                                                    onUpdatePayments((project.payments || []).map(pay => pay.id === p.id ? { ...pay, status: nextStatus } : pay));
                                                }}
                                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border transition-all ${p.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}
                                            >
                                                {p.status === 'paid' ? '已收訖' : '待收款'}
                                            </button>
                                        </td>
                                        {!isReadOnly && (
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => onUpdatePayments((project.payments || []).filter(pay => pay.id !== p.id))} className="text-stone-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-stone-300">
                                            <p className="text-[10px] font-black uppercase tracking-widest">目前尚未設定收款階段</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* 支出管理 (Expenses) */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden min-h-[300px]">
                    <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                            <Receipt size={14} className="text-rose-600" /> 專案支出明細
                        </h4>
                        <div className="flex gap-2">
                            {!isReadOnly && (
                                <>
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={quotationInputRef}
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setIsAnalyzingQuotation(true);
                                                const reader = new FileReader();
                                                reader.onload = async (event) => {
                                                    try {
                                                        const base64 = (event.target?.result as string).split(',')[1];
                                                        const items = await analyzeQuotationItems(base64);
                                                        if (items && items.length > 0) {
                                                            const newExpenses = items.map((item: any) => ({
                                                                id: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                                                date: new Date().toISOString().split('T')[0],
                                                                category: item.category || '機具材料',
                                                                status: '尚未請款',
                                                                name: item.name,
                                                                amount: 0, // Explicitly 0 as requested
                                                                supplier: item.supplier || '',
                                                                note: '來自報價單分析'
                                                            }));
                                                            onUpdateExpenses([...(project.expenses || []), ...newExpenses]);
                                                            alert(`✅ 成功匯入 ${items.length} 筆項目！請記得補填金額。`);
                                                        } else {
                                                            alert('無法識別項目，請確認圖片清晰度。');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('分析失敗，請稍後再試');
                                                    } finally {
                                                        setIsAnalyzingQuotation(false);
                                                        if (quotationInputRef.current) quotationInputRef.current.value = '';
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => quotationInputRef.current?.click()}
                                        disabled={isAnalyzingQuotation}
                                        className="bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center gap-2"
                                    >
                                        {isAnalyzingQuotation ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                        {isAnalyzingQuotation ? '分析中...' : '匯入報價單'}
                                    </button>
                                    <button
                                        onClick={() => setIsAddingExpense(true)}
                                        className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-stone-800 transition-all active:scale-95"
                                    >
                                        + 新增支出
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {isAddingExpense && (
                        <div className="p-6 bg-stone-50 border-b border-stone-100 space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex justify-center mb-4">
                                <input
                                    type="file"
                                    className="hidden"
                                    ref={receiptInputRef}
                                    accept="image/*"
                                    capture="environment"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setIsScanningReceipt(true);
                                            const reader = new FileReader();
                                            reader.onload = async (event) => {
                                                try {
                                                    const base64 = (event.target?.result as string).split(',')[1];
                                                    const result = await scanReceipt(base64);
                                                    if (result) {
                                                        setExpenseFormData({
                                                            ...expenseFormData,
                                                            ...result,
                                                            amount: Number(result.amount) || 0
                                                        });
                                                    }
                                                } catch (err: any) {
                                                    console.error('收據辨識錯誤:', err);
                                                    alert(`辨識失敗: ${err.message || '請確認網路連線或稍後再試'}`);
                                                } finally {
                                                    setIsScanningReceipt(false);
                                                }
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => receiptInputRef.current?.click()}
                                    disabled={isScanningReceipt}
                                    className="bg-white border-2 border-dashed border-stone-200 text-stone-600 px-6 py-4 rounded-2xl text-[11px] font-black flex flex-col items-center gap-2 hover:bg-stone-100 hover:border-stone-400 transition-all w-full"
                                >
                                    {isScanningReceipt ? <Loader2 size={24} className="animate-spin text-orange-600" /> : <Camera size={24} className="text-stone-400" />}
                                    {isScanningReceipt ? 'AI 正在分析收據...' : '點擊此處上傳發票/收據照片，AI 自動填表'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">支出類別</label>
                                    <select
                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                                        value={expenseFormData.category}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}
                                    >
                                        <option value="委託工程">委託工程 (Subcontract)</option>
                                        <option value="零用金">零用金 (Petty Cash)</option>
                                        <option value="機具材料">機具材料 (Materials)</option>
                                        <option value="行政人事成本">行政人事成本 (Admin / HR)</option>
                                        <option value="其他">其他 (Other)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">發生日期</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                        value={expenseFormData.date}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">支出項目名稱</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                        placeholder="例如：水泥沙、工資..."
                                        value={expenseFormData.name}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">金額</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            className="w-full bg-white border border-stone-200 rounded-xl pl-6 pr-3 py-2 text-xs font-bold outline-none"
                                            value={expenseFormData.amount}
                                            onChange={e => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">
                                        {expenseFormData.category === '委託工程' ? '承攬廠商名稱 (必填)' : '支付對象 (選填)'}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                        placeholder={expenseFormData.category === '委託工程' ? '請輸入廠商名稱...' : '廠商或請款人...'}
                                        value={expenseFormData.supplier}
                                        onChange={e => setExpenseFormData({ ...expenseFormData, supplier: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setIsAddingExpense(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100">取消</button>
                                <button
                                    onClick={() => {
                                        if (!expenseFormData.name || !expenseFormData.amount) return alert('請填寫完整資訊');
                                        if (expenseFormData.category === '委託工程' && !expenseFormData.supplier) return alert('委託工程必須填寫承攬廠商名稱');
                                        const newExp: Expense = {
                                            id: Date.now().toString(),
                                            ...expenseFormData as Expense
                                        };
                                        const newExpenses = [newExp, ...(project.expenses || [])];
                                        // Calculate new total spent: sum(expenses) + sum(labor assignments)
                                        const newExpTotal = newExpenses.reduce((sum, e) => sum + e.amount, 0);
                                        const currentLabor = (project.workAssignments || []).reduce((acc, curr) => acc + curr.totalCost, 0);
                                        onUpdateExpenses(newExpenses, newExpTotal + currentLabor);

                                        setIsAddingExpense(false);
                                        setExpenseFormData({
                                            date: new Date().toISOString().split('T')[0],
                                            category: '委託工程',
                                            status: '已核銷',
                                            name: '',
                                            amount: 0,
                                            supplier: ''
                                        });
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                                >
                                    確認新增
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50/50">
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">日期</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">類別</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">項目說明</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-right">金額</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100">對象</th>
                                    {!isReadOnly && <th className="px-6 py-3 text-[9px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 text-center">操作</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {(project.expenses || []).length > 0 ? [...(project.expenses || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
                                    <tr key={exp.id} className="hover:bg-stone-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-stone-500">{exp.date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${exp.category === '委託工程' ? 'bg-indigo-50 text-indigo-600' :
                                                exp.category === '機具材料' ? 'bg-amber-50 text-amber-600' :
                                                    exp.category === '行政人事成本' ? 'bg-purple-50 text-purple-600' :
                                                        exp.category === '零用金' ? 'bg-teal-50 text-teal-600' :
                                                            'bg-stone-100 text-stone-600'
                                                }`}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-stone-900">{exp.name}</td>
                                        <td className="px-6 py-4 text-xs font-black text-stone-900 text-right">NT$ {(exp.amount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-stone-500">{exp.supplier || '-'}</td>
                                        {!isReadOnly && (
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        if (confirm('確定刪除此筆支出？')) {
                                                            const newExpenses = (project.expenses || []).filter(e => e.id !== exp.id);
                                                            const newExpTotal = newExpenses.reduce((sum, e) => sum + e.amount, 0);
                                                            const currentLabor = (project.workAssignments || []).reduce((acc, curr) => acc + curr.totalCost, 0);
                                                            onUpdateExpenses(newExpenses, newExpTotal + currentLabor);
                                                        }
                                                    }}
                                                    className="text-stone-300 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-stone-300"><p className="text-[10px] font-black uppercase tracking-widest">尚無支出紀錄</p></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
            {/* Editing Modal placed outside main structure if possible, but here it's fine */}
            {editingAssignment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                            <h3 className="font-black text-stone-900">編輯派工紀錄</h3>
                            <button onClick={() => setEditingAssignment(null)} className="p-2 hover:bg-stone-200/50 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">施工人員</label>
                                <div className="text-sm font-black text-stone-900 bg-stone-100 px-3 py-2 rounded-xl">{editingAssignment.memberName}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">日期</label>
                                    <input
                                        type="date"
                                        value={editingAssignment.date}
                                        onChange={e => setEditingAssignment({ ...editingAssignment, date: e.target.value })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 mb-1">工數 (天)</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={editingAssignment.days}
                                        onChange={e => setEditingAssignment({ ...editingAssignment, days: Number(e.target.value) })}
                                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1">每日工資</label>
                                <input
                                    type="number"
                                    value={editingAssignment.wagePerDay}
                                    onChange={e => setEditingAssignment({ ...editingAssignment, wagePerDay: Number(e.target.value) })}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 font-bold outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer" onClick={() => setEditingAssignment({ ...editingAssignment, isSpiderMan: !editingAssignment.isSpiderMan })}>
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${editingAssignment.isSpiderMan ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200'}`}>
                                    {editingAssignment.isSpiderMan && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span className="text-xs font-bold text-blue-800">啟用蜘蛛人津貼 (高空作業)</span>
                            </div>
                        </div>
                        <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-2">
                            <button onClick={() => setEditingAssignment(null)} className="flex-1 py-3 text-stone-500 font-bold hover:bg-stone-200/50 rounded-xl transition-colors">取消</button>
                            <button onClick={() => handleSaveAssignment(editingAssignment)} className="flex-1 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors shadow-lg active:scale-95">儲存變更</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectFinancials;
