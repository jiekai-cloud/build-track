import React from 'react';
import { Sparkles, Activity, ZoomIn } from 'lucide-react';
import { Project } from '../../types';

interface ProjectInspectionProps {
    project: Project;
}

const ProjectInspection: React.FC<ProjectInspectionProps> = ({ project }) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            {project.inspectionData ? (
                <>
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Sparkles size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="bg-white/10 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md">智慧抓漏系統診斷</div>
                            <h3 className="text-3xl font-black mb-2 leading-tight">AI 診斷結果</h3>
                            <p className="text-indigo-200 text-sm font-medium opacity-80 mb-6">診斷時間：{project.inspectionData.timestamp}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3">病灶判定 Diagnosis</h4>
                                    <p className="text-sm leading-relaxed">{project.inspectionData.diagnosis}</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                    <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-3">建議對策 Suggestion</h4>
                                    <p className="text-sm leading-relaxed">{project.inspectionData.suggestedFix}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">現場採樣照片 Original Samples</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {project.inspectionData.originalPhotos.map((url, i) => (
                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-stone-100 shadow-sm group relative">
                                        <img src={url} alt={`會勘照片 ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ZoomIn className="text-white" size={24} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">AI 深度分析 AI Inference</h4>
                            <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm">
                                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                                    <Activity size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">特徵識別</span>
                                </div>
                                <p className="text-xs text-stone-600 leading-relaxed italic">"{project.inspectionData.aiAnalysis}"</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center text-stone-300 gap-4 opacity-50">
                    <Sparkles size={64} className="animate-pulse" />
                    <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-widest">此專案尚未有關聯的 AI 會勘數據</p>
                        <p className="text-[10px] font-bold mt-1">您可以手動輸入會勘資料或等待系統自動串聯</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectInspection;
