
import React, { useState, useEffect, FC } from 'react';
import {
    Building, Plus, Trash2, Check, Save, Calculator, Info, ChevronDown, ChevronUp
} from 'lucide-react';
import { useCompanyCost, getCategoryTotal, getGrandTotal } from '../hooks/useCompanyCost';
import { CompanyCost, CompanyCostItem, Project } from '../types';

interface CompanyManagementProps {
    projects: Project[];
}

const COST_CATEGORIES: { key: keyof CompanyCost; label: string; icon: string; desc: string; placeholder: string }[] = [
    { key: 'rent', label: '房屋租金', icon: '🏠', desc: '辦公室/倉庫月租金', placeholder: '例：辦公室租金、倉庫租金' },
    { key: 'phone', label: '電話費', icon: '📞', desc: '公司電話與網路月費', placeholder: '例：中華電信、網路費' },
    { key: 'insurance', label: '保險費', icon: '🛡️', desc: '公司保險（火險、責任險等）', placeholder: '例：火險、責任險、工程險' },
    { key: 'laborHealth', label: '勞健保費', icon: '🏥', desc: '公司負擔勞保+健保+勞退', placeholder: '例：勞保、健保、勞退金' },
    { key: 'carRent', label: '車輛租金', icon: '🚗', desc: '公務車輛租賃月付額', placeholder: '例：Toyota Hiace、貨車租金' },
    { key: 'loan', label: '貸款', icon: '🏦', desc: '銀行貸款月還款額', placeholder: '例：玉山銀行信貸、設備貸款' },
    { key: 'other', label: '其他', icon: '📋', desc: '水電、雜支等其他固定開銷', placeholder: '例：水電費、清潔費、雜支' },
];

