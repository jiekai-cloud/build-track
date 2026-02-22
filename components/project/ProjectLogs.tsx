import React, { useState, useRef } from 'react';
import { Activity, Trash2, ZoomIn, CalendarDays, Pencil, Loader2, Sparkles, X, ImageIcon } from 'lucide-react';
import { Project, ProjectFile } from '../../types';
import { useProject } from '../../contexts/ProjectContext';
import { refineSiteNotes, analyzeSitePhoto } from '../../services/geminiService';
import { cloudFileService } from '../../services/cloudFileService';
import ProjectDiscussionChecklist from './ProjectDiscussionChecklist';

const ProjectLogs: React.FC = () => {
    const {
        project,
        isReadOnly,
        onDeleteDailyLog,
        onAddDailyLog,
        onImageClick
    } = useProject();
    const [logContent, setLogContent] = useState('');
    const [logPhotos, setLogPhotos] = useState<string[]>([]);
    const [isUploadingLog, setIsUploadingLog] = useState(false);
    const [isRefiningNotes, setIsRefiningNotes] = useState(false);
    const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
    const logFileInputRef = useRef<HTMLInputElement>(null);

    const handleRefineNotes = async () => {
        if (!logContent.trim()) return;
        setIsRefiningNotes(true);
        try {
            const refined = await refineSiteNotes(logContent);
            if (refined) {
                setLogContent(refined);
            }
        } catch (err) {
            console.error('優化日誌失敗:', err);
            alert('AI 優化失敗，請檢查金鑰或網路連線');
        } finally {
            setIsRefiningNotes(false);
        }
    };

    const handleAnalyzePhoto = async (photoUrl: string) => {
        setIsAnalyzingPhoto(true);
        try {
            // 由於 Gemini 需要 base64，我們需要先抓取圖片轉成 base64
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            const base64 = await new Promise<string>((resolve) => {
                reader.onload = () => {
                    const res = reader.result as string;
                    resolve(res.split(',')[1]);
                };
                reader.readAsDataURL(blob);
            });

            const analysis = await analyzeSitePhoto(base64);
            if (analysis) {
                setLogContent(prev => prev ? `${prev}\n\n[AI 分析]\n${analysis}` : analysis);
            }
        } catch (err) {
            console.error('分析照片失敗:', err);
            alert('AI 分析照片失敗');
        } finally {
            setIsAnalyzingPhoto(false);
        }
    };

    const handleLogPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        setIsUploadingLog(true);
        const files = Array.from(e.target.files);
        const newWorkerPhotoUrls: string[] = [];

        try {
            for (const file of files) {
                const result = await cloudFileService.uploadFile(file);
                if (result && result.url) {
                    newWorkerPhotoUrls.push(result.url);
                }
            }
            setLogPhotos(prev => [...prev, ...newWorkerPhotoUrls]);
        } catch (err) {
            console.error('上傳失敗:', err);
            alert('照片上傳失敗，請稍後再試');
        } finally {
            setIsUploadingLog(false);
            if (logFileInputRef.current) logFileInputRef.current.value = '';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-full lg:overflow-hidden animate-in fade-in">
            {/* 左側：施工日誌時間軸 */}
            <div className="lg:col-span-8 flex flex-col bg-white rounded-3xl border border-stone-200 shadow-sm lg:overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-orange-600" />
                        <h3 className="font-black text-xs uppercase tracking-widest">專案討論區</h3>
                    </div>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{project.dailyLogs?.length || 0} 筆紀錄</span>
                </div>

                <div className="flex-1 lg:overflow-y-auto p-6 space-y-8 touch-scroll no-scrollbar">
                    {project.dailyLogs && project.dailyLogs.length > 0 ? (
                        [...project.dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                            <div key={log.id} className="relative pl-8 group">
                                {/* Timeline Line */}
                                <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-stone-100 group-last:bg-transparent"></div>
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white bg-orange-500 shadow-sm z-10 transition-transform group-hover:scale-110"></div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-stone-900">
                                                {log.date ? new Date(log.date).toLocaleString('zh-TW', { hour12: false }) : '無日期'}
                                            </span>
                                            <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded-full font-bold text-stone-500 uppercase">{log.authorName}</span>
                                        </div>
                                        {!isReadOnly && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('確定要刪除這條紀錄嗎？')) {
                                                        onDeleteDailyLog(log.id);
                                                    }
                                                }}
                                                className="p-1.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="bg-stone-50/50 hover:bg-stone-50 p-4 rounded-2xl border border-stone-100 transition-colors">
                                        <p className="text-xs font-medium text-stone-700 leading-relaxed whitespace-pre-wrap">{log.content}</p>

                                        {log.photoUrls && log.photoUrls.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                                                {log.photoUrls.map((url, pIdx) => (
                                                    <div key={pIdx} className="aspect-square rounded-xl overflow-hidden border border-stone-200 shadow-sm group/photo relative cursor-zoom-in" onClick={() => onImageClick({ id: url, url, name: '施工照片', type: 'image', size: 0, uploadDate: log.date } as any)}>
                                                        <img src={url} alt="施工現場" className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center">
                                                            <ZoomIn size={20} className="text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-4 opacity-50 py-20">
                            <CalendarDays size={48} />
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest">目前尚無討論紀錄</p>
                                <p className="text-[9px] font-bold mt-1">開始記錄專案細節以建立完整的履歷</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 右側：紀錄輸入區 & 留言版摘要 */}
            <div className="lg:col-span-4 flex flex-col gap-6 lg:overflow-hidden">
                {/* 新增紀錄表單 */}
                {!isReadOnly && (
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm shrink-0">
                        <h4 className="font-black text-stone-900 uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">
                            <Pencil size={14} className="text-blue-600" /> 發起討論 / 紀錄
                        </h4>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!logContent.trim()) return;
                            onAddDailyLog({ content: logContent, photoUrls: logPhotos });
                            setLogContent('');
                            setLogPhotos([]);
                        }} className="space-y-4">
                            <div className="relative">
                                <textarea
                                    value={logContent}
                                    onChange={(e) => setLogContent(e.target.value)}
                                    required
                                    placeholder="輸入討論內容或紀錄... (您也可以輸入口語筆記後點擊 AI 優化)"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-blue-600/20 placeholder:text-stone-300 resize-none h-32"
                                ></textarea>
                                <button
                                    type="button"
                                    onClick={handleRefineNotes}
                                    disabled={isRefiningNotes || !logContent.trim()}
                                    className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md group"
                                >
                                    {isRefiningNotes ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="group-hover:rotate-12 transition-transform" />}
                                    {isRefiningNotes ? 'AI 優化中' : 'AI 專業優化'}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">現場照片 (點擊 AI 分析內容)</label>
                                    <span className="text-[9px] text-stone-400">{logPhotos.length} 張照片</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {logPhotos.map((url, idx) => (
                                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-stone-200 group">
                                            <img src={url} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAnalyzePhoto(url)}
                                                    disabled={isAnalyzingPhoto}
                                                    title="AI 分析這張照片"
                                                    className="bg-indigo-600 text-white p-1 rounded-md hover:bg-indigo-700 transition-colors"
                                                >
                                                    <Sparkles size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLogPhotos(prev => prev.filter((_, i) => i !== idx))}
                                                    className="bg-rose-600 text-white p-1 rounded-md hover:bg-rose-700 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => logFileInputRef.current?.click()}
                                        disabled={isUploadingLog}
                                        className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50"
                                    >
                                        {isUploadingLog ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                        <span className="text-[9px] font-bold">{isUploadingLog ? '上傳中' : '新增'}</span>
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={logFileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleLogPhotoUpload}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isUploadingLog || !logContent.trim()}
                                className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingLog ? '照片上傳中...' : '提交內容'}
                            </button>
                        </form>
                    </div>
                )}

                {/* 預設待辦清單 (專案討論版) */}
                <ProjectDiscussionChecklist />
            </div>
        </div>
    );
};

export default ProjectLogs;
