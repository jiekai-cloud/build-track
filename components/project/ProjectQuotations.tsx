import React from 'react';
import { Plus, Receipt, Trash2, Edit2 } from 'lucide-react';
import { Project, Quotation } from '../../types';
import { useProject } from '../../contexts/ProjectContext';

const ProjectQuotations: React.FC = () => {
    const {
        project,
        quotations,
        isReadOnly,
        onNavigateToQuotation,
        onDeleteQuotation
    } = useProject();
    const projectQuotations = quotations.filter(q => !q.deletedAt && (q.projectId === project.id || q.convertedProjectId === project.id));

    return (
        <div className="animate-in fade-in space-y-6 h-full overflow-y-auto p-1">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-stone-900">專案報價單</h3>
                    <p className="text-sm text-stone-500 font-bold">管理此專案的所有報價紀錄</p>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={() => onNavigateToQuotation(project.id)}
                        className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200 active:scale-95"
                    >
                        <Plus size={16} /> 新增報價單
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectQuotations.map(q => (
                    <div key={q.id} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group relative cursor-pointer" onClick={() => onNavigateToQuotation(project.id, q.id)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="bg-stone-100 text-stone-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider w-fit">{q.quotationNumber}</span>
                                <span className="text-[10px] text-stone-400 font-bold">v{q.version} • {q.createdAt ? q.createdAt.split('T')[0] : '無日期'}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                q.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                                    'bg-orange-100 text-orange-600'
                                }`}>{q.status === 'approved' ? '已核准' : q.status === 'rejected' ? '已駁回' : q.status === 'sent' ? '已送出' : '草稿'}</span>
                        </div>
                        <h4 className="text-lg font-black text-stone-900 mb-4 line-clamp-2 min-h-[3.5rem]">{q.header.projectName}</h4>

                        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                            <span className="text-xs font-black text-stone-400 uppercase tracking-widest">總金額</span>
                            <span className="text-lg font-black text-stone-900 font-mono">${(q.options[q.selectedOptionIndex]?.summary.totalAmount || 0).toLocaleString()}</span>
                        </div>

                        <div className="absolute top-4 right-4 flex gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm">
                            {!isReadOnly && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`確定要刪除報價單 ${q.quotationNumber} 嗎？此動作無法復原。`)) {
                                            onDeleteQuotation?.(q.id);
                                        }
                                    }}
                                    className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors"
                                    title="刪除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <div className="p-1 text-stone-400 hover:text-blue-600">
                                <Edit2 size={16} />
                            </div>
                        </div>
                    </div>
                ))}
                {projectQuotations.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-300 gap-4 opacity-50 border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50/50">
                        <Receipt size={48} />
                        <p className="text-xs font-black uppercase tracking-widest">尚無報價單</p>
                        {!isReadOnly && <p className="text-[10px] font-bold">點擊右上角按鈕建立第一張報價單</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectQuotations;
