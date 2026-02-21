
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
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-200/50">
                        <Building size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-stone-900 tracking-tight">公司營運成本管理</h1>
                        <p className="text-sm text-stone-500 font-medium">管理每月固定營運成本，自動攤提至各個進行中案件。</p>
                    </div>
                </div>

                {/* Save Button - Top */}
                <button
                    onClick={handleSaveCost}
                    className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-teal-100 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0"
                >
                    {costSaved ? (
                        <><Check size={14} /> 已儲存</>
                    ) : (
                        <><Save size={14} /> 儲存設定</>
                    )}
                </button>
            </div>

            {/* Summary Card - Top */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6 lg:p-8 rounded-[2rem] text-white shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Calculator size={20} className="text-teal-400" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-teal-400">成本攤提摘要</h4>
                    <span className="text-[10px] font-bold text-stone-500 ml-auto">共 {totalItemCount} 筆費用項目</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">每月固定成本</p>
                        <p className="text-2xl lg:text-3xl font-black text-white">
                            ${editingTotalCost.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">進行中案件數</p>
                        <p className="text-2xl lg:text-3xl font-black text-emerald-400">
                            {activeProjectCount} <span className="text-sm text-stone-400">件</span>
                        </p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">每案攤提金額</p>
                        <p className="text-2xl lg:text-3xl font-black text-orange-400">
                            {activeProjectCount > 0 ? `$${costPerProject.toLocaleString()}` : '—'}
                        </p>
                        <p className="text-[10px] text-stone-500 font-bold mt-1">
                            {activeProjectCount > 0 ? `月營運成本 ÷ ${activeProjectCount} 案` : '目前無進行中案件'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cost Category Cards */}
            <div className="space-y-3">
                {COST_CATEGORIES.map(({ key, label, icon, desc, placeholder }) => {
                    const items = editingCost[key] || [];
                    const categoryTotal = getCategoryTotal(items);
                    const isCollapsed = collapsedCategories.has(key);

                    return (
                        <div
                            key={key}
                            className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:border-teal-200 transition-all"
                        >
                            {/* Category Header - Clickable to expand/collapse */}
                            <button
                                onClick={() => toggleCategory(key)}
                                className="w-full px-5 lg:px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{icon}</span>
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-stone-900">{label}</h4>
                                        <p className="text-[10px] text-stone-400 font-bold">{desc}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="text-sm font-black text-teal-600">
                                            ${categoryTotal.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-bold text-stone-300 ml-2">
                                            {items.length} 筆
                                        </span>
                                    </div>
                                    {isCollapsed ? (
                                        <ChevronDown size={16} className="text-stone-300" />
                                    ) : (
                                        <ChevronUp size={16} className="text-stone-300" />
                                    )}
                                </div>
                            </button>

                            {/* Sub Items - Collapsible */}
                            {!isCollapsed && (
                                <div className="px-5 lg:px-6 pb-4 space-y-2 border-t border-stone-100 pt-3 animate-in slide-in-from-top-2 duration-200">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-2 animate-in fade-in duration-200">
                                            <span className="text-[10px] font-black text-stone-300 w-5 text-center shrink-0">{idx + 1}</span>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => updateCostItem(key, item.id, 'name', e.target.value)}
                                                placeholder={placeholder}
                                                className="flex-1 bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder:text-stone-300 min-w-0"
                                            />
                                            <div className="relative w-32 shrink-0">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs font-bold">$</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.amount || ''}
                                                    onChange={(e) => updateCostItem(key, item.id, 'amount', Number(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-xs font-bold rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-right placeholder:text-stone-300"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeCostItem(key, item.id)}
                                                className="p-1.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
                                                title="刪除此筆"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Item Button */}
                                    <button
                                        onClick={() => addCostItem(key)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-black text-teal-600 uppercase tracking-widest hover:bg-teal-50 rounded-xl transition-all border border-dashed border-teal-200 hover:border-teal-400"
                                    >
                                        <Plus size={12} />
                                        新增{label}細項
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Save Button */}
            <button
                onClick={handleSaveCost}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-teal-100 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
                {costSaved ? (
                    <><Check size={16} /> 已儲存</>
                ) : (
                    <><Save size={16} /> 儲存公司成本設定</>
                )}
            </button>

            {/* Info Hint */}
            <div className="bg-teal-50 border border-teal-100 p-6 rounded-2xl space-y-2">
                <div className="flex items-start gap-3">
                    <Info className="text-teal-600 mt-0.5 shrink-0" size={16} />
                    <div className="space-y-1">
                        <p className="text-xs font-black text-teal-900">什麼是公司基本成本攤提？</p>
                        <p className="text-[11px] text-teal-700 leading-relaxed font-bold">
                            公司每月有固定的營運開銷（房租、電話、保險、勞健保、車輛、貸款等），這些成本需要分攤到每個進行中的案件上，
                            才能在報價時涵蓋這些間接成本，確保每個案件都能真正獲利。
                        </p>
                        <p className="text-[11px] text-teal-700 leading-relaxed font-bold">
                            攤提金額 = 每月總固定成本 ÷ 進行中的案件數量
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyManagement;
