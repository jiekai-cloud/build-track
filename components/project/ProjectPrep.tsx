
import React, { useState, useRef } from 'react';
import { ExternalLink, Sparkles, Loader2, Wrench, Lock, ClipboardList, FileImage, Upload, FileText, X, Construction } from 'lucide-react';
import { Project, ProjectPreConstruction } from '../../types';
import { generatePreConstructionPrep } from '../../services/geminiService';
import { cloudFileService } from '../../services/cloudFileService';

interface ProjectPrepProps {
    project: Project;
    isReadOnly: boolean;
    onUpdatePreConstruction: (data: ProjectPreConstruction) => void;
    onImageClick?: (image: { url: string; category: string }) => void;
}

const ProjectPrep: React.FC<ProjectPrepProps> = ({ project, isReadOnly, onUpdatePreConstruction, onImageClick }) => {
    const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
    const [localMaterials, setLocalMaterials] = useState(project.preConstruction?.materialsAndTools || '');
    const [localNotice, setLocalNotice] = useState(project.preConstruction?.notice || '');
    const scopeDrawingInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setLocalMaterials(project.preConstruction?.materialsAndTools || '');
        setLocalNotice(project.preConstruction?.notice || '');
    }, [project.id, project.updatedAt]);

    return (
        <div className="p-4 lg:p-8 space-y-6 animate-in fade-in lg:overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center sm:bg-white/50 sm:p-4 sm:rounded-2xl">
                <div>
                    <h2 className="text-xl font-black text-stone-900 leading-none mb-1">施工前準備事項</h2>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">材料核對 / 施工公告 / 範圍圖面</p>
                        {project.contractUrl && (
                            <a href={project.contractUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-black flex items-center gap-1 border border-blue-100 animate-pulse">
                                <ExternalLink size={10} /> 參考合約已就緒
                            </a>
                        )}
                    </div>
                </div>
                {!isReadOnly && (
                    <button
                        onClick={async () => {
                            setIsGeneratingPrep(true);
                            try {
                                const result = await generatePreConstructionPrep(project);
                                onUpdatePreConstruction({
                                    ...project.preConstruction,
                                    ...result,
                                    updatedAt: new Date().toISOString()
                                });
                            } catch (e: any) {
                                alert(`AI 產生失敗: ${e.message || '未知錯誤'}`);
                            } finally {
                                setIsGeneratingPrep(false);
                            }
                        }}
                        disabled={isGeneratingPrep}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-slate-100"
                    >
                        {isGeneratingPrep ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-400" />}
                        {isGeneratingPrep ? 'AI 規劃中...' : 'AI 輔助規劃'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 材料及機具 */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner">
                            <Wrench size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-stone-900 uppercase block">材料及機具清單</span>
                            <span className="text-[9px] text-stone-400 font-bold">MATERIALS & TOOLS</span>
                        </div>
                    </div>
                    <div className="relative group">
                        <textarea
                            readOnly={isReadOnly}
                            className={`w-full min-h-[250px] bg-stone-50/30 border border-stone-100 rounded-[1.5rem] p-5 text-sm font-bold text-stone-700 outline-none focus:ring-4 focus:ring-orange-500/5 transition-all no-scrollbar leading-relaxed ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                            placeholder="請描述此案所需材料與工具，或點擊上方「AI 輔助」自動生成..."
                            value={localMaterials}
                            onChange={(e) => setLocalMaterials(e.target.value)}
                            onBlur={() => onUpdatePreConstruction({ ...project.preConstruction, materialsAndTools: localMaterials, updatedAt: new Date().toISOString() })}
                        />
                        {isReadOnly && (
                            <div className="absolute top-4 right-4 text-stone-300 pointer-events-none">
                                <Lock size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 施工公告 */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                            <ClipboardList size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-stone-900 uppercase block">施工正式公告</span>
                            <span className="text-[9px] text-stone-400 font-bold">OFFICIAL NOTICE</span>
                        </div>
                    </div>
                    <div className="relative group">
                        <textarea
                            readOnly={isReadOnly}
                            className={`w-full min-h-[250px] bg-stone-50/30 border border-stone-100 rounded-[1.5rem] p-5 text-sm font-bold text-stone-700 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all no-scrollbar leading-relaxed ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                            placeholder="請輸入公告內容，或使用 AI 產生標準範本..."
                            value={localNotice}
                            onChange={(e) => setLocalNotice(e.target.value)}
                            onBlur={() => onUpdatePreConstruction({ ...project.preConstruction, notice: localNotice, updatedAt: new Date().toISOString() })}
                        />
                        {isReadOnly && (
                            <div className="absolute top-4 right-4 text-stone-300 pointer-events-none">
                                <Lock size={16} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 施工範圍圖面 */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                            <FileImage size={18} />
                        </div>
                        <div>
                            <span className="text-xs font-black text-stone-900 uppercase block">施工範圍示意圖</span>
                            <span className="text-[9px] text-stone-400 font-bold">SCOPE DRAWING / MAP</span>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <button
                            onClick={() => scopeDrawingInputRef.current?.click()}
                            className="px-4 py-2 border border-emerald-100 text-emerald-600 bg-emerald-50/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center gap-2"
                        >
                            <Upload size={14} /> 上傳圖面
                        </button>
                    )}
                </div>

                <input
                    type="file"
                    className="hidden"
                    ref={scopeDrawingInputRef}
                    accept="image/*,.pdf"
                    multiple
                    onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                            try {
                                const results = await Promise.all(files.map(f => cloudFileService.uploadFile(f)));
                                const validUrls = results
                                    .filter((res): res is { id: string; url: string } => !!res)
                                    .map(res => res.url);

                                if (validUrls.length > 0) {
                                    onUpdatePreConstruction({
                                        ...project.preConstruction,
                                        scopeDrawings: [
                                            ...(project.preConstruction?.scopeDrawings || []),
                                            ...validUrls
                                        ],
                                        updatedAt: new Date().toISOString()
                                    });
                                }
                            } catch (err) {
                                alert('圖面附件上傳失敗');
                                console.error(err);
                            }
                        }
                    }}
                />

                {/* Display Scope Drawings (Mixed Legacy & New) */}
                {(() => {
                    const allDrawings = [
                        ...(project.preConstruction?.scopeDrawingUrl ? [project.preConstruction.scopeDrawingUrl] : []),
                        ...(project.preConstruction?.scopeDrawings || [])
                    ];
                    return allDrawings.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {allDrawings.map((rawUrl, index) => {
                                const url = String(rawUrl || '');
                                return (
                                    <div key={index} className="relative aspect-video rounded-[1.5rem] overflow-hidden border border-stone-100 group bg-stone-50">
                                        {url.toLowerCase().endsWith('.pdf') ? (
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full h-full flex flex-col items-center justify-center text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <FileText size={32} />
                                                <span className="text-[10px] font-black mt-2 uppercase tracking-widest">PDF 文件</span>
                                            </a>
                                        ) : (
                                            <img
                                                src={url}
                                                alt={`施工範圍圖-${index + 1}`}
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => onImageClick?.({ url, category: '施工範圍圖' })}
                                            />
                                        )}
                                        {!isReadOnly && (
                                            <button
                                                onClick={() => {
                                                    if (!confirm('確認移除此圖面？')) return;

                                                    const legacyUrl = project.preConstruction?.scopeDrawingUrl;
                                                    let newScopeDrawings = [...(project.preConstruction?.scopeDrawings || [])];

                                                    if (url === legacyUrl || String(legacyUrl) === url) {
                                                        // Remove legacy
                                                        onUpdatePreConstruction({
                                                            ...project.preConstruction,
                                                            scopeDrawingUrl: undefined,
                                                            updatedAt: new Date().toISOString()
                                                        });
                                                    } else {
                                                        newScopeDrawings = newScopeDrawings.filter(u => String(u) !== url);
                                                        onUpdatePreConstruction({
                                                            ...project.preConstruction,
                                                            scopeDrawings: newScopeDrawings,
                                                            updatedAt: new Date().toISOString()
                                                        });
                                                    }
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    ) : (
                        <div className="aspect-video bg-stone-50/50 rounded-[2rem] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-sm">
                                <Construction size={32} className="opacity-20" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">尚未上傳範圍圖面</p>
                            {!isReadOnly && (
                                <button onClick={() => scopeDrawingInputRef.current?.click()} className="text-[10px] font-black text-emerald-600 border-b border-emerald-600/30 pb-0.5 hover:border-emerald-600 transition-all">
                                    點擊此處立即上傳
                                </button>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default ProjectPrep;