const CompanyManagement: FC<CompanyManagementProps> = ({ projects }) => {
    const { cost, saveCost, totalCost, isLoading } = useCompanyCost();
    const [editingCost, setEditingCost] = useState<CompanyCost>(cost);
    const [costSaved, setCostSaved] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    // Sync editingCost when cost loads from storage
    useEffect(() => {
        setEditingCost(cost);
    }, [cost]);

    const activeProjectCount = projects.filter(p =>
        !p.deletedAt && !p.isPurged && (
            p.status === '施工中' || p.status === '洽談中' || p.status === '報價中' ||
            p.status === '已報價' || p.status === '待簽約' || p.status === '已簽約待施工'
        )
    ).length;

    const editingTotalCost = getGrandTotal(editingCost);
    const costPerProject = activeProjectCount > 0 ? Math.round(editingTotalCost / activeProjectCount) : 0;

    const totalItemCount = Object.values(editingCost).reduce((sum, items) => sum + items.length, 0);

    const handleSaveCost = async () => {
        await saveCost(editingCost);
        setCostSaved(true);
        setTimeout(() => setCostSaved(false), 2000);
    };

    const addCostItem = (categoryKey: keyof CompanyCost) => {
        setEditingCost(prev => ({
            ...prev,
            [categoryKey]: [...prev[categoryKey], { id: Date.now().toString(), name: '', amount: 0 }]
        }));
        // Auto-expand when adding
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            next.delete(categoryKey);
            return next;
        });
    };

    const removeCostItem = (categoryKey: keyof CompanyCost, itemId: string) => {
        setEditingCost(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].filter(item => item.id !== itemId)
        }));
    };

    const updateCostItem = (categoryKey: keyof CompanyCost, itemId: string, field: 'name' | 'amount', value: string | number) => {
        setEditingCost(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        }));
    };

    const toggleCategory = (key: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                    <p className="text-stone-400 text-sm font-bold">載入公司成本資料中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
            {/* Background elements for depth */}
            <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-teal-400/20 blur-[120px] -z-10 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[100px] -z-10 pointer-events-none"></div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2 lg:px-4">
                <div className="flex items-center gap-5">
                    <div className="p-4 lg:p-5 rounded-[2.25rem] bg-gradient-to-br from-teal-500 via-teal-400 to-cyan-500 text-white shadow-xl shadow-teal-500/30 ring-1 ring-white/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                        <Building size={32} className="relative z-10" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-stone-600 mb-1">
                            公司營運成本管理
                        </h1>
                        <p className="text-stone-500 text-[11px] lg:text-xs font-black tracking-widest uppercase">
                            管理每月固定營運成本，自動攤提至各個進行中案件。
                        </p>
                    </div>
                </div>

                {/* Save Button - Top */}
                <button
                    onClick={handleSaveCost}
                    className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-8 py-3.5 rounded-[1.25rem] font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2.5 shrink-0 border border-teal-400/50"
                >
                    {costSaved ? (
                        <><Check size={16} strokeWidth={3} className="text-teal-200" /> 已儲存</>
                    ) : (
                        <><Save size={16} strokeWidth={2.5} /> 儲存設定</>
                    )}
                </button>
            </div>

            {/* Summary Card - Top */}
            <div className="bg-stone-900 relative overflow-hidden p-6 lg:p-8 rounded-[2.5rem] text-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-stone-800">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                                <Calculator size={18} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-teal-400 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300">
                                成本攤提摘要
                            </h4>
                        </div>
                        <span className="bg-stone-800/80 backdrop-blur-sm px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-black text-stone-400 border border-stone-700/50 tracking-widest uppercase shadow-inner">
                            共 <span className="text-white mx-1">{totalItemCount}</span> 筆費用項目
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] p-6 text-center hover:bg-white/10 transition-colors group">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3 group-hover:text-stone-300 transition-colors">每月固定成本</p>
                            <p className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                                <span className="text-xl text-stone-500 mr-1">$</span>
                                {editingTotalCost.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] p-6 text-center hover:bg-white/10 transition-colors group">
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3 group-hover:text-stone-300 transition-colors">進行中案件數</p>
                            <p className="text-3xl lg:text-4xl font-black text-teal-400 tracking-tight">
                                {activeProjectCount} <span className="text-[15px] font-black tracking-widest text-teal-600/60 ml-1">件</span>
                            </p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] p-6 text-center hover:bg-white/10 transition-colors group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3 group-hover:text-stone-300 transition-colors relative z-10">每案攤提金額</p>
                            <p className="text-3xl lg:text-4xl font-black text-orange-400 tracking-tight relative z-10 drop-shadow-lg shadow-orange-500/20">
                                <span className="text-xl text-orange-600/50 mr-1">$</span>
                                {activeProjectCount > 0 ? costPerProject.toLocaleString() : '—'}
                            </p>
                            <p className="text-[10px] tracking-widest uppercase text-stone-500 font-bold mt-2 relative z-10 group-hover:text-stone-400 transition-colors">
                                {activeProjectCount > 0 ? `月營運成本 ÷ ${activeProjectCount} 案` : '目前無進行中案件'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cost Category Cards */}
            <div className="space-y-4 relative z-10">
                {COST_CATEGORIES.map(({ key, label, icon, desc, placeholder }) => {
                    const items = editingCost[key] || [];
                    const categoryTotal = getCategoryTotal(items);
                    const isCollapsed = collapsedCategories.has(key);

                    return (
                        <div
                            key={key}
                            className={`bg-white/80 backdrop-blur-xl rounded-[2rem] border transition-all duration-300 overflow-hidden ${isCollapsed ? 'border-stone-200/60 shadow-sm hover:border-teal-200/50 hover:shadow-md' : 'border-teal-200/80 shadow-[0_8px_30px_rgb(20,184,166,0.12)]'
                                }`}
                        >
                            {/* Category Header - Clickable to expand/collapse */}
                            <button
                                onClick={() => toggleCategory(key)}
                                className={`w-full px-6 lg:px-8 py-5 flex items-center justify-between transition-colors ${isCollapsed ? 'hover:bg-stone-50/50' : 'bg-teal-50/30'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center shrink-0 leading-none">
                                        {icon}
                                    </div>
                                    <div className="text-left flex flex-col justify-center">
                                        <h4 className="text-[17px] font-black text-stone-800 tracking-tight">{label}</h4>
                                        <p className="text-[11px] text-stone-500 font-black tracking-widest uppercase mt-0.5">{desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="text-right flex flex-col justify-center">
                                        <span className="text-[17px] lg:text-[19px] font-black text-teal-600 tracking-tight">
                                            <span className="text-[13px] text-teal-400/80 mr-0.5">$</span>
                                            {categoryTotal.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-black tracking-widest uppercase text-stone-400 mt-0.5">
                                            {items.length} 筆
                                        </span>
                                    </div>
                                    <div className={`p-2.5 rounded-xl transition-all ${isCollapsed ? 'bg-stone-100 text-stone-400' : 'bg-teal-100 text-teal-600'}`}>
                                        {isCollapsed ? (
                                            <ChevronDown size={18} strokeWidth={3} />
                                        ) : (
                                            <ChevronUp size={18} strokeWidth={3} />
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Sub Items - Collapsible */}
                            <div className={`transition-all duration-300 ease-in-out origin-top ${isCollapsed ? 'grid grid-rows-[0fr] opacity-0' : 'grid grid-rows-[1fr] opacity-100'}`}>
                                <div className="overflow-hidden">
                                    <div className="px-6 lg:px-8 pb-6 border-t border-teal-100/50 bg-white/40">
                                        <div className="space-y-3 pt-6 pb-6 w-full max-w-2xl">
                                            {items.map((item, idx) => (
                                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 lg:p-4 rounded-[1.25rem] border border-stone-200/60 bg-white hover:border-teal-300 hover:shadow-md hover:-translate-y-0.5 transition-all group duration-300">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <span className="text-[10px] font-black text-stone-400 w-6 h-6 flex items-center justify-center bg-stone-50 rounded-full shrink-0 border border-stone-100 uppercase tracking-widest">
                                                            {String(idx + 1).padStart(2, '0')}
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => updateCostItem(key, item.id, 'name', e.target.value)}
                                                            placeholder={placeholder}
                                                            className="flex-1 bg-transparent border-none text-stone-800 text-[14px] font-bold px-2 py-1 focus:outline-none placeholder:text-stone-300 min-w-0"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto pl-9 sm:pl-0">
                                                        <div className="relative w-full sm:w-44 shrink-0">
                                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                                <span className="text-stone-400 text-[13px] font-black">$</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                value={item.amount || ''}
                                                                onChange={(e) => updateCostItem(key, item.id, 'amount', parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
                                                                placeholder="0"
                                                                className="w-full bg-stone-50/50 border border-stone-200/80 text-teal-800 text-[15px] font-black rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all text-right placeholder:text-stone-300 shadow-inner"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeCostItem(key, item.id)}
                                                            className="p-3 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all shrink-0 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                                                            title="刪除此筆"
                                                        >
                                                            <Trash2 size={16} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {items.length === 0 && (
                                                <div className="text-center py-8 text-[12px] font-black text-stone-400 uppercase tracking-widest border-2 border-dashed border-stone-200/80 rounded-2xl bg-stone-50/50">
                                                    尚未設定任何項目
                                                </div>
                                            )}
                                        </div>

                                        {/* Add Item Button */}
                                        <button
                                            onClick={() => addCostItem(key)}
                                            className="w-full max-w-2xl flex items-center justify-center gap-2 py-4 text-[11px] font-black text-teal-600 uppercase tracking-widest hover:bg-teal-50 rounded-2xl transition-all border-2 border-dashed border-teal-200 hover:border-teal-400 group focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                                        >
                                            <div className="p-1 rounded-full bg-teal-100 group-hover:bg-teal-200 transition-colors">
                                                <Plus size={14} strokeWidth={3} />
                                            </div>
                                            新增{label}細項
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Save Button */}
            <button
                onClick={handleSaveCost}
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-5 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-teal-400/30 relative z-10"
            >
                {costSaved ? (
                    <><Check size={18} strokeWidth={3} className="text-teal-200" /> 已成功儲存成本設定</>
                ) : (
                    <><Save size={18} strokeWidth={2.5} /> 儲存公司營運成本設定</>
                )}
            </button>

            {/* Info Hint */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50/50 border border-teal-100/60 p-6 lg:p-8 rounded-[2.25rem] shadow-sm relative z-10 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none">
                    <Info size={120} strokeWidth={3} className="text-teal-500" />
                </div>
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 relative z-10">
                    <div className="p-3.5 bg-white rounded-[1.25rem] shadow-sm border border-teal-100 shrink-0 text-teal-500">
                        <Info size={24} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-3 pt-1">
                        <p className="text-[14px] font-black text-teal-900 tracking-tight">什麼是公司基本成本攤提？</p>
                        <p className="text-[12px] text-teal-800/80 leading-relaxed font-bold max-w-3xl">
                            公司每月有固定的營運開銷（房租、電話、保險、勞健保、車輛、貸款等），這些成本需要分攤到每個進行中的案件上，才能在報價時涵蓋這些間接成本，確保每個案件都能真正獲利。
                        </p>
                        <div className="inline-block mt-2 bg-white/70 px-5 py-3 rounded-xl border border-teal-200/50 backdrop-blur-sm">
                            <p className="text-[11px] text-teal-700 font-black tracking-widest uppercase flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                                攤提金額 = 每月總固定成本 ÷ 進行中的案件數量
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyManagement;
